'use strict';

require('@babel/register');

const Pilot = require('../orm/models/pilots').default;
const Site = require('../orm/models/sites').default;
const Flight = require('../orm/models/flights').default;
const Distance = require('../utils/distance').default;
const readline = require('readline');

const DISTANCE_THRESHOLD = parseInt(process.argv[2]) || 100;

function prompt(query) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

function formatSite(site) {
  const coords = site.lat && site.lng
    ? `${parseFloat(site.lat).toFixed(4)}, ${parseFloat(site.lng).toFixed(4)}`
    : 'no coords';
  return `  #${site.id} "${site.name}" pilotId=${site.pilotId} [${coords}] flights=${site.flightCount || 0}`;
}

async function main() {
  console.log('\n=== Merge Duplicate Sites ===');
  console.log(`Distance threshold: ${DISTANCE_THRESHOLD}m\n`);

  const allSites = await Site.findAll({
    where: { see: true },
    order: [ ['name', 'ASC'] ]
  });

  // Count flights per site
  const flightCounts = {};
  const flights = await Flight.findAll({ where: { see: true }, attributes: [ 'siteId' ] });
  flights.forEach(f => {
    const sid = f.siteId;
    flightCounts[sid] = (flightCounts[sid] || 0) + 1;
  });
  allSites.forEach(s => {
 s.flightCount = flightCounts[s.id] || 0;
});

  // Group by lowercase name
  const groups = {};
  allSites.forEach(site => {
    const key = site.name.trim().toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(site);
  });

  const duplicateNames = Object.entries(groups).filter(([, sites]) => sites.length > 1);

  if (duplicateNames.length === 0) {
    console.log('No duplicate site names found. Nothing to do.\n');
    process.exit(0);
  }

  console.log(`Found ${duplicateNames.length} site name(s) with duplicates:\n`);

  const mergePlan = [];
  const renamePlan = [];

  for (const [, sites] of duplicateNames) {
    console.log(`"${sites[0].name}" (${sites.length} entries):`);
    sites.forEach(s => console.log(formatSite(s)));

    // Separate sites with and without coordinates
    const withCoords = sites.filter(s => s.lat !== null && s.lng !== null);
    const withoutCoords = sites.filter(s => s.lat === null || s.lng === null);

    if (withCoords.length <= 1 && withoutCoords.length <= 1) {
      console.log('  → Not enough data to compare, keeping first, renaming rest\n');
      const kept = sites[0];
      for (let i = 1; i < sites.length; i++) {
        renamePlan.push({ site: sites[i], kept });
      }
      continue;
    }

    // Build clusters from sites with coordinates
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < withCoords.length; i++) {
      if (assigned.has(i)) continue;
      const cluster = [ withCoords[i] ];
      assigned.add(i);
      for (let j = i + 1; j < withCoords.length; j++) {
        if (assigned.has(j)) continue;
        const dist = Distance.getDistance(
          parseFloat(withCoords[i].lat), parseFloat(withCoords[i].lng),
          parseFloat(withCoords[j].lat), parseFloat(withCoords[j].lng)
        );
        if (dist <= DISTANCE_THRESHOLD) {
          cluster.push(withCoords[j]);
          assigned.add(j);
        }
      }
      clusters.push(cluster);
    }

    // Assign sites without coordinates to clusters (one per cluster)
    const remainingNoCoord = [ ...withoutCoords ];
    for (const cluster of clusters) {
      if (remainingNoCoord.length === 0) break;
      cluster.push(remainingNoCoord.shift());
    }

    // Decide: merge each cluster, rename remaining
    for (const cluster of clusters) {
      if (cluster.length > 1) {
        // Keep the one with most flights, or most info, or first
        cluster.sort((a, b) => (b.flightCount - a.flightCount) || (b.id - a.id));
        const kept = cluster[0];
        console.log(`  → Merge ${cluster.length} sites into #${kept.id} "${kept.name}"`);
        for (let i = 1; i < cluster.length; i++) {
          mergePlan.push({ toMerge: cluster[i], into: kept });
        }
      }
    }

    for (const site of remainingNoCoord) {
      console.log(`  → Hide #${site.id} "${site.name}" (no nearby coords)`);
      renamePlan.push({ site, kept: null });
    }

    console.log('');
  }

  // Summary
  let totalMerged = 0;
  const mergeFlightUpdates = {};
  mergePlan.forEach(({ toMerge, into }) => {
    totalMerged++;
    const count = flightCounts[toMerge.id] || 0;
    if (count > 0) {
      mergeFlightUpdates[toMerge.id] = { intoId: into.id, count };
    }
  });

  console.log('=== Summary ===');
  console.log(`  Sites to merge: ${totalMerged}`);
  const affectedFlights = Object.values(mergeFlightUpdates).reduce((s, v) => s + v.count, 0);
  console.log(`  Flights to update: ${affectedFlights}`);
  console.log(`  Sites to rename (no coords): ${renamePlan.length}\n`);

  const answer = await prompt('Proceed? (yes/no): ');
  if (answer.toLowerCase() !== 'yes') {
    console.log('Aborted.\n');
    process.exit(0);
  }

  // Execute merge
  for (const { toMerge, into } of mergePlan) {
    const count = flightCounts[toMerge.id] || 0;
    if (count > 0) {
      await Flight.update(
        { siteId: into.id },
        { where: { siteId: toMerge.id } }
      );
      console.log(`  Updated ${count} flight(s): site ${toMerge.id} → ${into.id}`);
    }

    const mergeRemarks = toMerge.remarks;

    // Delete merged site first to avoid uniqueness conflicts when updating kept site
    await toMerge.destroy();
    console.log(`  Deleted site #${toMerge.id} (merged into #${into.id})`);

    // Merge remarks
    if (mergeRemarks) {
      const mergedRemarks = [into.remarks, mergeRemarks].filter(Boolean).join('\n---\n');
      if (mergedRemarks !== into.remarks) {
        await into.update({ remarks: mergedRemarks });
        console.log(`  Merged remarks from #${toMerge.id} into #${into.id}`);
      }
    }
  }

  // Execute rename — suffix unmatched sites without coords with pilot name
  for (const { site } of renamePlan) {
    const pilot = await Pilot.findByPk(site.pilotId);
    const suffix = pilot && pilot.userName ? ` (${pilot.userName})` : ' duplicate';
    const newName = site.name + suffix;
    console.log(`  Renaming #${site.id} "${site.name}" → "${newName}"`);
    await site.update({ name: newName }, { validate: false });
  }

  console.log('\nDone.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

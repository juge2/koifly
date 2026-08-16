import errorTypes from '../../errors/error-types';
import getPilotValuesForFrontend, { computePilotStats } from './get-pilot-values';
import KoiflyError from '../../errors/error';
import ormConstants from '../../constants/orm-constants';
import Sequelize from 'sequelize';

import Buddy from '../../orm/models/buddies';
import Flight from '../../orm/models/flights';
import Site from '../../orm/models/sites';
import Glider from '../../orm/models/gliders';
import Pilot from '../../orm/models/pilots';


/**
 * @param {Object[]} sequelizeRecordInstances - DB records set
 * @returns {Object[]} array of DB records with plain values
 * or in case of deleted instance just its id and deleted date
 * Note: this method was designed for use with sequelize record instances
 * which can be deleted (have property 'see')
 * don't use it for pilot records
 */
function getRecordsValues(sequelizeRecordInstances) {
  return sequelizeRecordInstances.map(record => {
    // If instance was deleted
    // user doesn't need its content
    if (!record.see) {
      return {
        id: record.id,
        see: false,
        updatedAt: record.updatedAt
      };
    }
    // {plain = true} will only return the values of sequelize record instance
    // (omits sequelize methods and additional stuff)
    return record.get({ plain: true });
  });
}


/**
 * @param {object} pilot - sequelize pilot instance
 * @param {string|null} dateFrom - If provided, only changes since that date are returned
 * @returns {Promise.<{pilot: Object[], flights: Object[], sites: Object[], gliders: Object[], lastModified: string}>}
 * lastModified - is the date of last modification in DB
 */
function getAllData(pilot, dateFrom) {
  const result = {};

  // If no dateFrom => it's first request from the user, so retrieve all data
  // Use 'list' scope (excludes IGC blobs) for initial load, 'visible' for incremental
  const scope = dateFrom ? ormConstants.SCOPES.visible : ormConstants.SCOPES.list;

  // We are sending all the data to the browser along with the latest date at which DB records were modified
  // So front-end can compare it with the latest date it has in its store
  // And update data if needed
  let maxLastModified = pilot.updatedAt;

  const whereQuery = { pilotId: pilot.id };
  const siteWhereQuery = {};
  if (dateFrom) {
    whereQuery.updatedAt = { [Sequelize.Op.gt]: dateFrom };
    siteWhereQuery.updatedAt = { [Sequelize.Op.gt]: dateFrom };
    maxLastModified = dateFrom > maxLastModified ? dateFrom : maxLastModified;
  }

  // Promise.all resolves only if every promises in the given list resolves
  return Promise
    .all([
      // parallel asynchronous requests
      Flight.scope(scope).findAll({ where: whereQuery }),
      Site.scope(scope).findAll({ where: siteWhereQuery }),
      Glider.scope(scope).findAll({ where: whereQuery }),
      getBuddyRecords(pilot.id)
    ])
    .then(recordsSet => {
      // Values appear in the same order as we requested for them
      const ownFlights = getRecordsValues(recordsSet[0]);
      result.flights = ownFlights;
      result.sites = getRecordsValues(recordsSet[1]);
      result.gliders = getRecordsValues(recordsSet[2]);
      result.buddies = recordsSet[3];

      // Add pilotName to own items
      const ownName = pilot.userName || pilot.email;
      addPilotName(result.flights, ownName);
      addPilotName(result.gliders, ownName);

      // Fetch accepted buddies' flights and gliders and merge in
      const acceptedBuddies = recordsSet[3].filter(b => b.status === 'accepted');

      if (acceptedBuddies.length > 0) {
        // Batch fetch all buddy flights/gliders in single query using IN clause
        const buddyPilotIds = acceptedBuddies.map(b => b.otherPilot.id);
        const buddyWhere = { pilotId: { [Sequelize.Op.in]: buddyPilotIds } };
        if (dateFrom) {
          buddyWhere.updatedAt = { [Sequelize.Op.gt]: dateFrom };
        }

        // Limit initial buddy data load to prevent timeout (incremental loads use updatedAt filter)
        const buddyLimit = dateFrom ? null : 100;

        return Promise.all([
          Flight.scope(scope).findAll({ where: buddyWhere, limit: buddyLimit, order: [ ['updatedAt', 'DESC'] ] }),
          Glider.scope(scope).findAll({ where: buddyWhere })
        ]).then(([buddyFlights, buddyGliders]) => {
          // Group by pilotId for efficient merging
          const flightsByPilot = {};
          const glidersByPilot = {};
          buddyFlights.forEach(f => {
            (flightsByPilot[f.pilotId] = flightsByPilot[f.pilotId] || []).push(f);
          });
          buddyGliders.forEach(g => {
            (glidersByPilot[g.pilotId] = glidersByPilot[g.pilotId] || []).push(g);
          });

          acceptedBuddies.forEach(buddy => {
            const buddyName = buddy.otherPilot.userName || buddy.otherPilot.email;
            const pilotId = buddy.otherPilot.id;

            (flightsByPilot[pilotId] || []).forEach(f => {
              if (f.see !== false) f.pilotName = buddyName;
              result.flights.push(f);
            });
            (glidersByPilot[pilotId] || []).forEach(g => {
              if (g.see !== false) g.pilotName = buddyName;
              result.gliders.push(g);
            });
          });

          return finalizeResult(result, maxLastModified, pilot, ownFlights);
        });
      }

      return finalizeResult(result, maxLastModified, pilot, ownFlights);
    })
    .catch(() => {
      throw new KoiflyError(errorTypes.DB_READ_ERROR);
    });
}

export default getAllData;


/**
 * Adds pilotName to all visible items in the given array.
 * @param {Object[]} records
 * @param {string} name
 */
function addPilotName(records, name) {
  records.forEach(r => {
    if (r.see !== false) {
      r.pilotName = name;
    }
  });
}


/**
 * Calculates maxLastModified, sets lastModified and pilot, and returns result.
 * @param {Object} result
 * @param {string} maxLastModified
 * @param {Object} pilot
 * @param {Array} ownFlights - User's own flights (excludes buddy flights) for stats computation
 * @returns {Object}
 */
function finalizeResult(result, maxLastModified, pilot, ownFlights) {
  Object.values(result).forEach(records => {
    records.forEach(record => {
      maxLastModified = (record.updatedAt > maxLastModified) ? record.updatedAt : maxLastModified;
    });
  });

  const pilotValues = getPilotValuesForFrontend(pilot);
  const pilotStats = computePilotStats(ownFlights, pilot);
  result.lastModified = maxLastModified;
  result.pilot = { ...pilotValues, ...pilotStats };
  return result;
}


/**
 * Returns buddy relationships for a given pilot, with other pilot info attached.
 * @param {number} pilotId
 * @returns {Promise<Array>}
 */
function getBuddyRecords(pilotId) {
  return Buddy
    .findAll({
      where: {
        [Sequelize.Op.or]: [
          { requesterId: pilotId },
          { addresseeId: pilotId }
        ]
      },
      include: [
        { model: Pilot, as: 'Requester', attributes: ['id', 'userName', 'email'] },
        { model: Pilot, as: 'Addressee', attributes: ['id', 'userName', 'email'] }
      ]
    })
    .then(buddies => {
      return buddies.map(b => {
        const otherPilot = b.requesterId === pilotId
          ? b.Addressee
          : b.Requester;
        return {
          id: b.id,
          see: true,
          requesterId: b.requesterId,
          addresseeId: b.addresseeId,
          status: b.status,
          otherPilot: {
            id: otherPilot.id,
            userName: otherPilot.userName,
            email: otherPilot.email
          },
          isIncoming: b.addresseeId === pilotId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt
        };
      });
    });
}

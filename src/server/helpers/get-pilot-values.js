/**
 * @param {object} pilot - sequelize pilot record instance
 * @returns {object} - pilot information for frontend
 */
export default function getPilotValuesForFrontend(pilot) {
  return {
    id: pilot.get('id'),
    email: pilot.get('email'),
    userName: pilot.get('userName'),
    initialFlightNum: pilot.get('initialFlightNum'),
    initialAirtime: pilot.get('initialAirtime'),
    altitudeUnit: pilot.get('altitudeUnit'),
    distanceUnit: pilot.get('distanceUnit'),
    updatedAt: pilot.get('updatedAt'),
    isActivated: pilot.get('isActivated') // true / false
  };
}

/**
 * Computes pilot stats from flight records
 * @param {Array} flights - array of flight records (including buddy flights)
 * @param {object} pilot - pilot instance
 * @returns {object} - computed stats
 */
export function computePilotStats(flights, pilot) {
  let flightNumTotal = pilot.initialFlightNum || 0;
  let flightNumThisYear = 0;
  let airtimeTotal = pilot.initialAirtime || 0;
  const visitedSites = new Set();
  const usedGliders = new Set();
  let lastFlightDate = null;

  const currentYear = new Date().getFullYear();

  flights.forEach(flight => {
    if (flight.see === false) return;
    flightNumTotal++;
    airtimeTotal += flight.airtime || 0;
    if (flight.siteId) visitedSites.add(flight.siteId);
    if (flight.gliderId) usedGliders.add(flight.gliderId);
    const flightYear = flight.date ? parseInt(flight.date.substring(0, 4)) : 0;
    if (flightYear === currentYear) flightNumThisYear++;
    if (!lastFlightDate || flight.date > lastFlightDate) {
      lastFlightDate = flight.date;
    }
  });

  let daysSinceLastFlight = null;
  if (lastFlightDate) {
    const millisecondsSince = Date.now() - Date.parse(lastFlightDate);
    daysSinceLastFlight = Math.floor(millisecondsSince / (24 * 60 * 60 * 1000));
  }

  return {
    flightNumTotal,
    flightNumThisYear,
    airtimeTotal,
    siteNum: visitedSites.size,
    gliderNum: usedGliders.size,
    daysSinceLastFlight
  };
}

import Buddy from '../../orm/models/buddies';
import Flight from '../../orm/models/flights';
import KoiflyError from '../../errors/error';
import normalizeError from '../../errors/normalize-error';
import errorTypes from '../../errors/error-types';
import Sequelize from 'sequelize';


/**
 * Checks whether two pilots have an accepted buddy relation in either direction.
 * @param {number} pilotId
 * @param {number} otherPilotId
 * @returns {Promise.<Buddy|null>} - the accepted buddy record or null
 */
function getAcceptedBuddy(pilotId, otherPilotId) {
  return Buddy.findOne({
    where: {
      status: 'accepted',
      [Sequelize.Op.or]: [
        { requesterId: pilotId, addresseeId: otherPilotId },
        { requesterId: otherPilotId, addresseeId: pilotId }
      ]
    }
  });
}


/**
 * Replies with the full record of a single flight (including igc and igcFileName)
 * which the requesting pilot owns or for which there is an accepted buddy relation.
 * @param {Object} request
 * @returns {Promise.<Object>} - the flight record or an error object
 */
function flightHandler(request) {
  const pilotId = request.auth.credentials.userId;
  const flightId = request.params.flightId;

  return Flight
    .findOne({ where: { id: flightId, see: true } })
    .then(flight => {
      if (!flight) {
        throw new KoiflyError(errorTypes.RECORD_NOT_FOUND);
      }

      if (flight.pilotId === pilotId) {
        return flight;
      }

      return getAcceptedBuddy(pilotId, flight.pilotId)
        .then(buddy => {
          if (!buddy) {
            throw new KoiflyError(errorTypes.RECORD_NOT_FOUND);
          }
          return flight;
        });
    })
    .then(flight => flight.get({ plain: true }))
    .catch(error => {
      return { error: normalizeError(error) };
    });
}


export default flightHandler;

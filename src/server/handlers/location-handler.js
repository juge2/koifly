import axios from 'axios';
import secrets from '../../secrets';
import KoiflyError from '../../errors/error';
import errorTypes from '../../errors/error-types';

/**
 * Gets timezone details from coordinates and timestamp. Currently, uses Google Maps API.
 * @param {Object} request
 * @param {Object} reply
 * @return {Promise.<{status: string, location: string}>}
 */
function locationHandler(request, h) {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const queryParams = {
    latlng: request.query.latLngString,
    key: secrets.googleServerSideApiKey
  };

  return axios
    .get(url, { params: queryParams })
    .then(res => res.data)
    .catch(() => {
      return h.response({
        error: new KoiflyError(errorTypes.THIRD_PARTY_ERROR)
      });
    });
}

export default locationHandler;

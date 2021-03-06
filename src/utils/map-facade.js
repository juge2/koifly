import mapConstants from '../constants/map-constants';
import Util from './util';

// Load google maps api
// On success extend basic Map object with map interactive functionality
// Emit event that map was loaded
const googleMapsApi = require('google-maps-api')(mapConstants.GOOGLE_MAPS_API_KEY);
const mapsApiPromise = googleMapsApi();


const MapFacade = function(mapsApi) {
  this.mapsApi = mapsApi;
  this.map = null;
  this.elevator = null;
  this.geocoder = null;
  this.flightTrack = null;
  this.siteMarkers = {};
  this.siteInfowindows = {};
  this.infowindowOnClickFunctions = {};

  this.mapOptions = {
    center: mapConstants.CENTER.world,
    zoom: 4,
    mapTypeId: mapsApi.MapTypeId.TERRAIN,
    // map controls setting
    panControl: false,
    streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {
      style: mapsApi.ZoomControlStyle.SMALL,
      position: mapsApi.ControlPosition.LEFT_TOP
    },
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: mapsApi.MapTypeControlStyle.DROPDOWN_MENU,
      position: mapsApi.ControlPosition.TOP_RIGHT
    },
    scaleControl: true,
    scaleControlOptions: {
      position: mapsApi.ControlPosition.RIGHT_BOTTOM
    },
    overviewMapControl: false
  };
};


MapFacade.prototype.createMap = function(htmlContainer, centerCoordinates, zoomLevel) {
  this.map = new this.mapsApi.Map(htmlContainer, this.mapOptions);

  if (centerCoordinates) {
    this.map.setCenter(centerCoordinates);
  }
  if (zoomLevel) {
    this.map.setZoom(zoomLevel);
  }
  this.map.setTilt(0); // Disable 45 degree rotation when fully zoomed in
};


MapFacade.prototype.createMarker = function(siteId, position, draggable = false, changeInfowindowContent = undefined) {
  this.siteMarkers[siteId] = new this.mapsApi.Marker({
    position: position,
    map: this.map,
    draggable: draggable
  });

  if (draggable) {
    this.addMarkerMoveEventListener(siteId, changeInfowindowContent);
  }
};

MapFacade.prototype.addMarkerMoveEventListener = function(siteId, changeInfowindowContent) {
  this.geocoder = new this.mapsApi.Geocoder();
  this.elevator = new this.mapsApi.ElevationService();

  this.mapsApi.event.addListener(this.siteMarkers[siteId], 'drag', () => {
    this.siteInfowindows[siteId].close();
  });
  this.mapsApi.event.addListener(this.siteMarkers[siteId], 'dragend', event => {
    this.moveMarker(event.latLng, siteId, changeInfowindowContent);
  });
  this.mapsApi.event.addListener(this.map, 'click', event => {
    this.moveMarker(event.latLng, siteId, changeInfowindowContent);
  });
};

MapFacade.prototype.moveMarker = function(latLng, siteId, changeInfowindowContent) {
  this.siteInfowindows[siteId].close();
  this.siteMarkers[siteId].setPosition(latLng);
  this.map.panTo(latLng);

  // Request position data for infowindow content update
  this
    .getPositionInfoPromise(latLng)
    .then(positionInfo => {
      changeInfowindowContent(positionInfo, this);
    });
};


MapFacade.prototype.createInfowindow = function(siteId, content, onClickFunc) {
  this.siteInfowindows[siteId] = new this.mapsApi.InfoWindow({
    content: content,
    maxWidth: mapConstants.INFOWINDOW_WIDTH
  });

  if (onClickFunc) {
    this.infowindowOnClickFunctions[siteId] = onClickFunc;
  }
};

MapFacade.prototype.setInfowindowContent = function(siteId, content) {
  this.siteInfowindows[siteId].setContent(content);
};

MapFacade.prototype.openInfowindow = function(siteId) {
  this.siteInfowindows[siteId].open(this.map, this.siteMarkers[siteId]);

  if (this.infowindowOnClickFunctions[siteId]) {
    // Add event listener to site link when current call stack finishes execution
    // and infowindow is rendered in the DOM.
    setTimeout(() => {
      document.getElementById(`site-${siteId}`).addEventListener('click', () => {
        this.infowindowOnClickFunctions[siteId]();
      });
    }, 0);
  }
};

MapFacade.prototype.closeInfowindow = function(siteId) {
  this.siteInfowindows[siteId].close();
};

MapFacade.prototype.closeAllInfowindows = function() {
  Object.keys(this.siteInfowindows).forEach(siteId => {
    this.closeInfowindow(siteId);
  });
};

MapFacade.prototype.bindMarkerAndInfowindow = function(siteId) {
  // Add marker onclick event
  this.mapsApi.event.addListener(this.siteMarkers[siteId], 'click', () => {
    this.closeAllInfowindows();
    this.openInfowindow(siteId);
  });
};


MapFacade.prototype.createFlightTrack = function(flightPoints) {
  this.flightTrack = new this.mapsApi.Polyline({
    path: flightPoints,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  this.flightTrack.setMap(this.map);
  this.zoomToFlightTrack();
};

MapFacade.prototype.updateFlightTrack = function(flightPoints) {
  if (!this.flightTrack) {
    this.createFlightTrack(flightPoints);
  }

  this.flightTrack.setPath(flightPoints);
  this.zoomToFlightTrack();
};

MapFacade.prototype.zoomToFlightTrack = function() {
  if (!this.flightTrack || !this.flightTrack.getPath) {
    return;
  }
  const bounds = new this.mapsApi.LatLngBounds();
  const points = this.flightTrack.getPath().getArray();
  points.forEach(point => bounds.extend(point));

  this.map.fitBounds(bounds);
};

MapFacade.prototype.moveTrackMarker = function(coords) {
  if (!this.trackMarker) {
    this.trackMarker = new this.mapsApi.Marker({
      position: coords,
      map: this.map
    });
  } else {
    this.trackMarker.setPosition(coords);
  }
};


MapFacade.prototype.addSearchBarControl = function(siteId, changeInfowindowContent) {
  // Create control element
  const searchControl = document.createElement('div');
  this.createSearchControl(searchControl, siteId, changeInfowindowContent);
  // Add element to google map controls
  this.map.controls[this.mapsApi.ControlPosition.TOP_CENTER].push(searchControl);
};

MapFacade.prototype.createSearchControl = function(containerDiv, siteId, changeInfowindowContent) {
  // Set CSS for the search control container
  containerDiv.className = 'search-control';

  // Set CSS for the search bar
  const searchBar = document.createElement('input');
  searchBar.setAttribute('id', 'search-bar');
  searchBar.setAttribute('type', 'textbox');
  searchBar.className = 'search-bar';
  searchBar.placeholder = 'type or drop a pin';
  containerDiv.appendChild(searchBar);

  // Set CSS for the search button
  const searchButton = document.createElement('div');
  searchButton.setAttribute('id', 'search_button');
  searchButton.className = 'search-button';
  searchButton.textContent = 'Search';
  containerDiv.appendChild(searchButton);

  // Add search event to search button
  this.mapsApi.event.addDomListener(searchButton, 'click', () => {
    this.searchAddress(siteId, changeInfowindowContent);
  });
  // Trigger search event if Enter key is pressed on search bar
  this.mapsApi.event.addDomListener(searchBar, 'keypress', event => {
    // event.keyCode will be deprecated, event.key === 'Enter' still isn't supported by all browsers
    if (event.keyCode === 13 || event.key === 'Enter') {
      event.preventDefault();
      this.searchAddress(siteId, changeInfowindowContent);
    }
  });
};

MapFacade.prototype.searchAddress = function(siteId, changeInfowindowContent) {
  const address = document.getElementById('search-bar').value;

  this.geocoder.geocode({ 'address': address }, (results, status) => {
    if (status == this.mapsApi.GeocoderStatus.OK) { // eslint-disable-line eqeqeq
      const position = results[0].geometry.location;
      this.moveMarker(position, siteId, changeInfowindowContent);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`Geocode was not successful for the following reason: ${status}`); // eslint-disable-line no-console
    }
  });
};


MapFacade.prototype.getPositionInfoPromise = function(latLng) {
  return Promise
    .all([
      this.getAddressPromise(latLng),
      this.getElevationPromise(latLng)
    ])
    .then(positionInfoElements => {
      return {
        address: this.formatGeocoderAddress(positionInfoElements[0]),
        elevation: positionInfoElements[1],
        coordinates: this.getCoordinatesString(latLng)
      };
    });
};


MapFacade.prototype.getAddressPromise = function(latLng) {
  // Create a LocationAddressRequest object
  const positionalRequest = {
    'location': latLng
  };

  return new Promise(resolve => {
    // Initiate the location request
    this.geocoder.geocode(positionalRequest, (results, status) => {
      if (status == this.mapsApi.GeocoderStatus.OK) { // eslint-disable-line eqeqeq
        // Retrieve the second result (less detailed compare to the first one)
        if (results[1]) {
          resolve(results[1].address_components);
          return;
        }
      }
      resolve(mapConstants.UNKNOWN_ADDRESS);
    });
  });
};

MapFacade.prototype.getElevationPromise = function(latLng) {
  // Create a LocationElevationRequest object using the array's one value
  const positionalRequest = {
    'locations': [ latLng ]
  };

  return new Promise(resolve => {
    // Initiate the location request
    this.elevator.getElevationForLocations(positionalRequest, (results, status) => {
      if (status == this.mapsApi.ElevationStatus.OK) { // eslint-disable-line eqeqeq
        // Retrieve the first result
        if (results[0] && Util.isNumber(results[0].elevation)) {
          resolve(results[0].elevation);
          return;
        }
      }
      resolve(mapConstants.UNKNOWN_ELEVATION);
    });
  });
};


MapFacade.prototype.getCoordinatesString = function(latLng) {
  let lat;
  let lng;

  // Check the position format
  if (latLng.lat instanceof Function &&
    latLng.lng instanceof Function
  ) {
    // format returned by map onclick event
    lat = latLng.lat();
    lng = latLng.lng();
  } else {
    // simple format { lat: 34.4545454, lng: -120.564523 }
    lat = latLng.lat;
    lng = latLng.lng;
  }

  // round to 6 digits after floating point
  lat = Math.round(lat * 1000000) / 1000000;
  lng = Math.round(lng * 1000000) / 1000000;

  return `${lat} ${lng}`;
};

// Examples of formated address:
//         "Fraser Valey, BC, Canada"
//         "Scagit Country, WA, United States"

// Example of geocoderResult:
// [
//     {
//         "long_name" : "Upper Sumas Mountain Road",
//         "short_name" : "Upper Sumas Mountain Rd",
//         "types" : [ "route" ]
//     },
//     {
//         "long_name" : "Abbotsford",
//         "short_name" : "Abbotsford",
//         "types" : [ "locality", "political" ]
//     }
// ]
MapFacade.prototype.formatGeocoderAddress = function(geocoderResult) {
  const addressList = [];
  const addressElements = [
    { // e.g. region
      googleKey: 'administrative_area_level_2', // maybe change it to 'locality'
      valueType: 'long_name'
    },
    { // e.g. state, province
      googleKey: 'administrative_area_level_1',
      valueType: 'short_name'
    },
    {
      googleKey: 'country',
      valueType: 'long_name'
    }
  ];

  // Pull needed values from geocoder result
  for (let i = 0; i < addressElements.length; i++) {
    for (let j = 0; j < geocoderResult.length; j++) {
      if (geocoderResult[j].types.indexOf(addressElements[i].googleKey) !== -1) {
        addressList.push(geocoderResult[j][addressElements[i].valueType]);
        break;
      }
    }
  }

  return addressList.join(', ');
};


MapFacade.createPromise = function() {
  return mapsApiPromise.then(mapsApi => {
    return new MapFacade(mapsApi);
  });
};


export default MapFacade;

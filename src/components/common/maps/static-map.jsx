'use strict';

var React = require('react');
var _ = require('lodash');
var PubSub = require('../../../utils/pubsub');
var Map = require('../../../utils/map');
var SiteModel = require('../../../models/site');

require('./map.less');


var StaticMap = React.createClass({

    propTypes: {
        center: React.PropTypes.shape({
            lat: React.PropTypes.number,
            lng: React.PropTypes.number
        }),
        zoomLevel: React.PropTypes.number,
        markers:  React.PropTypes.arrayOf(React.PropTypes.shape({
            id: React.PropTypes.oneOfType([
                React.PropTypes.number,
                React.PropTypes.string
            ]),
            name: React.PropTypes.string,
            location: React.PropTypes.string,
            launchAltitude: React.PropTypes.oneOfType([
                React.PropTypes.number,
                React.PropTypes.string
            ]),
            altitudeUnit: React.PropTypes.string,
            coordinates: React.PropTypes.string
        })),
        fullScreen: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            center: Map.center.region, // TODO current location or last added site
            zoomLevel: Map.zoomLevel.region,
            markers: []
        };
    },

    componentDidMount: function() {
        if (Map.isLoaded) {
            this.createMap();
        } else {
            PubSub.on('mapLoaded', this.createMap, this);
        }
    },

    shouldComponentUpdate: function() {
        return false;
    },

    componentWillUnmount: function() {
        PubSub.removeListener('mapLoaded', this.createMap, this);
        if (Map.isLoaded) {
            Map.unmountMap();
        }
    },

    createMap: function() {
        var markerId, markerPosition, infowindowContent;
        var mapContainer = this.refs.map.getDOMNode();
        Map.createMap(mapContainer, this.props.center, this.props.zoomLevel);
        for (var i = 0; i < this.props.markers.length; i++) {
            if (this.props.markers[i].coordinates) {
                markerId = this.props.markers[i].id;
                markerPosition = SiteModel.getLatLngCoordinates(markerId);
                Map.createMarker(markerId, markerPosition, false);
                infowindowContent = this.composeInfowindowMessage(this.props.markers[i]);
                Map.createInfowindow(markerId, infowindowContent);
                Map.bindMarkerAndInfowindow(markerId);
            }
        }
    },

    composeInfowindowMessage: function(site) {
        return '<div>' +
                    '<div>' +
                        '<a href="/site/' + _.escape(site.id) + '">' +
                            _.escape(site.name) +
                        '</a>' +
                    '</div>' +
                    '<div>' + _.escape(site.location) + '</div>' +
                    '<div>' +
                        _.escape(site.launchAltitude + ' ' + site.altitudeUnit) +
                    '</div>' +
                    '<div>' + _.escape(site.coordinates) + '</div>' +
                '</div>';
    },

    render: function() {
        var className = this.props.fullScreen ? 'map_container x-full-screen' : 'map_container';

        return <div className={ className } ref='map'/>;
    }
});

module.exports = StaticMap;

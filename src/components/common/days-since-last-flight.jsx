'use strict';

var React = require('react');
var FlightModel = require('../../models/flight');

require('./days-since.less');


var DaysSinceLastFlight = React.createClass({

    render: function() {
        var daysSinceLastFlight;
        var lastFlightDate = FlightModel.getLastFlightDate();
        if (lastFlightDate !== null) {
            var milisecondsSince = Date.now() - Date.parse(lastFlightDate);
            daysSinceLastFlight = Math.floor(milisecondsSince / (24 * 60 * 60 * 1000)) + ' days since last flight';
        } else {
            daysSinceLastFlight = 'no flights yet';
        }

        return (
            <div className='days-since'>
                { daysSinceLastFlight }
            </div>
        );
    }
});


module.exports = DaysSinceLastFlight;

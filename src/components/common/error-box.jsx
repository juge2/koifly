'use strict';

var React = require('react');
var ErrorTypes = require('../../utils/error-types');
//var RetrieveError = require('./retrieve-error');
var Button = require('./button');


var ErrorView = React.createClass({
    propTypes: {
        error: React.PropTypes.shape({
            type: React.PropTypes.string,
            message: React.PropTypes.string
        }).isRequired,
        onTryAgain: React.PropTypes.func,
        isTrying: React.PropTypes.bool
    },

    renderTryAgainButton: function() {
        if (this.props.onTryAgain &&
            this.props.error.type !== ErrorTypes.NO_EXISTENT_RECORD &&
            this.props.error.type !== ErrorTypes.VALIDATION_FAILURE
        ) {
            return (
                <Button
                    onClick={ this.props.onTryAgain }
                    active={ !this.props.isTrying }
                    >
                    { this.props.isTrying ? 'Trying ...' : 'Try Again' }
                </Button>
            );
        }
    },

    render: function() {
        return (
            <div className='error_box error_message'>
                { this.props.error.message }
                { this.renderTryAgainButton() }
            </div>
        );
    }
});

module.exports = ErrorView;
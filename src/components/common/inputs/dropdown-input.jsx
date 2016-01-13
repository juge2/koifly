'use strict';

var React = require('react');
var Label = require('../section/label');
var Value = require('../section/value-input');
var Dropdown = require('./dropdown');
var ValidationError = require('../section/validation-error');


var DropdownInput = React.createClass({

    propTypes: {
        selectedValue: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number
        ]).isRequired,
        options: React.PropTypes.arrayOf(React.PropTypes.shape({
            value: React.PropTypes.string,
            text: React.PropTypes.string
        })).isRequired,
        labelText: React.PropTypes.string,
        inputName: React.PropTypes.string.isRequired,
        emptyValue: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number
        ]),
        errorMessage: React.PropTypes.string,
        onChangeFunc: React.PropTypes.func.isRequired
    },

    renderErrorMessage: function() {
        if (this.props.errorMessage) {
            return <ValidationError text={ this.props.errorMessage } />;
        }
    },

    render: function() {
        return (
            <div>
                { this.renderErrorMessage() }

                <Label>
                    { this.props.labelText }
                </Label>

                <Value>
                    <Dropdown
                        className={ (this.props.errorMessage) ? 'error' : '' }
                        selectedValue={ this.props.selectedValue }
                        options={ this.props.options }
                        inputName={ this.props.inputName }
                        emptyValue={ this.props.emptyValue }
                        onChangeFunc={ this.props.onChangeFunc }
                        />
                </Value>
            </div>
        );
    }
});


module.exports = DropdownInput;

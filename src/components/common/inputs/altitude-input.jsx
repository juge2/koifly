'use strict';

var React = require('react');
var Altitude = require('../../../utils/altitude');
var Label = require('../section/label');
var InputContainer = require('./input-container');
var Dropdown = require('./dropdown');
var ValidationError = require('../section/validation-error');

require('./two-input-elements.less');


var AltitudeInput = React.createClass({

    propTypes: {
        inputValue: React.PropTypes.string.isRequired,
        selectedAltitudeUnit: React.PropTypes.string,
        inputName: React.PropTypes.string.isRequired,
        labelText: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.element
        ]),
        errorMessage: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            inputName: 'altitude'
        };
    },

    handleUserInput: function(inputName, inputValue) {
        // When function is triggered from embedded component
        // both parameters are provided
        // otherwise retrieve input value from the DOM
        if (inputValue === undefined) {
            inputValue = this.refs[inputName].getDOMNode().value;
        }

        this.props.onChange(inputName, inputValue);
    },

    renderErrorMessage: function() {
        if (this.props.errorMessage) {
            return <ValidationError message={ this.props.errorMessage } />;
        }
    },

    render: function() {
        var altitudeUnitsList = Altitude.getAltitudeUnitsValueTextList();

        return (
            <div>
                { this.renderErrorMessage() }

                <Label>
                    { this.props.labelText }
                </Label>

                <InputContainer>
                    <input
                        className={ 'col-of-two x-number' + (this.props.errorMessage ? ' x-error' : '') }
                        value={ this.props.inputValue }
                        type='text'
                        pattern='[0-9]*'
                        onChange={ () => this.handleUserInput(this.props.inputName) }
                        ref={ this.props.inputName }
                        />
                    <div className='col-of-two second'>
                        <Dropdown
                            selectedValue={ this.props.selectedAltitudeUnit }
                            options={ altitudeUnitsList }
                            inputName='altitudeUnit'
                            onChangeFunc={ this.handleUserInput }
                            />
                    </div>
                </InputContainer>
            </div>
        );
    }
});


module.exports = AltitudeInput;

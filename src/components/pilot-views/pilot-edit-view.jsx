'use strict';

var React = require('react');
var History = require('react-router').History;
var _ = require('lodash');
var PilotModel = require('../../models/pilot');
var Validation = require('../../utils/validation');
var Altitude = require('../../utils/altitude');
var View = require('./../common/view');
var Button = require('./../common/button');
var TextInput = require('./../common/inputs/text-input');
var TimeInput = require('./../common/inputs/time-input');
var DropDown = require('./../common/inputs/dropdown');
var Loader = require('./../common/loader');
var ErrorBox = require('./../common/notice/error-box');
var ErrorTypes = require('../../utils/error-types');


var PilotEditView = React.createClass({

    mixins: [ History ],

    getInitialState: function() {
        return {
            pilot: null,
            errors: _.clone(PilotEditView.formFields),
            loadingError: null,
            savingError: null,
            isSaving: false
        };
    },

    handleSubmit: function(event) {
        if (event) {
            event.preventDefault();
        }

        var validationResponse = this.validateForm();
        // If no errors
        if (validationResponse === true) {
            this.setState({ isSaving: true });

            PilotModel.savePilotInfo(this.state.pilot).then(() => {
                this.history.pushState(null, '/pilot');
            }).catch((error) => {
                this.handleSavingError(error);
            });
        }
    },

    handleInputChange: function(inputName, inputValue) {
        var newPilotInfo = _.extend({}, this.state.pilot, { [inputName]: inputValue });
        this.setState({ pilot: newPilotInfo }, function() {
            this.validateForm(true);
        });
    },

    handleCancelEditing: function() {
        this.history.pushState(null, '/pilot');
    },

    handleSavingError: function(error) {
        var newError = null;
        if (error.type === ErrorTypes.VALIDATION_FAILURE) {
            this.updateErrorState(error.errors);
        } else {
            newError = error;
        }
        this.setState({
            savingError: newError,
            isSaving: false
        });
    },

    handleDataModified: function() {
        // If waiting for server response
        // ignore any other data updates
        if (this.state.isSaving) {
            return;
        }

        // Fetch pilot info
        var pilot = PilotModel.getPilotEditOutput();

        // Check for errors
        if (pilot !== null && pilot.error) {
            this.setState({ loadingError: pilot.error });
            return;
        }
        // If there is user input in the form
        // erase saving error
        // need this for handling successful authentication
        if (this.state.pilot !== null) {
            this.setState({ savingError: null });
            return;
        }

        this.setState({
            pilot: pilot,
            loadingError: null
        });
    },


    validateForm: function(isSoft) {
        var validationResponse = Validation.validateForm(
            PilotModel.getValidationConfig(),
            this.state.pilot,
            isSoft
        );
        this.updateErrorState(validationResponse);
        return validationResponse;
    },

    updateErrorState: function(newErrors) {
        var newErrorState = _.extend({}, PilotEditView.formFields, newErrors);
        this.setState({ errors: newErrorState });
    },

    renderError: function() {
        return (
            <View onDataModified={ this.handleDataModified } error={ this.state.loadingError }>
                <ErrorBox error={ this.state.loadingError } onTryAgain={ this.handleDataModified }/>
            </View>
        );
    },

    renderSavingError: function() {
        if (this.state.savingError) {
            var isTrying = this.state.isSaving;
            return (
                <ErrorBox
                    error={ this.state.savingError }
                    onTryAgain={ this.handleSubmit }
                    isTrying={ isTrying }
                    />
            );
        }
    },

    renderLoader: function() {
        return (
            <View onDataModified={ this.handleDataModified }>
                <Loader />
                <div className='button__menu'>
                    <Button isEnabled={ false }>Save</Button>
                    <Button onClick={ this.handleCancelEditing }>Cancel</Button>
                </div>
            </View>
        );
    },

    renderButtonMenu: function() {
        var isEnabled = !this.state.isSaving;
        return (
            <div className='button__menu'>
                <Button type='submit' onClick={ this.handleSubmit } isEnabled={ isEnabled }>
                    { this.state.isSaving ? 'Saving ...' : 'Save' }
                </Button>
                <Button onClick={ this.handleCancelEditing } isEnabled={ isEnabled }>
                    Cancel
                </Button>
            </div>
        );
    },

    render: function() {
        if (this.state.loadingError !== null) {
            return this.renderError();
        }

        if (this.state.pilot === null) {
            return this.renderLoader();
        }

        var processingError = this.state.savingError ? this.state.savingError : null;
        var altitudeUnitsList = Altitude.getAltitudeUnitsValueTextList();

        return (
            <View onDataModified={ this.handleDataModified } error={ processingError }>
                { this.renderSavingError() }
                <form>

                    <div className='container__title'>{ this.state.pilot.email }</div>

                    <TextInput
                        inputValue={ this.state.pilot.userName }
                        labelText='Name:'
                        inputName='userName'
                        errorMessage={ this.state.errors.userName }
                        onChange={ this.handleInputChange }
                        />

                    <div className='line' />
                    <div>My achievements before Koifly:</div>

                    <TextInput
                        inputValue={ this.state.pilot.initialFlightNum }
                        labelText='Number of Flights:'
                        inputName='initialFlightNum'
                        errorMessage={ this.state.errors.initialFlightNum }
                        onChange={ this.handleInputChange }
                        />

                    <TimeInput
                        hours={ this.state.pilot.hours }
                        minutes={ this.state.pilot.minutes }
                        labelText='Airtime:'
                        errorMessage={ this.state.errors.initialAirtime }
                        errorMessageHours={ this.state.errors.hours }
                        errorMessageMinutes={ this.state.errors.minutes }
                        onChange={ this.handleInputChange }
                        />

                    <div className='line' />
                    <div>My settings:</div>

                    <DropDown
                        selectedValue={ this.state.pilot.altitudeUnit }
                        options={ altitudeUnitsList }
                        labelText='Altitude unit:'
                        inputName='altitudeUnit'
                        errorMessage={ this.state.errors.altitudeUnit }
                        onChangeFunc={ this.handleInputChange }
                        />

                    { this.renderButtonMenu() }
                </form>
            </View>
        );
    }
});


PilotEditView.formFields = {
    userName: null,
    initialFlightNum: null,
    initialAirtime: null,
    altitudeUnit: null,
    hours: null,
    minutes: null
};


module.exports = PilotEditView;
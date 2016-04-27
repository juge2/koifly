'use strict';

var React = require('react');
var Label = require('../section/label');
var InputContainer = require('./input-container');
var ValidationError = require('../section/validation-error');


var TextInput = React.createClass({

    propTypes: {
        inputValue: React.PropTypes.string.isRequired,
        labelText: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.element
        ]),
        inputName: React.PropTypes.string.isRequired,
        isNumber: React.PropTypes.bool.isRequired,
        isEmail: React.PropTypes.bool.isRequired,
        errorMessage: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            isNumber: false,
            isEmail: false
        };
    },

    handleUserInput: function() {
        this.props.onChange(this.props.inputName, this.refs.input.getDOMNode().value);
    },

    renderErrorMessage: function() {
        if (this.props.errorMessage) {
            return <ValidationError message={ this.props.errorMessage } />;
        }
    },

    render: function() {
        var className = this.props.isNumber ? 'x-number' : 'x-text';
        if (this.props.errorMessage) {
            className += ' x-error';
        }

        return (
            <div>
                { this.renderErrorMessage() }

                <Label>
                    { this.props.labelText }
                </Label>

                <InputContainer>
                    <input
                        className={ className }
                        value={ this.props.inputValue }
                        type={ this.props.isEmail ? 'email' : 'text' }
                        pattern={ this.props.isNumber ? '[0-9]*' : null }
                        placeholder={ this.props.isNumber ? '0' : '' }
                        onChange={ this.handleUserInput }
                        ref='input'
                        />
                </InputContainer>
            </div>
        );
    }
});


module.exports = TextInput;

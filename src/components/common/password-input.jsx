'use strict';

var React = require('react');


var PasswordInput = React.createClass({

    propTypes: {
        inputValue: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number
        ]),
        labelText: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.element
        ]),
        inputName: React.PropTypes.string,
        errorMessage: React.PropTypes.string,
        onChange: React.PropTypes.func
    },

    handleUserInput: function() {
        this.props.onChange(this.props.inputName, this.refs.input.getDOMNode().value);
    },

    renderErrorMessage: function() {
        if (this.props.errorMessage) {
            return (
                <div className='error_message'>
                    { this.props.errorMessage }
                </div>
            );
        }
    },

    renderLabel: function() {
        if (this.props.labelText) {
            return <label>{ this.props.labelText }</label>;
        }
    },

    render: function() {
        return (
            <div>
                { this.renderErrorMessage() }
                { this.renderLabel() }
                <input
                    value={ this.props.inputValue }
                    type='password'
                    className={ (this.props.errorMessage) ? 'error' : '' }
                    onChange={ this.handleUserInput }
                    ref='input'
                    />
            </div>
        );
    }
});


module.exports = PasswordInput;
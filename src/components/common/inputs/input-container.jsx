'use strict';

var React = require('react');

require('./input-container.less');


var ValueInput = React.createClass({
    render: function() {
        return (
            <div className='input-container'>
                <div className='arrow'>{ '\u25bb' }</div>
                { this.props.children }
            </div>
        );
    }
});


module.exports = ValueInput;

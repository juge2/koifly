'use strict';

require('../../src/test-dom')();
var React = require('react/addons');

var MobileButton = require('../../src/components/common/buttons/mobile-button');
var Button = require('../../src/components/common/buttons/button');

var expect = require('chai').expect;



describe('MobileButton component', () => {

    var TestUtils = React.addons.TestUtils;

    var component;

    var mocks = {
        buttonText: 'test button',
        buttonType: 'submit',
        buttonStyle: 'primary',
        handleClick: () => {}
    };

    before(() => {
        component = TestUtils.renderIntoDocument(
            <MobileButton
                caption={ mocks.buttonText }
                type={ mocks.buttonType }
                buttonStyle={ mocks.buttonStyle }
                onClick={ mocks.handleClick }
                />
        );
    });

    it('renders a Button component with proper props', () => {
        let button = TestUtils.findRenderedComponentWithType(component, Button);

        expect(button).to.have.deep.property('props.caption', mocks.buttonText);
        expect(button).to.have.deep.property('props.type', mocks.buttonType);
        expect(button).to.have.deep.property('props.buttonStyle', mocks.buttonStyle);
        expect(button).to.have.deep.property('props.isMobile', true);
        expect(button).to.have.deep.property('props.isEnabled', true);
        expect(button).to.have.deep.property('props.onClick', mocks.handleClick);
    });
});
'use strict';

var React = require('react');
var Link = require('react-router').Link;

const ZOOM_LEVEL = require('../../constants/map-constants').ZOOM_LEVEL;

var Altitude = require('../../utils/altitude');
var itemViewMixin = require('../mixins/item-view-mixin');
var SiteModel = require('../../models/site');
var Util = require('../../utils/util');

var BreadCrumbs = require('../common/bread-crumbs');
var MobileTopMenu = require('../common/menu/mobile-top-menu');
var RemarksRow = require('../common/section/remarks-row');
var RowContent = require('../common/section/row-content');
var Section = require('../common/section/section');
var SectionRow = require('../common/section/section-row');
var SectionTitle = require('../common/section/section-title');
var StaticMap = require('../common/maps/static-map');
var View = require('../common/view');



var { shape, string } = React.PropTypes;

var SiteView = React.createClass({

    propTypes: {
        params: shape({ // url args
            id: string.isRequired
        })
    },

    mixins: [ itemViewMixin(SiteModel.getModelKey()) ],
    
    renderMobileTopMenu: function() {
        return (
            <MobileTopMenu
                leftButtonCaption='Back'
                rightButtonCaption='Edit'
                onLeftClick={ this.handleGoToListView }
                onRightClick={ this.handleEditItem }
                />
        );
    },

    renderMap: function() {
        if (this.state.item.coordinates) {
            return StaticMap.create({
                center: SiteModel.getLatLng(this.state.item.id),
                zoomLevel: ZOOM_LEVEL.site,
                sites: [ this.state.item ]
            });
        }
    },

    render: function() {
        if (this.state.loadingError) {
            return this.renderError();
        }

        if (this.state.item === null) {
            return this.renderLoader();
        }

        var { flightNum, flightNumThisYear } = this.state.item;
        if (flightNumThisYear) {
            flightNum += `, incl. this year: ${flightNumThisYear}`;
        }

        return (
            <View onStoreModified={ this.handleStoreModified }>
                { this.renderMobileTopMenu() }
                { this.renderNavigationMenu() }

                <Section onEditClick={ this.handleEditItem }>
                    <BreadCrumbs
                        elements={ [
                            <Link to='/sites'>Sites</Link>,
                            this.state.item.name
                        ] }
                        />

                    <SectionTitle>
                        { this.state.item.name }
                    </SectionTitle>

                    <SectionRow>
                        <RowContent
                            label='Location:'
                            value={ Util.formatText(this.state.item.location) }
                            />
                    </SectionRow>

                    <SectionRow>
                        <RowContent
                            label='Launch altitude:'
                            value={ Altitude.formatAltitude(this.state.item.launchAltitude) }
                            />
                    </SectionRow>

                    <SectionRow>
                        <RowContent
                            label='Coordinates:'
                            value={ this.state.item.coordinates ? this.state.item.coordinates : '—' }
                            />
                    </SectionRow>

                    <SectionRow>
                        <RowContent
                            label='Flights:'
                            value={ flightNum }
                            />
                    </SectionRow>

                    <RemarksRow value={ this.state.item.remarks } />

                    { this.renderMap() }
                </Section>
            </View>
        );
    }
});



module.exports = SiteView;

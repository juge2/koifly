'use strict';

var React = require('react');
var History = require('react-router').History;
var SiteModel = require('../../models/site');
var View = require('../common/view');
var TopMenu = require('../common/menu/top-menu');
var TopButtons = require('../common/buttons/top-buttons');
var BottomMenu = require('../common/menu/bottom-menu');
var Section = require('../common/section/section');
var Table = require('../common/table');
var Switcher = require('../common/switcher');
var Button = require('../common/buttons/button');
var Loader = require('../common/loader');
var FirstAdding = require('../common/first-adding');
var ErrorBox = require('../common/notice/error-box');


var SiteListView = React.createClass({

    mixins: [ History ],

    getInitialState: function() {
        return {
            sites: null,
            loadingError: null
        };
    },

    handleRowClick: function(siteId) {
        this.history.pushState(null, '/site/' + siteId);
    },

    handleToMapView: function() {
        this.history.pushState(null, '/sites/map');
    },

    handleSiteAdding: function() {
        this.history.pushState(null, '/site/0/edit');
    },

    handleDataModified: function() {
        var sites = SiteModel.getSitesArray();
        if (sites !== null && sites.error) {
            this.setState({ loadingError: sites.error });
        } else {
            this.setState({
                sites: sites,
                loadingError: null
            });
        }
    },

    renderError: function() {
        if (this.state.loadingError !== null) {
            return <ErrorBox error={ this.state.loadingError } onTryAgain={ this.handleDataModified }/>;
        }
    },

    renderLoader: function() {
        return (this.state.sites === null) ? <Loader /> : '';
    },

    renderNoSitesYet: function() {
        if (this.state.sites instanceof Array &&
            this.state.sites.length === 0
        ) {
            return <FirstAdding dataType='sites' onAdding={ this.handleSiteAdding } />;
        }
    },

    renderAddSiteButton: function() {
        return <Button text='Add Site' onClick={ this.handleSiteAdding }/>;
    },

    renderSwitcher: function() {
        return (
            <Switcher
                leftText = 'List'
                rightText = 'Map'
                onRightClick = { this.handleToMapView }
                initialPosition = 'left'
                />
        );
    },

    renderTable: function() {
        var columnsConfig = [
            {
                key: 'name',
                label: 'Name',
                defaultSortingDirection: true
            },
            {
                key: 'location',
                label: 'Location',
                defaultSortingDirection: true
            },
            {
                key: 'launchAltitude',
                label: 'Altitude',
                defaultSortingDirection: false
            }
        ];

        return (
            <Table
                columns={ columnsConfig }
                rows={ this.state.sites }
                initialSortingField='name'
                onRowClick={ this.handleRowClick }
                />
        );
    },

    render: function() {
        var content = this.renderError();

        if (!content) {
            content = this.renderNoSitesYet();
        }

        if (!content) {
            content = this.renderTable();
        }

        return (
            <View onDataModified={ this.handleDataModified } error={ this.state.loadingError }>
                <Section>
                    <TopMenu
                        headerText='Sites'
                        leftText='Map'
                        rightText='Add'
                        onLeftClick={ this.handleToMapView }
                        onRightClick={ this.handleSiteAdding }
                        />

                    <TopButtons
                        leftElement={ this.renderAddSiteButton() }
                        middleElement={ this.renderSwitcher() }
                        />

                    { content }
                    { this.renderLoader() }
                </Section>

                <BottomMenu isSiteView={ true } />
            </View>
        );
    }
});


module.exports = SiteListView;

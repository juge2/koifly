'use strict';

var React = require('react');

var listViewMixin = require('../mixins/list-view-mixin');
var GliderModel = require('../../models/glider');

var DesktopTopGrid = require('../common/grids/desktop-top-grid');
var MobileTopMenu = require('../common/menu/mobile-top-menu');
var NavigationMenu = require('../common/menu/navigation-menu');
var Section = require('../common/section/section');
var Table = require('../common/table');
var View = require('../common/view');



var GliderListView = React.createClass({

    mixins: [ listViewMixin(GliderModel.getModelKey()) ],

    getInitialState: function() {
        return {
            items: null,
            loadingError: null
        };
    },

    renderTable: function() {
        var columnsConfig = [
            {
                key: 'name',
                label: 'Name',
                defaultSortingDirection: true
            },
            {
                key: 'trueFlightNum',
                label: 'Flight#',
                defaultSortingDirection: false
            },
            {
                key: 'trueAirtime',
                label: 'Airtime',
                defaultSortingDirection: false
            }
        ];

        return (
            <Table
                columns={ columnsConfig }
                rows={ this.state.items || [] }
                initialSortingField='name'
                onRowClick={ this.handleRowClick }
                />
        );
    },

    render: function() {
        var content = this.renderError();

        if (!content) {
            content = this.renderEmptyList();
        }

        if (!content) {
            content = this.renderTable();
        }

        return (
            <View onStoreModified={ this.handleStoreModified } error={ this.state.loadingError }>
                <MobileTopMenu
                    header='Gliders'
                    rightButtonCaption='Add'
                    onRightClick={ this.handleAddItem }
                    />
                <NavigationMenu currentView={ GliderModel.getModelKey() } />
                
                <Section>
                    <DesktopTopGrid
                        leftElement={ this.renderAddItemButton() }
                        />

                    { content }
                    
                    { this.renderLoader() }
                </Section>
            </View>
        );
    }
});


module.exports = GliderListView;

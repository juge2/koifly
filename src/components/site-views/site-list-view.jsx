import React from 'react';
import Altitude from '../../utils/altitude';
import Button from '../common/buttons/button';
import dataService from '../../services/data-service';
import DesktopTopGrid from '../common/grids/desktop-top-grid';
import EmptyList from '../common/empty-list';
import ErrorBox from '../common/notice/error-box';
import MobileTopMenu from '../common/menu/mobile-top-menu';
import NavigationMenu from '../common/menu/navigation-menu';
import navigationService from '../../services/navigation-service';
import Section from '../common/section/section';
import SectionLoader from '../common/section/section-loader';
import SiteModel from '../../models/site';
import Table from '../common/table';
import View from '../common/view';

require('./site-list-view.less');


export default class SiteListView extends React.Component {
  constructor() {
    super();
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem('koifly-site-column-filters'));
    } catch (e) { /* ignore */ }
    this.state = {
      items: null,
      loadingError: null,
      columnFilters: saved || {}
    };

    this.handleStoreModified = this.handleStoreModified.bind(this);
    this.handleColumnFilterChange = this.handleColumnFilterChange.bind(this);
  }

  handleColumnFilterChange(columnKey, filterValue) {
    this.setState(prev => {
      const columnFilters = Object.assign({}, prev.columnFilters, { [columnKey]: filterValue });
      localStorage.setItem('koifly-site-column-filters', JSON.stringify(columnFilters));
      return { columnFilters };
    });
  }

  /**
   * Once store data was modified or on initial rendering,
   * requests for presentational data form the Model and updates component's state
   */
  handleStoreModified() {
    const storeContent = SiteModel.getListOutput();

    if (storeContent && storeContent.error) {
      this.setState({ loadingError: storeContent.error });
    } else {
      this.setState({
        items: storeContent,
        loadingError: null
      });
    }
  }

  handleAddItem() {
    navigationService.goToNewItemView(SiteModel.keys.single);
  }

  handleRowClick(itemId) {
    navigationService.goToItemView(SiteModel.keys.single, itemId);
  }

  renderMobileTopMenu() {
    return (
      <MobileTopMenu
        header='Sites'
        leftButtonCaption='Map'
        rightButtonCaption='Add'
        onLeftClick={navigationService.goToSiteMapView}
        onRightClick={this.handleAddItem}
      />
    );
  }

  renderError() {
    return (
      <View onStoreModified={this.handleStoreModified} error={this.state.loadingError}>
        <MobileTopMenu header='Sites'/>
        {this.renderNavigationMenu()}
        <ErrorBox error={this.state.loadingError} onTryAgain={this.handleStoreModified}/>;
      </View>
    );
  }

  renderSwitch() {
    return (
      <div className='site-view-switch' onClick={navigationService.goToSiteMapView}>
        <div className='switch-icon map-icon'>
          <img src='/static/icons/site-map-switch.svg' width='30px'/>
        </div>
        <div className='switch-text map-text'>
          <div>Map</div>
        </div>
      </div>
    );
  }

  renderLoader() {
    return (this.state.items === null) ? <SectionLoader/> : null;
  }

  renderEmptyList() {
    if (this.state.items && this.state.items.length === 0) {
      return <EmptyList ofWhichItems={SiteModel.keys.plural} onAdding={this.handleAddItem}/>;
    }
  }

  renderNavigationMenu() {
    return <NavigationMenu currentView={SiteModel.getModelKey()}/>;
  }

  renderAddItemButton() {
    return <Button caption='Add Site' onClick={this.handleAddItem}/>;
  }

  renderTable() {
    const columnsConfig = [
      {
        key: 'name',
        label: 'Name',
        defaultSortingDirection: true,
        filter: { type: 'select' }
      },
      {
        key: 'location',
        label: 'Location',
        defaultSortingDirection: true,
        filter: { type: 'select' }
      },
      {
        key: 'formattedAltitude',
        label: 'Altitude',
        defaultSortingDirection: false,
        sortingKey: 'launchAltitude',
        filter: { type: 'range' }
      },
      {
        key: 'launchType',
        label: 'Launch',
        defaultSortingDirection: true,
        filter: { type: 'select' }
      }
    ];

    const rows = (this.state.items || []).map(site => (
      Object.assign({}, site, {
        formattedAltitude: Altitude.formatAltitudeShort(site.launchAltitude),
        launchType: site.launchType === 'winch' ? 'Winch' : 'Foot'
      })
    ));

    const currentPilotName = dataService.store.pilot && (dataService.store.pilot.userName || dataService.store.pilot.email);

    return (
      <Table
        columns={columnsConfig}
        rows={rows}
        columnFilters={this.state.columnFilters}
        onColumnFilterChange={this.handleColumnFilterChange}
        currentPilotName={currentPilotName}
        initialSortingField='name'
        storageKey='koifly-site-sorting'
        onRowClick={this.handleRowClick}
      />
    );
  }

  render() {
    if (this.state.loadingError) {
      return this.renderError();
    }

    let content = this.renderEmptyList();
    if (!content) {
      content = this.renderTable();
    }

    return (
      <View onStoreModified={this.handleStoreModified} error={this.state.loadingError}>
        {this.renderMobileTopMenu()}
        {this.renderNavigationMenu()}

        <Section>
          <DesktopTopGrid
            leftElement={this.renderAddItemButton()}
            rightElement={this.renderSwitch()}
          />
          {content}
          {this.renderLoader()}
        </Section>

      </View>
    );
  }
}

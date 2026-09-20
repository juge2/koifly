import React from 'react';
import Altitude from '../../utils/altitude';
import Button from '../common/buttons/button';
import dataService from '../../services/data-service';
import DesktopTopGrid from '../common/grids/desktop-top-grid';
import EmptyList from '../common/empty-list';
import ErrorBox from '../common/notice/error-box';
import FlightModel from '../../models/flight';
import MobileTopMenu from '../common/menu/mobile-top-menu';
import NavigationMenu from '../common/menu/navigation-menu';
import navigationService from '../../services/navigation-service';
import Section from '../common/section/section';
import SectionLoader from '../common/section/section-loader';
import Table from '../common/table';
import Util from '../../utils/util';
import View from '../common/view';


export default class FlightListView extends React.Component {
  constructor() {
    super();
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem('koifly-flight-column-filters'));
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
      localStorage.setItem('koifly-flight-column-filters', JSON.stringify(columnFilters));
      return { columnFilters };
    });
  }

  /**
   * Once store data was modified or on initial rendering,
   * requests for presentational data form the Model and updates component's state
   */
  handleStoreModified() {
    const storeContent = FlightModel.getListOutputCached();

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
    navigationService.goToNewItemView(FlightModel.keys.single);
  }

  handleRowClick(itemId) {
    navigationService.goToItemView(FlightModel.keys.single, itemId);
  }

  renderMobileTopMenu() {
    return (
      <MobileTopMenu
        header='Flights'
        rightButtonCaption='Add'
        onRightClick={this.handleAddItem}
      />
    );
  }

  renderError() {
    return (
      <View onStoreModified={this.handleStoreModified} error={this.state.loadingError}>
        <MobileTopMenu header='Flights'/>
        {this.renderNavigationMenu()}
        <ErrorBox error={this.state.loadingError} onTryAgain={this.handleStoreModified}/>
      </View>
    );
  }

  renderLoader() {
    return (this.state.items === null) ? <SectionLoader/> : null;
  }

  renderEmptyList() {
    if (this.state.items && this.state.items.length === 0) {
      return <EmptyList ofWhichItems={FlightModel.keys.plural} onAdding={this.handleAddItem}/>;
    }
  }

  renderNavigationMenu() {
    return <NavigationMenu currentView={FlightModel.getModelKey()}/>;
  }

  renderAddItemButton() {
    return <Button caption='Add Flight' onClick={this.handleAddItem}/>;
  }

  renderTable() {
    const columns = [
      {
        key: 'formattedDate',
        label: 'Date',
        defaultSortingDirection: false,
        sortingKey: 'dateNum',
        secondarySortingKey: 'time',
        filter: { type: 'range' }
      },
      {
        key: 'siteName',
        label: 'Site',
        defaultSortingDirection: true,
        filter: { type: 'select' }
      },
      {
        key: 'pilotName',
        label: 'Pilot',
        defaultSortingDirection: true,
        filter: { type: 'select' }
      },
      {
        key: 'formattedAltitude',
        label: 'Altitude',
        defaultSortingDirection: false,
        sortingKey: 'altitude',
        filter: { type: 'range' }
      },
      {
        key: 'formattedAirtime',
        label: 'Airtime',
        defaultSortingDirection: false,
        sortingKey: 'airtime',
        filter: { type: 'range' }
      }
    ];

    const rows = (this.state.items || []).map(flight => (
      Object.assign({}, flight, {
        dateNum: Number(flight.date.replace(/-/g, '')),
        formattedDate: Util.formatDateAndTime(flight.date, flight.time),
        formattedAltitude: Altitude.formatAltitudeShort(flight.altitude),
        formattedAirtime: Util.formatTime(flight.airtime)
      })
    ));

    const currentPilotName = dataService.store.pilot && (dataService.store.pilot.userName || dataService.store.pilot.email);

    return (
      <Table
        columns={columns}
        rows={rows}
        columnFilters={this.state.columnFilters}
        onColumnFilterChange={this.handleColumnFilterChange}
        currentPilotName={currentPilotName}
        initialSortingField='date'
        storageKey='koifly-flight-sorting'
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
          <DesktopTopGrid leftElement={this.renderAddItemButton()}/>
          {content}
          {this.renderLoader()}
        </Section>

      </View>
    );
  }
}

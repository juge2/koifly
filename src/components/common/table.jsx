import React from 'react';
import { arrayOf, bool, func, number, object, shape, string } from 'prop-types';
import orderBy from 'lodash.orderby';
import ColumnFilter from './column-filter';
import Util from '../../utils/util';

require('./table.less');


export default class Table extends React.Component {
  constructor(props) {
    super(props);
    let sortingField = this.props.initialSortingField;
    let sortingDirection = this.getDefaultSortingDirection(this.props.initialSortingField);

    if (this.props.storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(this.props.storageKey));
        if (saved && saved.field) {
          sortingField = saved.field;
          sortingDirection = saved.direction !== undefined ? saved.direction : sortingDirection;
        }
      } catch (e) { /* ignore */ }
    }

    this.state = { sortingField, sortingDirection };

    this.handleSorting = this.handleSorting.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
    this.handleColumnFilterChange = this.handleColumnFilterChange.bind(this);
  }

  handleSorting(newSortingField) {
    this.setState(prev => {
      let field;
      let direction;
      if (prev.sortingField === newSortingField) {
        field = prev.sortingField;
        direction = !prev.sortingDirection;
      } else {
        field = newSortingField;
        direction = this.getDefaultSortingDirection(newSortingField);
      }

      if (this.props.storageKey) {
        localStorage.setItem(this.props.storageKey, JSON.stringify({ field, direction }));
      }

      return { sortingField: field, sortingDirection: direction };
    });
  }

  handleRowClick(rowId) {
    if (this.props.onRowClick) {
      this.props.onRowClick(rowId);
    }
  }

  handleColumnFilterChange(columnKey, filterValue) {
    if (this.props.onColumnFilterChange) {
      this.props.onColumnFilterChange(columnKey, filterValue);
    }
  }

  getDefaultSortingDirection(fieldName) {
    let sortingDirection = true;
    for (let i = 0; i < this.props.columns.length; i++) {
      const column = this.props.columns[i];
      if ((column.sortingKey && column.sortingKey === fieldName) ||
        (!column.sortingKey && column.key === fieldName)
      ) {
        sortingDirection = column.defaultSortingDirection;
        break;
      }
    }
    return sortingDirection;
  }

  getFilteredRows() {
    const filters = this.props.columnFilters || {};
    let rows = this.props.rows;

    Object.keys(filters).forEach(columnKey => {
      const filterValue = filters[columnKey];
      if (filterValue === undefined || filterValue === null || filterValue === 'All') return;
      if (Array.isArray(filterValue) && filterValue.length === 0) return;
      if (typeof filterValue === 'object' && filterValue.from === '' && filterValue.to === '') return;

      const column = this.props.columns.find(c => c.key === columnKey);
      if (!column || !column.filter) return;

      if (column.filter.type === 'select') {
        const dataKey = column.sortingKey || column.key;
        const selected = Array.isArray(filterValue) ? filterValue : [ filterValue ];
        rows = rows.filter(row => selected.includes(String(row[dataKey])));
      } else if (column.filter.type === 'range') {
        const dataKey = column.sortingKey || column.key;
        rows = rows.filter(row => {
          const val = Number(row[dataKey]);
          if (isNaN(val)) return true;
          if (filterValue.from !== '' && val < Number(filterValue.from)) return false;
          if (filterValue.to !== '' && val > Number(filterValue.to)) return false;
          return true;
        });
      }
    });

    return rows;
  }

  getSortingRows() {
    const sortingOrder = this.state.sortingDirection ? 'asc' : 'desc';
    const iteratees = [ row => Util.upperCaseString(row[this.state.sortingField]) ];
    const orders = [ sortingOrder ];

    const sortingColumn = this.props.columns.find(({ sortingKey }) => sortingKey === this.state.sortingField);
    if (sortingColumn && sortingColumn.secondarySortingKey) {
      iteratees.push(row => Util.upperCaseString(row[sortingColumn.secondarySortingKey]));
      orders.push(sortingOrder);
    }

    return orderBy(this.getFilteredRows(), iteratees, orders);
  }

  render() {
    const headerNodes = this.props.columns.map(column => {
      let arrow = '\u25bc';
      let arrowClassName = 'arrow';
      if (column.key === this.state.sortingField ||
        column.sortingKey === this.state.sortingField
      ) {
        arrow = this.state.sortingDirection ? '\u25b2' : '\u25bc';
      } else {
        arrowClassName += ' x-hidden';
      }

      return (
        <th
          key={'column-' + column.key}
          onClick={() => this.handleSorting(column.sortingKey || column.key)}
        >
          <ColumnFilter
            column={column}
            rows={this.props.rows}
            value={(this.props.columnFilters || {})[column.key]}
            onChange={this.handleColumnFilterChange}
            currentPilotName={this.props.currentPilotName}
          />
          <span className='th-label'>{column.label}</span>
          <span className={arrowClassName}>{arrow}</span>
        </th>
      );
    });

    const sortedRows = this.getSortingRows();

    const rowNodes = sortedRows.map(row => {
      const rowToDisplay = [];
      for (let i = 0; i < this.props.columns.length; i++) {
        const columnKey = this.props.columns[i].key;
        rowToDisplay.push(
          <td key={'cell-' + row.id + '-' + columnKey}>
            {Util.formatText(row[columnKey])}
          </td>
        );
      }
      return (
        <tr
          key={'row-' + row.id}
          onClick={() => this.handleRowClick(row.id)}
        >
          {rowToDisplay}
        </tr>
      );
    });

    return (
      <table className='koifly-table'>
        <thead>
          <tr>{headerNodes}</tr>
        </thead>
        <tbody>{rowNodes}</tbody>
      </table>
    );
  }
}


Table.propTypes = {
  rows: arrayOf(shape({
    id: number.isRequired
  })),
  columns: arrayOf(shape({
    key: string.isRequired,
    label: string.isRequired,
    defaultSortingDirection: bool.isRequired,
    sortingKey: string,
    filter: object
  })).isRequired,
  columnFilters: object,
  onColumnFilterChange: func,
  currentPilotName: string,
  initialSortingField: string.isRequired,
  storageKey: string,
  onRowClick: func
};

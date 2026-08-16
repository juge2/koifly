import React from 'react';
import { arrayOf, func, object, oneOfType, string } from 'prop-types';
import orderBy from 'lodash.orderby';


export default class ColumnFilter extends React.Component {
  constructor() {
    super();
    this.state = { open: false, dropdownAlign: 'center' };
    this.wrapperRef = React.createRef();
    this.dropdownRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.toggleOpen = this.toggleOpen.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('touchstart', this.handleClickOutside);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.open && !prevState.open && this.dropdownRef.current) {
      this.positionDropdown();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('touchstart', this.handleClickOutside);
  }

  handleClickOutside(e) {
    if (this.wrapperRef.current && !this.wrapperRef.current.contains(e.target)) {
      this.setState({ open: false });
    }
  }

  handleRangeChange(field, rawValue, currentV, bounds) {
    const fromVal = field === 'from' ? rawValue : currentV.from;
    const toVal = field === 'to' ? rawValue : currentV.to;
    const fromNum = Number(fromVal);
    const toNum = Number(toVal);

    if ((fromVal === '' || fromVal === undefined) && (toVal === '' || toVal === undefined)) {
      this.emitChange('All');
    } else if (fromNum === bounds.min && toNum === bounds.max) {
      this.emitChange('All');
    } else {
      this.emitChange({ from: fromVal, to: toVal });
    }
  }

  positionDropdown() {
    const dd = this.dropdownRef.current;
    if (!dd) return;
    const rect = dd.getBoundingClientRect();
    const margin = 8;
    let align = 'center';
    if (rect.right > window.innerWidth - margin) {
      align = 'right';
    } else if (rect.left < margin) {
      align = 'left';
    }
    this.setState({ dropdownAlign: align });
  }

  getSelectOptions() {
    const { column, rows, currentPilotName } = this.props;
    const dataKey = column.sortingKey || column.key;
    const seen = {};
    const values = [];

    rows.forEach(row => {
      const v = row[dataKey];
      if (v !== undefined && v !== null && v !== '' && !seen[v]) {
        seen[v] = true;
        values.push(v);
      }
    });

    const sorted = orderBy(values, [ v => String(v).toUpperCase() ]);
    const pilots = currentPilotName
      ? sorted.filter(v => v !== currentPilotName)
      : sorted;

    return pilots;
  }

  isActive() {
    const { value } = this.props;
    if (!value || value === 'All') return false;
    if (value && value.from !== undefined) {
      if (value.from === '' && value.to === '') return false;
      const bounds = this.getRangeBounds();
      if (Number(value.from) === bounds.min && Number(value.to) === bounds.max) return false;
      return true;
    }
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  emitChange(filterValue) {
    this.props.onChange(this.props.column.key, filterValue);
  }

  getRangeBounds() {
    const { column, rows } = this.props;
    const dataKey = column.sortingKey || column.key;
    let min = Infinity;
    let max = -Infinity;

    rows.forEach(row => {
      const v = Number(row[dataKey]);
      if (!isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });

    return { min: min === Infinity ? '' : min, max: max === -Infinity ? '' : max };
  }

  toggleOpen(e) {
    e.stopPropagation();
    this.setState(prev => ({ open: !prev.open }));
  }

  isSelectedPilot(value, pilot) {
    return Array.isArray(value) && value.includes(pilot);
  }

  togglePilot(opt) {
    const { value } = this.props;
    const selected = Array.isArray(value) ? [ ...value ] : [];
    const idx = selected.indexOf(opt);
    if (idx === -1) {
      selected.push(opt);
    } else {
      selected.splice(idx, 1);
    }
    if (selected.length === 0) {
      this.emitChange('All');
    } else {
      this.emitChange(selected);
    }
  }

  isPilotColumn() {
    const dataKey = this.props.column.sortingKey || this.props.column.key;
    return /pilot/i.test(dataKey);
  }

  renderSelect() {
    const { value, currentPilotName } = this.props;
    const options = this.getSelectOptions();

    return (
      <div className='filter-select'>
        <div
          className={'filter-option' + ((value === 'All' || !value) ? ' active' : '')}
          onClick={() => this.emitChange('All')}
        >
          <input type='checkbox' checked={value === 'All' || !value} readOnly={true} />
          All
        </div>
        {currentPilotName && this.isPilotColumn() && (
          <div
            className={'filter-option' + (this.isSelectedPilot(value, currentPilotName) ? ' active' : '')}
            onClick={() => this.togglePilot(currentPilotName)}
          >
            <input type='checkbox' checked={this.isSelectedPilot(value, currentPilotName)} readOnly={true} />
            Me
          </div>
        )}
        {options.map(opt => (
          <div
            key={opt}
            className={'filter-option' + (this.isSelectedPilot(value, opt) ? ' active' : '')}
            onClick={() => this.togglePilot(opt)}
          >
            <input type='checkbox' checked={this.isSelectedPilot(value, opt)} readOnly={true} />
            {opt}
          </div>
        ))}
      </div>
    );
  }

  renderRange() {
    const { value } = this.props;
    const bounds = this.getRangeBounds();
    const v = value && value.from !== undefined ? value : { from: bounds.min, to: bounds.max };

    return (
      <div className='filter-range'>
        <label className='filter-range-label'>
          <span className='filter-range-text'>from</span>
          <div className='filter-range-input-wrap'>
            <button
              type='button'
              className='filter-range-step filter-range-step--down'
              tabIndex='-1'
              onClick={e => {
                e.stopPropagation();
                const val = Number(v.from);
                this.handleRangeChange('from', String(isNaN(val) ? Number(bounds.min) : val - 1), v, bounds);
              }}
            >
              <svg viewBox='0 0 10 6' width='10' height='6'><path d='M0,0 L5,6 L10,0 Z' fill='currentColor'/></svg>
            </button>
            <input
              type='number'
              value={v.from}
              onClick={e => e.stopPropagation()}
              onChange={e => this.handleRangeChange('from', e.target.value, v, bounds)}
            />
            <button
              type='button'
              className='filter-range-step filter-range-step--up'
              tabIndex='-1'
              onClick={e => {
                e.stopPropagation();
                const val = Number(v.from);
                this.handleRangeChange('from', String(isNaN(val) ? Number(bounds.min) : val + 1), v, bounds);
              }}
            >
              <svg viewBox='0 0 10 6' width='10' height='6'><path d='M0,6 L5,0 L10,6 Z' fill='currentColor'/></svg>
            </button>
          </div>
        </label>
        <label className='filter-range-label'>
          <span className='filter-range-text'>to</span>
          <div className='filter-range-input-wrap'>
            <button
              type='button'
              className='filter-range-step filter-range-step--down'
              tabIndex='-1'
              onClick={e => {
                e.stopPropagation();
                const val = Number(v.to);
                this.handleRangeChange('to', String(isNaN(val) ? Number(bounds.max) : val - 1), v, bounds);
              }}
            >
              <svg viewBox='0 0 10 6' width='10' height='6'><path d='M0,0 L5,6 L10,0 Z' fill='currentColor'/></svg>
            </button>
            <input
              type='number'
              value={v.to}
              onClick={e => e.stopPropagation()}
              onChange={e => this.handleRangeChange('to', e.target.value, v, bounds)}
            />
            <button
              type='button'
              className='filter-range-step filter-range-step--up'
              tabIndex='-1'
              onClick={e => {
                e.stopPropagation();
                const val = Number(v.to);
                this.handleRangeChange('to', String(isNaN(val) ? Number(bounds.max) : val + 1), v, bounds);
              }}
            >
              <svg viewBox='0 0 10 6' width='10' height='6'><path d='M0,6 L5,0 L10,6 Z' fill='currentColor'/></svg>
            </button>
          </div>
        </label>
      </div>
    );
  }

  render() {
    const { column } = this.props;
    const { open, dropdownAlign } = this.state;

    if (!column.filter) return null;

    return (
      <span className='column-filter-wrapper' ref={this.wrapperRef}>
        <span
          className={'column-filter-icon' + (this.isActive() ? ' active' : '')}
          onClick={this.toggleOpen}
        >
          <svg viewBox='0 0 16 16' width='14' height='14' className='filter-svg'>
            <path d='M2,2 L14,2 L9.5,8.5 L9.5,14 L6.5,14 L6.5,8.5 L2,2 Z' fill='none' stroke='currentColor' strokeWidth='1.5'
              strokeLinejoin='round'
            />
            <line x1='3.5' y1='2' x2='3.5' y2='3.5'
              stroke='currentColor' strokeWidth='1'
            />
            <line x1='12.5' y1='2' x2='12.5' y2='3.5'
              stroke='currentColor' strokeWidth='1'
            />
          </svg>
        </span>
        {open && (
          <div
            className={'column-filter-dropdown column-filter-dropdown--' + dropdownAlign}
            ref={this.dropdownRef}
            onClick={e => e.stopPropagation()}
          >
            <button
              type='button'
              className='filter-close'
              tabIndex='-1'
              onClick={() => this.setState({ open: false })}
            >
              <svg viewBox='0 0 12 12' width='12' height='12'
                fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'
              >
                <line x1='1' y1='1' x2='11' y2='11'/>
                <line x1='11' y1='1' x2='1' y2='11'/>
              </svg>
            </button>
            {column.filter.type === 'select' && this.renderSelect()}
            {column.filter.type === 'range' && this.renderRange()}
          </div>
        )}
      </span>
    );
  }
}


ColumnFilter.propTypes = {
  column: object.isRequired,
  rows: arrayOf(object).isRequired,
  value: oneOfType([string, arrayOf(string), object]),
  onChange: func.isRequired,
  currentPilotName: string
};

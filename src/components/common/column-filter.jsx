import React from 'react';
import { arrayOf, func, object, oneOfType, string } from 'prop-types';
import orderBy from 'lodash.orderby';


const DAY_MS = 86400000;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// --- helpers for the `format: 'date'` range filter ---
// The slider geometry runs over calendar time (timestamps), so every position
// maps to a real date. Integers (YYYYMMDD dateNums) are only the serialized
// filter/sort value.

function dateNumToParts(dateNum) {
  const s = String(dateNum).padStart(8, '0');
  return {
    year: Number(s.slice(0, 4)),
    month: Number(s.slice(4, 6)),
    day: Number(s.slice(6, 8))
  };
}

function dateNumToTimestamp(dateNum) {
  const { year, month, day } = dateNumToParts(dateNum);
  return Date.UTC(year, month - 1, day);
}

function timestampToDateNum(ts) {
  const d = new Date(ts);
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function dateNumToInputValue(dateNum) {
  const { year, month, day } = dateNumToParts(dateNum);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function dateStrToDateNum(dateStr) {
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}


export default class ColumnFilter extends React.Component {
  constructor() {
    super();
    this.state = { open: false, dropdownAlign: 'center' };
    this.wrapperRef = React.createRef();
    this.dropdownRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.toggleOpen = this.toggleOpen.bind(this);
    this.handleRangePointerDown = this.handleRangePointerDown.bind(this);
    this.handleRangePointerEnd = this.handleRangePointerEnd.bind(this);
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
    let fromNum = field === 'from' ? Number(rawValue) : Number(currentV.from);
    let toNum = field === 'to' ? Number(rawValue) : Number(currentV.to);

    // Fall back to the range bounds for missing or invalid values
    if (isNaN(fromNum) || currentV.from === '' || currentV.from === undefined) {
      fromNum = bounds.min;
    }
    if (isNaN(toNum) || currentV.to === '' || currentV.to === undefined) {
      toNum = bounds.max;
    }

    // Keep the range ordered: from <= to
    if (field === 'from' && fromNum > toNum) {
      fromNum = toNum;
    }
    if (field === 'to' && toNum < fromNum) {
      toNum = fromNum;
    }

    if (fromNum === bounds.min && toNum === bounds.max) {
      this.emitChange('All');
    } else {
      this.emitChange({ from: String(fromNum), to: String(toNum) });
    }
  }

  handleRangePointerDown(e) {
    this._dragOrigin = { x: e.clientX, y: e.clientY };
  }

  handleRangePointerEnd(e) {
    if (this._dragOrigin) {
      const moved = Math.abs(e.clientX - this._dragOrigin.x) + Math.abs(e.clientY - this._dragOrigin.y);
      this._dragOrigin = null;
      // A real drag (pointer moved) must not trigger the bar's click-to-move on release
      if (moved > 4) {
        this._suppressClickUntil = Date.now() + 350;
      }
    }
  }

  handleRangeBarClick(e, from, to, bounds) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;

    // Ignore interactions that bubble up from a thumb input, and clicks that
    // follow a drag (they are the tail of a thumb drag, not a bar click).
    if (e.target !== e.currentTarget) return;
    if (this._suppressClickUntil && Date.now() < this._suppressClickUntil) return;

    const pct = (e.clientX - rect.left) / rect.width;
    let value;
    if (this.isDateRange()) {
      const minTs = dateNumToTimestamp(bounds.min);
      const maxTs = dateNumToTimestamp(bounds.max);
      const maxOffset = Math.max(0, Math.round((maxTs - minTs) / DAY_MS));
      const offset = clamp(Math.round(pct * maxOffset), 0, maxOffset);
      value = timestampToDateNum(minTs + offset * DAY_MS);
    } else {
      value = clamp(Math.round(bounds.min + (bounds.max - bounds.min) * pct), bounds.min, bounds.max);
    }

    const field = Math.abs(value - from) <= Math.abs(to - value) ? 'from' : 'to';
    this.handleRangeChange(field, String(value), { from, to }, bounds);
  }

  handleRangeDateChange(field, isoStr, currentV, bounds) {
    const num = isoStr === '' ? null : dateStrToDateNum(isoStr);
    this.handleRangeInput(field, num === null ? '' : String(num), currentV, bounds);
  }

  handleRangeInput(field, rawValue, currentV, bounds) {
    const text = v => (v === '' || v === undefined || isNaN(Number(v))) ? '' : String(Number(v));

    const current = this.props.value && typeof this.props.value === 'object'
      ? this.props.value
      : {};
    const currentFrom = text(current.from);
    const currentTo = text(current.to);

    const changed = rawValue === '' ? '' : text(rawValue);
    const from = field === 'from' ? changed : currentFrom;
    const to = field === 'to' ? changed : currentTo;

    if (from === '' || to === '') {
      if (from === '' && to === '') {
        this.emitChange('All');
      } else {
        this.emitChange({ from, to });
      }
      return;
    }

    let fromNum = Number(from);
    let toNum = Number(to);
    if (fromNum > toNum) {
      if (field === 'from') {
        fromNum = toNum;
      } else {
        toNum = fromNum;
      }
    }

    if (fromNum === bounds.min && toNum === bounds.max) {
      this.emitChange('All');
    } else {
      this.emitChange({ from: String(fromNum), to: String(toNum) });
    }
  }

  isDateRange() {
    return this.props.column && this.props.column.filter && this.props.column.filter.format === 'date';
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

  renderRangeDate() {
    const { value } = this.props;
    const bounds = this.getRangeBounds();

    const minTs = dateNumToTimestamp(bounds.min);
    const maxTs = dateNumToTimestamp(bounds.max);
    if (isNaN(minTs) || isNaN(maxTs)) {
      return <div className='filter-range'>No data</div>;
    }

    const maxOffset = Math.max(0, Math.round((maxTs - minTs) / DAY_MS));
    const total = maxOffset || 1;
    const offsetAt = n => {
      if (n === undefined || n === null || n === '' || isNaN(Number(n))) return null;
      return Math.round((dateNumToTimestamp(Number(n)) - minTs) / DAY_MS);
    };
    const dateNumAt = off => timestampToDateNum(minTs + clamp(off, 0, maxOffset) * DAY_MS);
    const pct = off => (clamp(off / total, 0, 1) * 100).toFixed(2) + '%';

    let from = bounds.min;
    let to = bounds.max;
    if (value && value.from !== undefined && value.from !== '') {
      const fromOff = offsetAt(value.from);
      if (fromOff !== null) from = dateNumAt(fromOff);
    }
    if (value && value.to !== undefined && value.to !== '') {
      const toOff = offsetAt(value.to);
      if (toOff !== null) to = dateNumAt(toOff);
    }
    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }

    const fromOff = clamp(offsetAt(from), 0, maxOffset);
    const toOff = clamp(offsetAt(to), 0, maxOffset);

    return (
      <div className='filter-range'>
        <div
          className='filter-range-slider'
          style={{ '--low': pct(fromOff), '--high': pct(toOff) }}
          onMouseDown={this.handleRangePointerDown}
          onMouseUp={this.handleRangePointerEnd}
          onClick={e => this.handleRangeBarClick(e, from, to, bounds)}
        >
          <input
            type='range'
            className='filter-range-slider--from'
            min={0}
            max={maxOffset}
            step={1}
            value={fromOff}
            onChange={e => this.handleRangeChange('from', String(dateNumAt(Number(e.target.value))), { from, to }, bounds)}
          />
          <input
            type='range'
            className='filter-range-slider--to'
            min={0}
            max={maxOffset}
            step={1}
            value={toOff}
            onChange={e => this.handleRangeChange('to', String(dateNumAt(Number(e.target.value))), { from, to }, bounds)}
          />
        </div>
        <div className='filter-range-values'>
          <label className='filter-range-field'>
            <span className='filter-range-field-label'>From</span>
            <input
              type='date'
              className='filter-range-field-input filter-range-field-input--date'
              value={dateNumToInputValue(from)}
              onChange={e => this.handleRangeDateChange('from', e.target.value, { from, to }, bounds)}
            />
          </label>
          <span className='filter-range-sep'>–</span>
          <label className='filter-range-field'>
            <span className='filter-range-field-label'>To</span>
            <input
              type='date'
              className='filter-range-field-input filter-range-field-input--date'
              value={dateNumToInputValue(to)}
              onChange={e => this.handleRangeDateChange('to', e.target.value, { from, to }, bounds)}
            />
          </label>
        </div>
        <button
          type='button'
          className='filter-range-all'
          tabIndex='-1'
          onClick={e => {
            e.stopPropagation();
            this.emitChange('All');
          }}
        >
          All
        </button>
      </div>
    );
  }

  renderRange() {
    const { value } = this.props;
    const bounds = this.getRangeBounds();
    const min = Number(bounds.min);
    const max = Number(bounds.max);

    if (isNaN(min) || isNaN(max)) {
      return <div className='filter-range'>No data</div>;
    }

    let from = min;
    let to = max;
    if (value && value.from !== undefined && value.from !== '') {
      const n = Number(value.from);
      if (!isNaN(n)) from = n;
    }
    if (value && value.to !== undefined && value.to !== '') {
      const n = Number(value.to);
      if (!isNaN(n)) to = n;
    }
    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }

    const pct = n => (((n - min) / (max - min)) * 100).toFixed(2) + '%';

    return (
      <div className='filter-range'>
        <div
          className='filter-range-slider'
          style={{ '--low': pct(from), '--high': pct(to) }}
          onMouseDown={this.handleRangePointerDown}
          onMouseUp={this.handleRangePointerEnd}
          onClick={e => this.handleRangeBarClick(e, from, to, bounds)}
        >
          <input
            type='range'
            className='filter-range-slider--from'
            min={min}
            max={max}
            step={1}
            value={from}
            onChange={e => this.handleRangeChange('from', e.target.value, { from, to }, bounds)}
          />
          <input
            type='range'
            className='filter-range-slider--to'
            min={min}
            max={max}
            step={1}
            value={to}
            onChange={e => this.handleRangeChange('to', e.target.value, { from, to }, bounds)}
          />
        </div>
        <div className='filter-range-values'>
          <label className='filter-range-field'>
            <span className='filter-range-field-label'>From</span>
            <input
              type='number'
              className='filter-range-field-input'
              min={min}
              max={max}
              step={1}
              value={String(from)}
              onChange={e => this.handleRangeInput('from', e.target.value, { from, to }, bounds)}
            />
          </label>
          <span className='filter-range-sep'>–</span>
          <label className='filter-range-field'>
            <span className='filter-range-field-label'>To</span>
            <input
              type='number'
              className='filter-range-field-input'
              min={min}
              max={max}
              step={1}
              value={String(to)}
              onChange={e => this.handleRangeInput('to', e.target.value, { from, to }, bounds)}
            />
          </label>
        </div>
        <button
          type='button'
          className='filter-range-all'
          tabIndex='-1'
          onClick={e => {
            e.stopPropagation();
            this.emitChange('All');
          }}
        >
          All
        </button>
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
            {column.filter.type === 'range' && (this.isDateRange() ? this.renderRangeDate() : this.renderRange())}
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

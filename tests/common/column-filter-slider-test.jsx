/* eslint-disable */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { expect } from 'chai';
import ColumnFilter from '../../src/components/common/column-filter';

describe('ColumnFilter slider', () => {
  afterEach(cleanup);

  const rows = [
    { id: 1, val: 100, other: 'a' },
    { id: 2, val: 200, other: 'b' },
    { id: 3, val: 300, other: 'c' }
  ];
  const column = { key: 'other', label: 'x', sortingKey: 'val', defaultSortingDirection: true, filter: { type: 'range' } };

  it('renders two range thumbs when range filter opened', () => {
    let emitted = null;
    const { container, getByLabelText } = render(
      <ColumnFilter column={column} rows={rows} value={'All'} onChange={(k, v) => { emitted = v; }} />
    );
    const icon = container.querySelector('.column-filter-icon');
    fireEvent.click(icon);
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders.length).to.equal(2);
    expect(sliders[0].min).to.equal('100');
    expect(sliders[0].max).to.equal('300');
    expect(sliders[1].min).to.equal('100');
    expect(sliders[1].max).to.equal('300');
  });

  it('emits range {from,to} and clamping keeps from<=to', () => {
    let emitted = null;
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={'All'} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const from = container.querySelectorAll('input[type="range"]')[0];
    fireEvent.change(from, { target: { value: '250' } });
    expect(emitted).to.deep.equal({ from: '250', to: '300' });
  });

  it('emits All on full range', () => {
    let emitted = null;
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={{ from: '250', to: '300' }} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const from = container.querySelectorAll('input[type="range"]')[0];
    fireEvent.change(from, { target: { value: '100' } });
    expect(emitted).to.equal('All');
  });

  it('renders editable number inputs below the slider', () => {
    let emitted = null;
    const { container, getAllByLabelText } = render(
      <ColumnFilter column={column} rows={rows} value={{ from: '100', to: '250' }} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const numbers = container.querySelectorAll('input[type="number"]');
    expect(numbers.length).to.equal(2);
    expect(numbers[0].value).to.equal('100');
    expect(numbers[1].value).to.equal('250');
    expect(getAllByLabelText('From').length).to.equal(1);
    expect(getAllByLabelText('To').length).to.equal(1);
  });

  it('emits {from,to} when a value is typed directly', () => {
    let emitted = null;
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={'All'} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const numbers = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[0], { target: { value: '150' } });
    expect(emitted).to.deep.equal({ from: '150', to: '' });
  });

  it('keeps from<=to when the from input exceeds to', () => {
    let emitted = null;
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={{ from: '100', to: '200' }} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const numbers = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[0], { target: { value: '250' } });
    expect(emitted).to.deep.equal({ from: '200', to: '200' });
  });

  it('emits open-ended {from,\'\'} when the to input is cleared', () => {
    let emitted = null;
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={{ from: '100', to: '200' }} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const numbers = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[1], { target: { value: '' } });
    expect(emitted).to.deep.equal({ from: '100', to: '' });
  });

  it('moves the nearest thumb when the bar is clicked', () => {
    let filterValue = { from: '100', to: '300' };
    const { container, rerender } = render(
      <ColumnFilter column={column} rows={rows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const bar = container.querySelector('.filter-range-slider');
    bar.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 20, width: 200, height: 20 });
    fireEvent.click(bar, { clientX: 150 });
    expect(filterValue).to.deep.equal({ from: '100', to: '250' });
    rerender(
      <ColumnFilter column={column} rows={rows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(bar, { clientX: 100 });
    expect(filterValue).to.deep.equal({ from: '100', to: '200' });
  });

  it('ignores bar clicks that originate from a thumb input', () => {
    let emitted = null;
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={{ from: '100', to: '300' }} onChange={(k, v) => { emitted = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const bar = container.querySelector('.filter-range-slider');
    bar.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 20, width: 200, height: 20 });
    const thumb = container.querySelector('.filter-range-slider--to');
    thumb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emitted).to.equal(null);
  });

  it('does not move a thumb when a click follows a drag on the bar', () => {
    let filterValue = { from: '100', to: '300' };
    const { container } = render(
      <ColumnFilter column={column} rows={rows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const bar = container.querySelector('.filter-range-slider');
    bar.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 20, width: 200, height: 20 });
    // Simulate a drag: mouse down at one spot, up far away (move > 4px), then the release click
    fireEvent.mouseDown(bar, { clientX: 150, clientY: 10 });
    fireEvent.mouseMove(bar, { clientX: 60, clientY: 10 });
    fireEvent.mouseUp(bar, { clientX: 60, clientY: 10 });
    fireEvent.click(bar, { clientX: 60 });
    expect(filterValue).to.deep.equal({ from: '100', to: '300' });
  });

  it('emits All when both inputs are cleared', () => {
    let filterValue = { from: '100', to: '200' };
    const { container, rerender } = render(
      <ColumnFilter column={column} rows={rows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    const numbers = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[0], { target: { value: '' } });
    rerender(
      <ColumnFilter column={column} rows={rows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.change(container.querySelectorAll('input[type="number"]')[1], { target: { value: '' } });
    expect(filterValue).to.equal('All');
  });

  it('renders date inputs for a date-range column and converts on change', () => {
    const dateColumn = { key: 'd', label: 'Date', sortingKey: 'dnum', defaultSortingDirection: false, filter: { type: 'range', format: 'date' } };
    const dateRows = [
      { id: 1, dnum: 20260101 },
      { id: 2, dnum: 20260615 },
      { id: 3, dnum: 20261231 }
    ];
    let filterValue = { from: '20260101', to: '20261231' };
    const { container, rerender } = render(
      <ColumnFilter column={dateColumn} rows={dateRows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    let dates = container.querySelectorAll('input[type="date"]');
    expect(dates.length).to.equal(2);
    expect(dates[0].value).to.equal('2026-01-01');
    expect(dates[1].value).to.equal('2026-12-31');
    fireEvent.change(dates[0], { target: { value: '2026-06-01' } });
    expect(filterValue).to.deep.equal({ from: '20260601', to: '20261231' });
    rerender(
      <ColumnFilter column={dateColumn} rows={dateRows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    dates = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dates[1], { target: { value: '' } });
    expect(filterValue).to.deep.equal({ from: '20260601', to: '' });
  });

  it('slider only ever emits real calendar dates within the data bounds', () => {
    const dateColumn = { key: 'd', label: 'Date', sortingKey: 'dnum', defaultSortingDirection: false, filter: { type: 'range', format: 'date' } };
    const dateRows = [
      { id: 1, dnum: 20260101 },
      { id: 2, dnum: 20260615 },
      { id: 3, dnum: 20261231 }
    ];
    const dayMs = 86400000;
    const maxOffset = Math.round((Date.UTC(2026, 11, 31) - Date.UTC(2026, 0, 1)) / dayMs);
    let filterValue = { from: '20260101', to: '20261231' };
    const { container, rerender } = render(
      <ColumnFilter column={dateColumn} rows={dateRows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));

    fireEvent.change(container.querySelector('.filter-range-slider--to'), { target: { value: String(Math.round(maxOffset * 0.5)) } });
    expect(typeof filterValue.to).to.equal('string');
    expect(filterValue.to).to.match(/^20\d{6}$/);
    expect(Number(filterValue.to)).to.be.within(20260101, 20261231);
    // and it round-trips into a real calendar date for the picker
    rerender(
      <ColumnFilter column={dateColumn} rows={dateRows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    const picker = container.querySelectorAll('input[type="date"]')[1];
    expect(picker.value).to.match(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(picker.value).getTime()).to.be.within(Date.UTC(2026, 0, 1), Date.UTC(2026, 11, 31));
  });

  it('clamps the to side to from when the slider crosses', () => {
    const dateColumn = { key: 'd', label: 'Date', sortingKey: 'dnum', defaultSortingDirection: false, filter: { type: 'range', format: 'date' } };
    const dateRows = [
      { id: 1, dnum: 20260101 },
      { id: 2, dnum: 20260615 },
      { id: 3, dnum: 20261231 }
    ];
    const minTs = Date.UTC(2026, 0, 1);
    const byDate = n => Math.round((Date.UTC(n.slice(0, 4), n.slice(4, 6) - 1, n.slice(6, 8)) - minTs) / 86400000);
    // March 1 lies before the current from value (June 1) -> crossing
    const toOffset = byDate('20260301');
    let filterValue = { from: '20260601', to: '20261231' };
    const { container } = render(
      <ColumnFilter column={dateColumn} rows={dateRows} value={filterValue} onChange={(k, v) => { filterValue = v; }} />
    );
    fireEvent.click(container.querySelector('.column-filter-icon'));
    fireEvent.change(container.querySelector('.filter-range-slider--to'), { target: { value: String(toOffset) } });
    expect(filterValue.to).to.equal(filterValue.from);
  });

  it('displays a real date even when a stored value is not a calendar date', () => {
    const dateColumn = { key: 'd', label: 'Date', sortingKey: 'dnum', defaultSortingDirection: false, filter: { type: 'range', format: 'date' } };
    const dateRows = [
      { id: 1, dnum: 20260101 },
      { id: 2, dnum: 20260615 },
      { id: 3, dnum: 20261231 }
    ];
    const { container: c1 } = render(
      <ColumnFilter column={dateColumn} rows={dateRows} value={{ from: '20260101', to: '20261299' }} onChange={() => {}} />
    );
    fireEvent.click(c1.querySelector('.column-filter-icon'));
    let dates = c1.querySelectorAll('input[type="date"]');
    expect(dates[1].value).to.equal('2026-12-31');

    const { container: c2 } = render(
      <ColumnFilter column={dateColumn} rows={dateRows} value={{ from: '20260101', to: '20261300' }} onChange={() => {}} />
    );
    fireEvent.click(c2.querySelector('.column-filter-icon'));
    dates = c2.querySelectorAll('input[type="date"]');
    expect(dates[1].value).to.equal('2026-12-31');
  });
});
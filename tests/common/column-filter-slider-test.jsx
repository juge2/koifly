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
});
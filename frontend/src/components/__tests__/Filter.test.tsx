import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import FilterPanel from '../Filter';

const noop = () => {};

describe('FilterPanel', () => {
  test('calls onApply when apply button clicked', () => {
    const onApply = jest.fn();
    render(
      <FilterPanel
        open={true}
        onClose={noop}
        minPrice=""
        maxPrice=""
        minRank=""
        maxRank=""
        setMinPrice={noop}
        setMaxPrice={noop}
        setMinRank={noop}
        setMaxRank={noop}
        onClear={noop}
        onApply={onApply}
      />
    );
    fireEvent.click(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalled();
  });

  test('calls onClear when reset button clicked', () => {
    const onClear = jest.fn();
    render(
      <FilterPanel
        open={true}
        onClose={noop}
        minPrice=""
        maxPrice=""
        minRank=""
        maxRank=""
        setMinPrice={noop}
        setMaxPrice={noop}
        setMinRank={noop}
        setMaxRank={noop}
        onClear={onClear}
        onApply={noop}
      />
    );
    fireEvent.click(screen.getByText('Reset'));
    expect(onClear).toHaveBeenCalled();
  });
});

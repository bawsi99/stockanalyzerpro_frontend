import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StockSelector } from './stock-selector';

describe('StockSelector', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <StockSelector
        value=""
        onValueChange={mockOnValueChange}
        label="Stock Symbol"
      />
    );

    expect(screen.getByText('Stock Symbol')).toBeInTheDocument();
  });

  it('shows placeholder when no value is selected', () => {
    render(
      <StockSelector
        value=""
        onValueChange={mockOnValueChange}
        placeholder="Select a stock"
      />
    );

    expect(screen.getByText('Select a stock')).toBeInTheDocument();
  });

  it('shows selected stock when value is provided', () => {
    render(
      <StockSelector
        value="RELIANCE"
        onValueChange={mockOnValueChange}
      />
    );

    expect(screen.getByText(/RELIANCE/)).toBeInTheDocument();
  });

  it('opens dialog when clicked', () => {
    render(
      <StockSelector
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByPlaceholderText('Search stock by symbol or name...')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <StockSelector
        value=""
        onValueChange={mockOnValueChange}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
}); 
/**
 * Tests for CategoryFilter component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import type { Category } from '@/lib/types/category';
import CategoryFilter from '@/components/CategoryFilter';

const mockCategories: Category[] = [
  {
    id: 'landscapes',
    name: 'Landscapes',
    description: 'Nature views',
    colour: '#228B22',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Family photos',
    colour: '#FFB6C1',
  },
];

const mockCounts: Record<string, number> = {
  landscapes: 2,
  family: 1,
};

describe('CategoryFilter', () => {
  it('renders all categories with names and counts', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        categoryCounts={mockCounts}
        hiddenCategories={new Set()}
        onToggleCategory={jest.fn()}
        onShowAll={jest.fn()}
        onHideAll={jest.fn()}
      />,
    );

    expect(screen.getByText(/landscapes/i)).toBeInTheDocument();
    expect(screen.getByText(/family/i)).toBeInTheDocument();

    // Counts rendered somewhere in the pills
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onToggleCategory when a category pill is clicked', () => {
    const onToggleCategory = jest.fn();

    render(
      <CategoryFilter
        categories={mockCategories}
        categoryCounts={mockCounts}
        hiddenCategories={new Set()}
        onToggleCategory={onToggleCategory}
        onShowAll={jest.fn()}
        onHideAll={jest.fn()}
      />,
    );

    const landscapesButton = screen.getByRole('button', {
      name: /landscapes/i,
    });

    fireEvent.click(landscapesButton);

    expect(onToggleCategory).toHaveBeenCalledTimes(1);
    expect(onToggleCategory).toHaveBeenCalledWith('landscapes');
  });

  it('calls onHideAll when All is clicked and no categories are hidden', () => {
    const onHideAll = jest.fn();

    render(
      <CategoryFilter
        categories={mockCategories}
        categoryCounts={mockCounts}
        hiddenCategories={new Set()}
        onToggleCategory={jest.fn()}
        onShowAll={jest.fn()}
        onHideAll={onHideAll}
      />,
    );

    const allButton = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allButton);

    expect(onHideAll).toHaveBeenCalledTimes(1);
  });

  it('calls onShowAll when All is clicked and some categories are hidden', () => {
    const onShowAll = jest.fn();

    render(
      <CategoryFilter
        categories={mockCategories}
        categoryCounts={mockCounts}
        hiddenCategories={new Set(['family'])}
        onToggleCategory={jest.fn()}
        onShowAll={onShowAll}
        onHideAll={jest.fn()}
      />,
    );

    const allButton = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allButton);

    expect(onShowAll).toHaveBeenCalledTimes(1);
  });
});


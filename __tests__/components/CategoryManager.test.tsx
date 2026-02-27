/**
 * Tests for CategoryManager component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryManager from '@/components/CategoryManager';
import type { Category } from '@/lib/types/category';

const mockCategories: (Category & { imageCount: number })[] = [
  {
    id: 'landscapes',
    name: 'Landscapes',
    description: 'Nature views',
    colour: '#228B22',
    imageCount: 3,
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Family photos',
    colour: '#FFB6C1',
    imageCount: 0,
  },
];

const mockRouter = {
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('CategoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render category list', () => {
    render(<CategoryManager categories={mockCategories} />);

    expect(screen.getByText('Landscapes')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
  });

  it('should show add category form when Add Category is clicked', () => {
    render(<CategoryManager categories={mockCategories} />);

    fireEvent.click(screen.getByRole('button', { name: /add category/i }));

    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create category/i })).toBeInTheDocument();
  });

  it('should call onCategoryChange after successfully creating a category', async () => {
    const onCategoryChange = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { id: 'new-cat', name: 'New', description: '', colour: '#FF5733' } }),
      })
    ) as jest.Mock;

    render(<CategoryManager categories={mockCategories} onCategoryChange={onCategoryChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add category/i }));
    fireEvent.change(screen.getByLabelText(/category name/i), { target: { value: 'New Category' } });
    fireEvent.submit(screen.getByRole('button', { name: /create category/i }).closest('form')!);

    await waitFor(() => {
      expect(onCategoryChange).toHaveBeenCalledTimes(1);
    });

    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('should not call onCategoryChange when callback is not provided', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { id: 'new-cat', name: 'New', description: '', colour: '#FF5733' } }),
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<CategoryManager categories={mockCategories} />);

    fireEvent.click(screen.getByRole('button', { name: /add category/i }));
    fireEvent.change(screen.getByLabelText(/category name/i), { target: { value: 'New Category' } });
    fireEvent.submit(screen.getByRole('button', { name: /create category/i }).closest('form')!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('should not call onCategoryChange when create fails', async () => {
    const onCategoryChange = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: false, error: 'Server error' }),
      })
    ) as jest.Mock;

    render(<CategoryManager categories={mockCategories} onCategoryChange={onCategoryChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add category/i }));
    fireEvent.change(screen.getByLabelText(/category name/i), { target: { value: 'New Category' } });
    fireEvent.submit(screen.getByRole('button', { name: /create category/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/failed to create category|server error/i)).toBeInTheDocument();
    });

    expect(onCategoryChange).not.toHaveBeenCalled();
  });
});

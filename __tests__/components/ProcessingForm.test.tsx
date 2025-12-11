/**
 * Tests for ProcessingForm component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ProcessingForm from '@/components/ProcessingForm';
import type { Category } from '@/lib/types/category';
import type { DisplayProfile } from '@/lib/types/display';

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

const mockDisplays: DisplayProfile[] = [
  {
    id: 'inky_frame_7_spectra',
    name: 'Inky Frame 7.3" (Spectra)',
    description: 'Pimoroni Inky Frame',
    width: 800,
    height: 480,
    palette: ['#000000', '#FFFFFF'],
    manufacturer: 'Pimoroni',
    defaultDithering: 'floyd-steinberg',
  },
  {
    id: 'inky_frame_7_colour',
    name: 'Inky Frame 7.3" (Colour)',
    description: 'Pimoroni Inky Frame',
    width: 800,
    height: 480,
    palette: ['#000000', '#FFFFFF', '#FF0000'],
    manufacturer: 'Pimoroni',
    defaultDithering: 'floyd-steinberg',
  },
];

describe('ProcessingForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render category dropdown', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('should render all categories in dropdown', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    const select = screen.getByLabelText(/category/i);
    expect(select).toHaveTextContent('Landscapes');
    expect(select).toHaveTextContent('Family');
  });

  it('should render display checkboxes', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    expect(screen.getByText(/display types/i)).toBeInTheDocument();
    expect(screen.getByText(/Inky Frame 7.3" \(Spectra\)/)).toBeInTheDocument();
    expect(screen.getByText(/Inky Frame 7.3" \(Colour\)/)).toBeInTheDocument();
  });

  it('should render dithering algorithm dropdown', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    expect(screen.getByLabelText(/dithering algorithm/i)).toBeInTheDocument();
  });

  it('should disable submit when no files', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /process images/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show message when no files', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={false}
      />
    );

    expect(
      screen.getByText(/upload images above to enable processing/i)
    ).toBeInTheDocument();
  });

  it('should disable form when processing', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={true}
        hasFiles={true}
      />
    );

    const categorySelect = screen.getByLabelText(/category/i);
    const ditheringSelect = screen.getByLabelText(/dithering algorithm/i);

    expect(categorySelect).toBeDisabled();
    expect(ditheringSelect).toBeDisabled();
  });

  it('should show processing state in button', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={true}
        hasFiles={true}
      />
    );

    expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
  });

  it('should call onSubmit with correct options', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    // Select category
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'landscapes' },
    });

    // Select display
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Submit form
    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      categoryId: 'landscapes',
      displayIds: ['inky_frame_7_spectra'],
      dithering: 'floyd-steinberg',
    });
  });

  it('should not submit without category', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    // Select display but not category
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Submit form
    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not submit without displays selected', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    // Select category but not displays
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'landscapes' },
    });

    // Submit form
    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});





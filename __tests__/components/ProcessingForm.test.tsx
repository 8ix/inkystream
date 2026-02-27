/**
 * Tests for ProcessingForm component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ProcessingForm from '@/components/ProcessingForm';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
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

// Two devices so neither is auto-selected (auto-select only fires when length === 1)
const mockDevices: Device[] = [
  {
    id: 'living-room',
    name: 'Living Room Frame',
    displayId: 'inky_frame_7_spectra',
    platform: 'micropython-inky-frame',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'office',
    name: 'Office Frame',
    displayId: 'inky_frame_7_colour',
    platform: 'micropython-inky-frame',
    createdAt: '2024-01-01T00:00:00Z',
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
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    expect(screen.getByLabelText(/save to category/i)).toBeInTheDocument();
  });

  it('should render all categories in dropdown', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    const select = screen.getByLabelText(/save to category/i);
    expect(select).toHaveTextContent('Landscapes');
    expect(select).toHaveTextContent('Family');
  });

  it('should render target device checkboxes', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    expect(screen.getByText(/target devices/i)).toBeInTheDocument();
    expect(screen.getByText(/living room frame/i)).toBeInTheDocument();
    expect(screen.getByText(/office frame/i)).toBeInTheDocument();
  });

  it('should disable submit when no files', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        devices={mockDevices}
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
        devices={mockDevices}
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
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={true}
        hasFiles={true}
      />
    );

    const categorySelect = screen.getByLabelText(/save to category/i);
    expect(categorySelect).toBeDisabled();
  });

  it('should show processing state in button', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        devices={mockDevices}
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
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    // Category auto-selects to first ('landscapes') via useEffect
    // Select the first device
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Submit form
    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      categoryId: 'landscapes',
      deviceIds: ['living-room'],
      dithering: 'floyd-steinberg',
      fitMode: 'smart',
      backgroundColor: '#FFFFFF',
    });
  });

  it('should not submit without category', () => {
    // Pass no categories so auto-select never fires; categoryId stays ''
    render(
      <ProcessingForm
        categories={[]}
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    // Select a device
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not submit without devices selected', () => {
    render(
      <ProcessingForm
        categories={mockCategories}
        devices={mockDevices}
        displays={mockDisplays}
        onSubmit={mockOnSubmit}
        isProcessing={false}
        hasFiles={true}
      />
    );

    // Category auto-selects; no device checkbox is clicked
    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});

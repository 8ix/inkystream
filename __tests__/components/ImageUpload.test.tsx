/**
 * Tests for ImageUpload component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '@/components/ImageUpload';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(({ onDrop }) => ({
    getRootProps: () => ({
      onClick: jest.fn(),
    }),
    getInputProps: () => ({}),
    isDragActive: false,
  })),
}));

describe('ImageUpload', () => {
  const mockOnFilesSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dropzone area', () => {
    render(<ImageUpload onFilesSelected={mockOnFilesSelected} />);

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('should show supported formats', () => {
    render(<ImageUpload onFilesSelected={mockOnFilesSelected} />);

    expect(screen.getByText(/supports jpeg, png, webp/i)).toBeInTheDocument();
  });

  it('should show max files limit', () => {
    render(<ImageUpload onFilesSelected={mockOnFilesSelected} maxFiles={5} />);

    expect(screen.getByText(/max 5 files/i)).toBeInTheDocument();
  });

  it('should render with default max files', () => {
    render(<ImageUpload onFilesSelected={mockOnFilesSelected} />);

    expect(screen.getByText(/max 10 files/i)).toBeInTheDocument();
  });
});


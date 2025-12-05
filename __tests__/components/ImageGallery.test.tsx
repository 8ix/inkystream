/**
 * Tests for ImageGallery component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ImageGallery from '@/components/ImageGallery';
import type { ImageMetadata } from '@/lib/types/image';
import type { Category } from '@/lib/types/category';

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

const mockImages: ImageMetadata[] = [
  {
    id: 'img1',
    originalFilename: 'sunset.jpg',
    categoryId: 'landscapes',
    processedAt: '2024-01-15T10:30:00Z',
    variants: [
      {
        displayId: 'inky_frame_7_spectra',
        filename: 'inky_frame_7_spectra.png',
        width: 800,
        height: 480,
      },
    ],
  },
  {
    id: 'img2',
    originalFilename: 'beach.jpg',
    categoryId: 'landscapes',
    processedAt: '2024-01-14T09:00:00Z',
    variants: [
      {
        displayId: 'inky_frame_7_spectra',
        filename: 'inky_frame_7_spectra.png',
        width: 800,
        height: 480,
      },
    ],
  },
];

describe('ImageGallery', () => {
  it('should render empty state when no images', () => {
    render(<ImageGallery images={[]} categories={mockCategories} />);

    expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
  });

  it('should render image thumbnails', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
  });

  it('should show upload prompt when empty', () => {
    render(<ImageGallery images={[]} categories={mockCategories} />);

    expect(
      screen.getByText(/upload and process images to see them here/i)
    ).toBeInTheDocument();
  });

  it('should open detail modal when image is clicked', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    // Click on first image container
    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    // Modal should show filename
    expect(screen.getByText('sunset.jpg')).toBeInTheDocument();
  });

  it('should show category name in detail modal', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    expect(screen.getByText(/landscapes/i)).toBeInTheDocument();
  });

  it('should show display variants in detail modal', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    expect(screen.getByText(/display variants/i)).toBeInTheDocument();
    expect(screen.getByText(/800x480/)).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    // Open modal
    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    // Find and click close button
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(
      (btn) => btn.textContent === 'Close'
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    // Modal content should be gone (filename no longer in document)
    // Note: The filename appears in hover tooltip too, so we check the modal structure
    expect(screen.queryByText(/display variants/i)).not.toBeInTheDocument();
  });

  it('should show metadata section in modal', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    expect(screen.getByText(/metadata/i)).toBeInTheDocument();
    expect(screen.getByText(/image id/i)).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    // Check that date is formatted (contains Jan 2024)
    expect(screen.getByText(/15 jan 2024/i)).toBeInTheDocument();
  });
});


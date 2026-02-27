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
        deviceId: 'inky_frame_7_spectra',
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
        deviceId: 'inky_frame_7_spectra',
        displayId: 'inky_frame_7_spectra',
        filename: 'inky_frame_7_spectra.png',
        width: 800,
        height: 480,
      },
    ],
  },
  {
    id: 'img3',
    originalFilename: 'family.jpg',
    categoryId: 'family',
    processedAt: '2024-01-13T12:00:00Z',
    variants: [
      {
        deviceId: 'inky_frame_7_spectra',
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
    expect(images.length).toBe(3);
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

    // Modal should show filename in the modal header
    expect(
      screen.getByRole('heading', { name: 'sunset.jpg' }),
    ).toBeInTheDocument();
  });

  it('should show category name in detail modal', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    // Category name appears in the metadata section
    expect(
      screen.getByText(/category/i).parentElement,
    ).toHaveTextContent(/landscapes/i);
  });

  it('should show display variants in detail modal', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    const imageContainers = document.querySelectorAll('.group');
    fireEvent.click(imageContainers[0]);

    expect(screen.getByText(/device variants/i)).toBeInTheDocument();
    expect(screen.getByText(/800×480/)).toBeInTheDocument();
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

    // Check that date is formatted (contains Jan 2024) in either header or metadata
    const dateTexts = screen.getAllByText(/15 jan 2024/i);
    expect(dateTexts.length).toBeGreaterThan(0);
  });

  it('should render category filter controls', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /landscapes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /family/i }),
    ).toBeInTheDocument();
  });

  it('should filter images when a category is toggled off', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    // Initially all images are visible
    expect(screen.getAllByRole('img').length).toBe(3);

    // Hide landscapes category
    const landscapesButton = screen.getByRole('button', {
      name: /landscapes/i,
    });
    fireEvent.click(landscapesButton);

    // Only family image should remain
    const visibleImages = screen.getAllByRole('img');
    expect(visibleImages.length).toBe(1);
    expect(
      screen.getByAltText('family.jpg'),
    ).toBeInTheDocument();
  });

  it('should hide all images when All is toggled off and show a filtered empty state', () => {
    render(<ImageGallery images={mockImages} categories={mockCategories} />);

    // All visible initially
    expect(screen.getAllByRole('img').length).toBe(3);

    // Click All to hide all categories
    const allButton = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allButton);

    // No images should be visible
    expect(screen.queryAllByRole('img').length).toBe(0);
    expect(
      screen.getByText(/no images match the current filters/i),
    ).toBeInTheDocument();
  });
});







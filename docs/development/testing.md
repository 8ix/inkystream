# Testing Guide

This guide covers how to write and run tests for InkyStream.

## Test Stack

- **Jest**: Test runner
- **React Testing Library**: Component testing
- **jest-environment-jsdom**: Browser environment simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/lib/utils/categories.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="Category"
```

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── current.test.ts
│   ├── next.test.ts
│   ├── categories.test.ts
│   └── displays.test.ts
├── components/             # Component tests
│   ├── ImageUpload.test.tsx
│   ├── ImageGallery.test.tsx
│   └── CategoryBadge.test.tsx
└── lib/                    # Library tests
    ├── processors/
    │   └── dither.test.ts
    ├── displays/
    │   └── profiles.test.ts
    └── utils/
        ├── categories.test.ts
        └── image.test.ts
```

## Writing Tests

### Unit Tests

Test individual functions in isolation:

```typescript
// __tests__/lib/utils/categories.test.ts
import { getCategories, getCategory } from '@/lib/utils/categories';

describe('Category Utils', () => {
  describe('getCategories', () => {
    it('should return an array of categories', async () => {
      const categories = await getCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include required properties', async () => {
      const categories = await getCategories();
      
      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('colour');
      });
    });
  });

  describe('getCategory', () => {
    it('should return a category by ID', async () => {
      const category = await getCategory('landscapes');
      
      expect(category).not.toBeNull();
      expect(category?.id).toBe('landscapes');
      expect(category?.name).toBe('Landscapes');
    });

    it('should return null for non-existent ID', async () => {
      const category = await getCategory('nonexistent');
      
      expect(category).toBeNull();
    });
  });
});
```

### Component Tests

Test React components with user interactions:

```typescript
// __tests__/components/ImageUpload.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '@/components/ImageUpload';

describe('ImageUpload', () => {
  it('should render dropzone', () => {
    render(<ImageUpload />);
    
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('should show active state when dragging', () => {
    render(<ImageUpload />);
    
    const dropzone = screen.getByRole('button');
    fireEvent.dragEnter(dropzone);
    
    expect(dropzone).toHaveClass('dropzone-active');
  });

  it('should call onUpload when files are dropped', async () => {
    const onUpload = jest.fn();
    render(<ImageUpload onUpload={onUpload} />);
    
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const dropzone = screen.getByRole('button');
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(onUpload).toHaveBeenCalledWith([file]);
  });
});
```

### API Route Tests

Test API endpoints:

```typescript
// __tests__/api/categories.test.ts
import { GET } from '@/app/api/categories/route';

describe('GET /api/categories', () => {
  it('should return categories list', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.categories).toBeInstanceOf(Array);
  });

  it('should include image counts', async () => {
    const response = await GET();
    const data = await response.json();
    
    data.data.categories.forEach((category: any) => {
      expect(category).toHaveProperty('imageCount');
      expect(typeof category.imageCount).toBe('number');
    });
  });
});
```

### Image Processing Tests

Test image processing functions:

```typescript
// __tests__/lib/processors/dither.test.ts
import sharp from 'sharp';
import { applyDithering, DITHERING_ALGORITHMS } from '@/lib/processors/dither';

describe('Dithering', () => {
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // Create a test image
    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('applyDithering', () => {
    it.each(DITHERING_ALGORITHMS)(
      'should apply %s algorithm',
      async (algorithm) => {
        const result = await applyDithering(testImageBuffer, algorithm);
        
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      }
    );

    it('should preserve image dimensions', async () => {
      const result = await applyDithering(testImageBuffer, 'floyd-steinberg');
      const metadata = await sharp(result).metadata();
      
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
    });
  });
});
```

## Mocking

### Mocking File System

```typescript
import { promises as fs } from 'fs';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
  },
}));

beforeEach(() => {
  (fs.readFile as jest.Mock).mockResolvedValue(
    JSON.stringify({ categories: [{ id: 'test', name: 'Test' }] })
  );
});
```

### Mocking Next.js

```typescript
// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));
```

## Test Utilities

### Custom Render Function

```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';

// Add providers if needed
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Test Image Helper

```typescript
// __tests__/utils/test-image.ts
import sharp from 'sharp';

export async function createTestImage(
  width: number,
  height: number,
  color = { r: 128, g: 128, b: 128 }
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();
}
```

## Coverage Requirements

Aim for these coverage targets:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

View coverage report:
```bash
npm run test:coverage
```

Coverage report is generated in `coverage/lcov-report/index.html`.

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

Ensure all tests pass before merging:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

## Best Practices

1. **Test behavior, not implementation**
2. **Keep tests focused and small**
3. **Use descriptive test names**
4. **Avoid testing external libraries**
5. **Mock external dependencies**
6. **Clean up after tests**
7. **Test edge cases and error conditions**






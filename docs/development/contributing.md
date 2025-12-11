# Contributing to InkyStream

Thank you for your interest in contributing to InkyStream! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- A code editor (VS Code recommended)

### Setup

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/inkystream.git
   cd inkystream
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

Fix any linting errors before submitting a pull request.

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define types for all function parameters and return values
- Use interfaces for object shapes

```typescript
// Good
interface ProcessingOptions {
  width: number;
  height: number;
  dithering: string;
}

export function processImage(
  input: Buffer,
  options: ProcessingOptions
): Promise<Buffer> {
  // ...
}

// Avoid
export function processImage(input: any, options: any) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use `'use client'` directive for client components
- Keep components focused and single-purpose

```tsx
'use client';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={variant === 'primary' ? 'ink-button' : 'ink-button-secondary'}
    >
      {children}
    </button>
  );
}
```

### File Organization

```
lib/
├── processors/     # Image processing algorithms
├── displays/       # Display profile management
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

components/         # React components
app/               # Next.js pages and API routes
config/            # Configuration files
docs/              # Documentation
__tests__/         # Test files
```

## Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(processing): add Atkinson dithering algorithm
fix(api): handle missing category parameter
docs(readme): add troubleshooting section
```

## Pull Request Process

### Before Submitting

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Update CHANGELOG.md if applicable

### Submitting

1. Push your branch to your fork
2. Open a Pull Request against `main`
3. Fill out the PR template
4. Link any related issues

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How to test these changes

## Screenshots (if applicable)

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linting passes
- [ ] Self-reviewed code
```

## Areas for Contribution

### Good First Issues

Look for issues labeled `good-first-issue` on GitHub.

### Feature Ideas

- New dithering algorithms
- Support for additional e-ink displays
- UI improvements
- Performance optimizations
- Documentation improvements

### Documentation

We always welcome documentation improvements:
- Fix typos and clarify explanations
- Add examples and screenshots
- Translate documentation
- Create tutorials

## Testing Guidelines

### Unit Tests

```typescript
// __tests__/lib/utils/categories.test.ts
import { getCategories, getCategory } from '@/lib/utils/categories';

describe('Category Utils', () => {
  describe('getCategories', () => {
    it('should return all categories', async () => {
      const categories = await getCategories();
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('getCategory', () => {
    it('should return a category by ID', async () => {
      const category = await getCategory('landscapes');
      expect(category).toBeDefined();
      expect(category?.id).toBe('landscapes');
    });

    it('should return null for unknown ID', async () => {
      const category = await getCategory('unknown');
      expect(category).toBeNull();
    });
  });
});
```

### Component Tests

```typescript
// __tests__/components/CategoryBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { CategoryBadge } from '@/components/CategoryBadge';

describe('CategoryBadge', () => {
  it('should render category name', () => {
    const category = {
      id: 'landscapes',
      name: 'Landscapes',
      description: 'Test',
      colour: '#228B22',
    };

    render(<CategoryBadge category={category} />);
    expect(screen.getByText('Landscapes')).toBeInTheDocument();
  });
});
```

## Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/inkystream/discussions)
- Check existing issues for similar questions
- Read the documentation in `/docs`

Thank you for contributing to InkyStream!





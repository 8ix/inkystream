# Category System

The category system organizes images into logical groups, making it easy to display themed collections on e-ink frames.

## Overview

Categories provide:
- **Organization**: Group related images together
- **Filtering**: Display specific categories on different frames
- **Visual Identity**: Each category has an associated color

## Configuration

Categories are defined in `config/categories.json`:

```json
{
  "categories": [
    {
      "id": "landscapes",
      "name": "Landscapes",
      "description": "Nature and scenic views",
      "colour": "#228B22"
    },
    {
      "id": "family",
      "name": "Family",
      "description": "Family photos and memories",
      "colour": "#FFB6C1"
    },
    {
      "id": "art",
      "name": "Art",
      "description": "Artistic and abstract images",
      "colour": "#9370DB"
    }
  ]
}
```

### Category Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (lowercase, no spaces) |
| `name` | string | Display name |
| `description` | string | Brief description |
| `colour` | string | Hex color code for UI |

## Storage Structure

Images are stored in category-specific directories:

```
public/images/
├── landscapes/
│   ├── img_001/
│   │   ├── inky_frame_7_spectra.png
│   │   ├── thumbnail.png
│   │   └── metadata.json
│   └── img_002/
│       └── ...
├── family/
│   └── ...
└── art/
    └── ...
```

## Code Implementation

### Type Definition

```typescript
// lib/types/category.ts
export interface Category {
  id: string;
  name: string;
  description: string;
  colour: string;
}
```

### Loading Categories

```typescript
// lib/utils/categories.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Category, CategoriesConfig } from '@/lib/types/category';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'categories.json');

export async function getCategories(): Promise<Category[]> {
  const content = await fs.readFile(CONFIG_PATH, 'utf-8');
  const config: CategoriesConfig = JSON.parse(content);
  return config.categories;
}

export async function getCategory(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find(cat => cat.id === id) || null;
}
```

### Getting Category Image Count

```typescript
export async function getCategoryImageCount(categoryId: string): Promise<number> {
  const imagesDir = path.join(process.cwd(), 'public', 'images', categoryId);
  
  try {
    const entries = await fs.readdir(imagesDir, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).length;
  } catch {
    return 0;
  }
}
```

## Usage in Admin Interface

### Category Selection Dropdown

```tsx
// components/CategorySelect.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@/lib/types/category';

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.data.categories));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ink-input"
    >
      <option value="">Select a category</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
```

### Category Badge Component

```tsx
// components/CategoryBadge.tsx
import type { Category } from '@/lib/types/category';

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span
      className="category-badge"
      style={{ backgroundColor: category.colour + '20', color: category.colour }}
    >
      {category.name}
    </span>
  );
}
```

## API Usage

### List Categories

```bash
GET /api/categories
```

Response includes image count for each category:

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "landscapes",
        "name": "Landscapes",
        "description": "Nature and scenic views",
        "colour": "#228B22",
        "imageCount": 15
      }
    ]
  }
}
```

### Filter by Category

```bash
GET /api/current?display=inky_frame_7_spectra&category=landscapes
```

## Adding New Categories

1. Edit `config/categories.json`:

```json
{
  "categories": [
    // ... existing categories
    {
      "id": "pets",
      "name": "Pets",
      "description": "Photos of beloved pets",
      "colour": "#FF6B35"
    }
  ]
}
```

2. The new category will immediately be available in:
   - Upload interface category dropdown
   - Gallery filter
   - API category list

3. Commit and push to deploy:

```bash
git add config/categories.json
git commit -m "Added pets category"
git push
```

## Best Practices

### Category IDs

- Use lowercase
- Use hyphens for multi-word IDs: `nature-photos`
- Keep IDs short but descriptive
- IDs cannot be changed after images are uploaded

### Category Colors

- Choose distinct colors for easy identification
- Consider color blindness accessibility
- Use hex format: `#RRGGBB`
- Test colors in both light and dark UI contexts

### Organization Tips

- Start with 3-5 categories
- Add more as your collection grows
- Consider your e-ink frame placement when naming categories
- Categories can represent themes, locations, or time periods





'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryManager from '@/components/CategoryManager';
import type { Category } from '@/lib/types/category';

interface CategoryWithCount extends Category {
  imageCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <p className="text-white/60">Manage your image categories</p>
      </div>
      <CategoryManager categories={categories} onCategoryChange={loadCategories} />
    </div>
  );
}

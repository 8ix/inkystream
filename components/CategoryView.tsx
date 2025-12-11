'use client';

/**
 * Component for viewing images within a specific category
 * This will be expanded in the gallery-management task
 */

interface CategoryViewProps {
  categoryId: string;
}

export default function CategoryView({ categoryId }: CategoryViewProps) {
  return (
    <div>
      <p>Category view for {categoryId} coming soon...</p>
    </div>
  );
}





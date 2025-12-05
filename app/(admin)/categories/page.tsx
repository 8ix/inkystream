import { getCategoriesWithCounts } from '@/lib/utils/categories';
import CategoryManager from '@/components/CategoryManager';
import { Palette } from 'lucide-react';

/**
 * Category management page
 * Allows users to create, edit, and delete categories
 */
export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f97316] glow-gold">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
        </div>
        <p className="text-white/60">
          Organize your images into categories for easy browsing and management.
        </p>
      </div>

      {/* Category Manager Component */}
      <CategoryManager categories={categories} />
    </div>
  );
}


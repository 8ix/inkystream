'use client';

import type { Category } from '@/lib/types/category';

interface CategoryFilterProps {
  categories: Category[];
  categoryCounts: Record<string, number>;
  hiddenCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export default function CategoryFilter({
  categories,
  categoryCounts,
  hiddenCategories,
  onToggleCategory,
  onShowAll,
  onHideAll,
}: CategoryFilterProps) {
  const hasCategories = categories.length > 0;
  const anyHidden = hiddenCategories.size > 0;
  const allHidden = hasCategories && hiddenCategories.size === categories.length;
  const allVisible = !anyHidden;

  const handleAllClick = () => {
    if (allVisible) {
      onHideAll();
    } else {
      onShowAll();
    }
  };

  return (
    <div className="ink-card p-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleAllClick}
        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
          allVisible
            ? 'bg-white/20 text-white border-white/40'
            : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60'
        }`}
        aria-pressed={allVisible && !allHidden}
      >
        All
      </button>

      {categories.map((category) => {
        const isHidden = hiddenCategories.has(category.id);
        const isActive = !isHidden;
        const count = categoryCounts[category.id] ?? 0;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggleCategory(category.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              isActive
                ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                : 'bg-black/40 text-white/50 border-white/10 hover:bg-black/60'
            }`}
            aria-pressed={isActive}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category.colour }}
            />
            <span>{category.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-white/70">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}


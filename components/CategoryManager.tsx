'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types/category';
import { Palette, Plus, Pencil, Trash2, X, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

interface CategoryWithCount extends Category {
  imageCount: number;
}

interface CategoryManagerProps {
  categories: CategoryWithCount[];
}

/**
 * Category Manager component for creating, editing, and deleting categories
 */
export default function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColour, setNewColour] = useState('#FF5733');

  // Form state for editing
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColour, setEditColour] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
          colour: newColour,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewName('');
        setNewDescription('');
        setNewColour('#FF5733');
        setIsCreating(false);
        router.refresh();
      } else {
        setError(data.error || 'Failed to create category');
      }
    } catch {
      setError('An error occurred while creating the category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (category: CategoryWithCount) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description);
    setEditColour(category.colour);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditColour('');
    setError(null);
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          colour: editColour,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(data.error || 'Failed to update category');
      }
    } catch {
      setError('An error occurred while updating the category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string, imageCount: number) => {
    if (imageCount > 0) {
      setError(`Cannot delete "${categoryName}": it contains ${imageCount} image(s). Please delete them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}"? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.refresh();
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } catch {
      setError('An error occurred while deleting the category');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset colors for quick selection
  const presetColors = [
    '#FF5733', '#FF47B3', '#A855F7', '#3B82F6', 
    '#22D3EE', '#10B981', '#84CC16', '#FBBF24',
    '#F97316', '#EF4444', '#6366F1', '#8B5CF6',
  ];

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
          <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Category List Card */}
      <div className="ink-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#fbbf24]" />
            <h2 className="text-xl font-bold text-white">Your Categories</h2>
          </div>
          {!isCreating && (
            <button
              onClick={() => {
                setIsCreating(true);
                setError(null);
              }}
              className="ink-button flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>

        {/* Create New Category Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 p-5 rounded-xl bg-black/20 border border-white/10">
            <h3 className="font-bold text-white mb-4">New Category</h3>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newName" className="ink-label">
                    Category Name
                  </label>
                  <input
                    id="newName"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Nature"
                    className="ink-input"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="newColour" className="ink-label">
                    Colour
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="newColour"
                      type="color"
                      value={newColour}
                      onChange={(e) => setNewColour(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-mono text-white/50">{newColour}</span>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="newDescription" className="ink-label">
                  Description
                </label>
                <input
                  id="newDescription"
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Beautiful landscapes and nature photography"
                  className="ink-input"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="ink-label">Quick Colors</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColour(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                        newColour === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="ink-button flex items-center gap-2"
                disabled={isLoading || !newName.trim()}
              >
                <Check className="w-4 h-4" />
                Create Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                  setNewDescription('');
                  setNewColour('#FF5733');
                  setError(null);
                }}
                className="ink-button-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Empty State */}
        {categories.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-[#fbbf24]/20 to-[#f97316]/20 border border-white/10">
              <Palette className="w-10 h-10 text-[#fbbf24]/50" />
            </div>
            <p className="text-xl font-bold text-white mb-2">No categories yet</p>
            <p className="text-white/50 mb-6 max-w-sm mx-auto">
              Create a category to start organizing your images.
            </p>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="ink-button inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Category
              </button>
            )}
          </div>
        ) : (
          /* Category List */
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                  editingId === category.id
                    ? 'bg-[#fbbf24]/10 border border-[#fbbf24]/30'
                    : 'bg-black/20 border border-white/10 hover:border-white/20'
                }`}
              >
                {editingId === category.id ? (
                  /* Editing Mode */
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="ink-input flex-1 w-full sm:max-w-xs"
                        placeholder="Category name"
                        disabled={isLoading}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColour}
                          onChange={(e) => setEditColour(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="ink-input w-full"
                      placeholder="Description"
                      disabled={isLoading}
                    />
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColour(color)}
                          className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                            editColour === color ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSaveEdit(category.id)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        disabled={isLoading || !editName.trim()}
                        title="Save"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                        disabled={isLoading}
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ 
                          backgroundColor: category.colour,
                          boxShadow: `0 4px 20px ${category.colour}40`
                        }}
                      >
                        <Palette className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{category.name}</p>
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full">
                            <ImageIcon className="w-3 h-3 text-white/50" />
                            <span className="text-xs text-white/50">{category.imageCount}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/50">{category.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="p-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        disabled={isLoading}
                        title="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name, category.imageCount)}
                        className={`p-2.5 rounded-lg transition-colors ${
                          category.imageCount > 0
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400'
                        }`}
                        disabled={isLoading || category.imageCount > 0}
                        title={category.imageCount > 0 ? 'Cannot delete: category has images' : 'Delete category'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="ink-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          bg-gradient-to-br from-[#fbbf24]/20 to-[#f97316]/20">
            <Palette className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">About Categories</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Categories help you organize your images for easy browsing. When uploading images, 
              you&apos;ll select which category they belong to. Categories with images cannot be deleted 
              — you&apos;ll need to remove the images first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


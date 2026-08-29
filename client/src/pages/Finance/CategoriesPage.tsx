import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Archive, Edit3, Save, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseCategoriesApi } from '../../api/finance';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import type { ExpenseCategory } from '../../types';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#71717a',
];

const PRESET_ICONS = [
  '🍔', '🛒', '⛽', '🚗', '🛍️', '👕', '📋', '🏠', '🎬', '🏥',
  '📚', '📱', '✈️', '👤', '📦', '💼', '💻', '🏢', '🎁', '📈',
  '🎀', '↩️', '💰', '🎵', '🚴', '☕', '🎯', '💊', '🌱', '🎨',
];

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  description?: string;
}

interface CategoryFormProps {
  initial?: Partial<CategoryFormData>;
  onSave: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function CategoryForm({ initial, onSave, onCancel, isLoading }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '📦');
  const [color, setColor] = useState(initial?.color ?? '#6366f1');
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? 'expense');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <div className="space-y-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
      {/* Type toggle */}
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all
              ${type === t
                ? t === 'expense'
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                  : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                : 'border border-surface-200 dark:border-surface-700 text-surface-500'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-surface-500 mb-1">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Category name"
          id="category-name-input"
        />
      </div>

      {/* Icon picker */}
      <div>
        <label className="block text-xs font-semibold text-surface-500 mb-2">Icon</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all
                ${icon === ic ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-200 dark:hover:bg-surface-700'}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-semibold text-surface-500 mb-2">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-surface-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
            title="Custom color"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-surface-500 mb-1">Description (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          placeholder="Brief description"
        />
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-custom">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </span>
        <div>
          <p className="font-semibold text-surface-900 dark:text-surface-50">{name || 'Preview'}</p>
          <p className="text-xs text-surface-400 capitalize">{type}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button
          type="button"
          disabled={!name.trim() || isLoading}
          onClick={() => onSave({ name, icon, color, type, description: description || undefined })}
          className="btn-primary flex-1 justify-center"
          id="category-save-btn"
        >
          <Save size={14} />
          {isLoading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<'expense' | 'income'>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<ExpenseCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories', typeFilter],
    queryFn: () => expenseCategoriesApi.getAll({ type: typeFilter }),
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: expenseCategoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setShowForm(false);
      toast.success('Category created!');
    },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      expenseCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setEditCat(null);
      toast.success('Category updated!');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: expenseCategoriesApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Category archived');
    },
  });

  return (
    <div className="space-y-4">
      <FinanceSubNav />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-primary-500" />
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Categories</h2>
        </div>
        {!showForm && !editCat && (
          <button onClick={() => setShowForm(true)} className="btn-primary" id="add-category-btn">
            <Plus size={15} /> New Category
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all
              ${typeFilter === t
                ? t === 'expense'
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
              }`}
            id={`categories-tab-${t}`}
          >
            {t === 'expense' ? '↓ Expense' : '↑ Income'}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CategoryForm
              initial={{ type: typeFilter }}
              onSave={(data) => createMutation.mutateAsync(data as any).then(() => {}) as Promise<void>}
              onCancel={() => setShowForm(false)}
              isLoading={createMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat._id}>
              <AnimatePresence>
                {editCat?._id === cat._id ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CategoryForm
                      initial={cat}
                      onSave={(data) => updateMutation.mutateAsync({ id: cat._id, data }).then(() => {}) as Promise<void>}
                      onCancel={() => setEditCat(null)}
                      isLoading={updateMutation.isPending}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 card hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">
                        {cat.name}
                        {cat.isDefault && (
                          <span className="ml-2 badge bg-surface-100 dark:bg-surface-800 text-surface-400 text-[10px]">default</span>
                        )}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-surface-400 truncate">{cat.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditCat(cat)}
                        className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700"
                        id={`edit-cat-${cat.name.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <Edit3 size={13} />
                      </button>
                      {!cat.isDefault && (
                        <button
                          onClick={() => {
                            if (confirm(`Archive "${cat.name}"? Existing transactions won't be affected.`)) {
                              archiveMutation.mutate(cat._id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-surface-400 hover:text-amber-500"
                        >
                          <Archive size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="font-semibold text-surface-700 dark:text-surface-300">No {typeFilter} categories</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-3">
                <Plus size={15} /> Add Category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import type { ExpenseCategory } from '../../types';

interface CategoryBadgeProps {
  category: ExpenseCategory | { name: string; icon: string; color: string } | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function CategoryBadge({ category, size = 'md', showLabel = true }: CategoryBadgeProps) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1 text-surface-400 text-xs">
        <span>📦</span>
        {showLabel && <span>Uncategorized</span>}
      </span>
    );
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shrink-0`}
        style={{ backgroundColor: `${category.color}20` }}
        title={category.name}
      >
        {category.icon}
      </span>
      {showLabel && (
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
          {category.name}
        </span>
      )}
    </span>
  );
}

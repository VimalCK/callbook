import { SearchX } from 'lucide-react';
import type { Category } from '../types/provider';
import './EmptyState.css';

interface EmptyStateProps {
  query: string;
  categories: Category[];
  onCategorySelect: (id: string) => void;
  onClear: () => void;
}

export function EmptyState({ query, categories, onCategorySelect, onClear }: EmptyStateProps) {
  return (
    <div className="empty" role="status">
      <div className="empty-visual">
        <SearchX size={28} strokeWidth={1.5} />
      </div>
      <h3 className="empty-heading">No providers found</h3>
      <p className="empty-body">
        We couldn't find anyone matching "{query}". Try a different term or browse by category.
      </p>
      <button className="empty-action" onClick={onClear}>Clear filters</button>
      <div className="empty-cats">
        {categories.slice(0, 4).map(cat => (
          <button key={cat.id} className="empty-cat-btn" onClick={() => onCategorySelect(cat.id)}>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}

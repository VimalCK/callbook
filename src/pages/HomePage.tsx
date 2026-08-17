import { useState, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProviderCard } from '../components/ProviderCard';
import { EmptyState } from '../components/EmptyState';
import { searchProviders } from '../utils/search';
import { addRecentSearch, getRecentSearches, clearRecentSearches } from '../utils/storage';
import type { Provider, Category } from '../types/provider';
import './HomePage.css';

interface HomePageProps {
  providers: Provider[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
  onViewProvider: (provider: Provider) => void;
}

export function HomePage({ providers, categories, isLoading, error, onRefetch, onViewProvider }: HomePageProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const recentSearches = getRecentSearches();

  const results = useMemo(() => {
    let filtered = providers;
    if (activeCategory) {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (query.trim()) {
      filtered = searchProviders(filtered, query);
    }
    return filtered;
  }, [query, activeCategory, providers]);

  const isFiltering = query.trim() || activeCategory;

  const handleSearch = () => {
    if (query.trim()) addRecentSearch(query.trim());
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(prev => (prev === categoryId ? null : categoryId));
  };

  const handleClearAll = () => {
    setQuery('');
    setActiveCategory(null);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="page home">
      {/* Sticky top: search + categories */}
      <div className="home-sticky">
        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
            <button className="error-retry" onClick={onRefetch}><RefreshCw size={12} /></button>
          </div>
        )}

        {/* Search */}
        <SearchBar value={query} onChange={handleQueryChange} onSubmit={handleSearch} />

        {/* Category chips */}
        <CategoryGrid categories={categories} activeCategory={activeCategory} onSelect={handleCategorySelect} />

        {/* Recent searches */}
        {!isFiltering && recentSearches.length > 0 && (
          <div className="recent-block">
            <div className="recent-header">
              <span className="recent-label">Recent searches</span>
              <button className="recent-clear" onClick={clearRecentSearches}>Clear</button>
            </div>
            <div className="recent-list">
              {recentSearches.map(term => (
                <button key={term} className="recent-item" onClick={() => handleRecentClick(term)}>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results bar when filtering */}
        {isFiltering && (
          <div className="results-bar">
            <span className="results-text">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            <button className="results-clear" onClick={handleClearAll}>Clear filters</button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="home-scroll">
        {/* Loading skeleton */}
        {isLoading && providers.length === 0 && (
          <div className="skeleton-list">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-card" aria-hidden="true">
                <div className="skeleton-avatar" />
                <div className="skeleton-lines">
                  <div className="skeleton-line skeleton-line-title" />
                  <div className="skeleton-line skeleton-line-text" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Provider list */}
        {!isLoading || providers.length > 0 ? (
          <section aria-label={isFiltering ? 'Search results' : 'All providers'}>
            {results.length > 0 ? (
              <div className="provider-feed" role="list">
                {results.map(provider => (
                  <ProviderCard key={provider.id} provider={provider} onViewDetails={onViewProvider} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <EmptyState
                  query={query || activeCategory || ''}
                  categories={categories}
                  onCategorySelect={handleCategorySelect}
                  onClear={handleClearAll}
                />
              )
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

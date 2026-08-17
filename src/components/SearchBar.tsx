import { Search, ArrowLeft, X } from 'lucide-react';
import { useRef, useEffect } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) onSubmit();
  };

  return (
    <div className="search-container" role="search">
      <div className="search-field">
        <Search className="search-icon" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder={placeholder || 'Search services or providers'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search for a service or provider"
        />
        {value && (
          <button className="search-clear" onClick={handleClear} aria-label="Clear search" type="button">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/* Overlay search variant used by full-screen search */
interface SearchOverlayProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit?: () => void;
}

export function SearchOverlay({ value, onChange, onClose, onSubmit }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) onSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="search-overlay" role="search">
      <div className="search-overlay-bar">
        <button className="search-back-btn" onClick={onClose} aria-label="Close search">
          <ArrowLeft size={22} />
        </button>
        <input
          ref={inputRef}
          type="search"
          className="search-overlay-input"
          placeholder="Search services or providers..."
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />
        {value && (
          <button className="search-clear" onClick={() => onChange('')} aria-label="Clear" type="button">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

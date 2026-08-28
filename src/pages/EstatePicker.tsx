import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, PlusCircle, Search } from 'lucide-react';
import './EstatePicker.css';

interface Estate {
  id: number;
  slug: string;
  name: string;
  description: string;
}

interface EstatePickerProps {
  onSelect: (slug: string) => void;
  onSuggest?: () => void;
}

export function EstatePicker({ onSelect, onSuggest }: EstatePickerProps) {
  const [estates, setEstates] = useState<Estate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadEstates = () => {
    setIsLoading(true);
    setError(false);
    fetch('/api/estates?status=available')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setEstates(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadEstates();
  }, []);

  const hasManyEstates = estates.length > 4;
  const filteredEstates = hasManyEstates && searchTerm.trim()
    ? estates.filter(estate => `${estate.name} ${estate.description}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : estates;

  return (
    <div className={`estate-picker ${hasManyEstates ? 'estate-picker-scroll-mode' : ''}`}>
      <div className="estate-picker-header">
        <div className="estate-picker-icon">
          <MapPin size={28} />
        </div>
        <h1>Welcome to Estate Contacts</h1>
        <p>Select your community to see local service contacts</p>
      </div>

      {isLoading && (
        <div className="estate-loading">Loading communities...</div>
      )}

      {error && (
        <div className="estate-error">
          <p>Could not load communities. Make sure the server is running.</p>
          <button onClick={loadEstates}>Try again</button>
        </div>
      )}

      {!isLoading && !error && estates.length > 0 && (
        <>
          {hasManyEstates && (
            <div className="estate-search-section">
              <div className="estate-search-box">
                <Search size={17} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search estate or location"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className={`estate-list ${hasManyEstates ? 'estate-list-scrollable' : ''}`}>
          {filteredEstates.map(estate => (
            <button
              key={estate.id}
              className="estate-card"
              onClick={() => onSelect(estate.slug)}
            >
              <div className="estate-card-avatar">
                {estate.name.charAt(0)}
              </div>
              <div className="estate-card-info">
                <div className="estate-card-name">{estate.name}</div>
                {estate.description && (
                  <div className="estate-card-desc">
                    {estate.description.split(',').map(part => part.trim()).filter(Boolean).map(part => (
                      <span key={part}>{part}</span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="estate-card-arrow" />
            </button>
          ))}
          {filteredEstates.length === 0 && (
            <div className="estate-no-results">
              <p>No estate found</p>
              <span>Try another estate or suggest a new one.</span>
            </div>
          )}
        </div>
          {onSuggest && (
            <div className="estate-suggest-dock">
              <button className="estate-card estate-card-suggest" onClick={onSuggest}>
                <div className="estate-card-avatar estate-card-avatar-suggest">
                  <PlusCircle size={20} />
                </div>
                <div className="estate-card-info">
                  <div className="estate-card-name">Can't find your estate?</div>
                  <div className="estate-card-desc">
                    <span>Suggest a contact for a new estate or location</span>
                  </div>
                </div>
                <ChevronRight size={18} className="estate-card-arrow" />
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && !error && estates.length === 0 && (
        <div className="estate-empty">
          <p>No communities yet</p>
          <span>Be the first to suggest a local service contact for your community.</span>
          {onSuggest && (
            <button className="estate-suggest-btn" onClick={onSuggest}>
              <PlusCircle size={18} />
              Suggest a contact
            </button>
          )}
        </div>
      )}
    </div>
  );
}

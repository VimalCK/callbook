import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, PlusCircle } from 'lucide-react';
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

  const loadEstates = () => {
    setIsLoading(true);
    setError(false);
    fetch('/api/estates')
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

  return (
    <div className="estate-picker">
      <div className="estate-picker-header">
        <div className="estate-picker-icon">
          <MapPin size={28} />
        </div>
        <h1>Welcome to Callbook</h1>
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
        <div className="estate-list">
          {estates.map(estate => (
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
          {onSuggest && (
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
          )}
        </div>
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

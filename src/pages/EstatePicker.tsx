import { useState, useEffect } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import './EstatePicker.css';

interface Estate {
  id: number;
  slug: string;
  name: string;
  description: string;
}

interface EstatePickerProps {
  onSelect: (slug: string) => void;
}

export function EstatePicker({ onSelect }: EstatePickerProps) {
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

      {!isLoading && !error && (
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
                  <div className="estate-card-desc">{estate.description}</div>
                )}
              </div>
              <ChevronRight size={18} className="estate-card-arrow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

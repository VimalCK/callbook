import { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, ChevronDown } from 'lucide-react';
import './SuggestPage.css';

interface CategoryItem {
  id: string;
  name: string;
}

interface Estate {
  id: number;
  slug: string;
  name: string;
}

interface SuggestPageProps {
  estate: string;
}

/* Custom category dropdown */
function CategoryDropdown({ value, onChange, categories }: { value: string; onChange: (val: string) => void; categories: CategoryItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectedName = categories.find(c => c.id === value)?.name || 'Select';

  return (
    <div className="combobox-wrap" ref={ref}>
      <button type="button" className="combobox-trigger" onClick={() => setOpen(!open)}>
        <span>{selectedName}</span>
        <ChevronDown size={16} className={`combobox-arrow-btn ${open ? 'rotated' : ''}`} />
      </button>
      {open && (
        <div className="combobox-dropdown">
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              className={`combobox-option ${c.id === value ? 'active' : ''}`}
              onClick={() => { onChange(c.id); setOpen(false); }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SuggestPage({ estate }: SuggestPageProps) {
  const [form, setForm] = useState({ name: '', phone: '', category: '', service_area: '', note: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Estate combobox state
  const [estates, setEstates] = useState<Estate[]>([]);
  const [estateInput, setEstateInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEstateSlug, setSelectedEstateSlug] = useState(estate);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then((data: CategoryItem[]) => {
        setCategories(data);
        if (data.length > 0 && !form.category) {
          setForm(prev => ({ ...prev, category: data[0].id }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/estates')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setEstates(data);
        // Set initial display name from current estate
        const current = data.find((e: Estate) => e.slug === estate);
        if (current) setEstateInput(current.name);
      })
      .catch(() => {});
  }, [estate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredEstates = estates.filter(e =>
    e.name.toLowerCase().includes(estateInput.toLowerCase())
  );

  const isNewEstate = estateInput.trim() && !estates.some(
    e => e.name.toLowerCase() === estateInput.trim().toLowerCase()
  );

  const handleEstateSelect = (e: Estate) => {
    setEstateInput(e.name);
    setSelectedEstateSlug(e.slug);
    setShowDropdown(false);
  };

  const handleEstateInputChange = (value: string) => {
    setEstateInput(value);
    setShowDropdown(true);
    // If typing something new, clear the slug (will be created on submit)
    const match = estates.find(e => e.name.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setSelectedEstateSlug(match.slug);
    } else {
      setSelectedEstateSlug('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!estateInput.trim()) {
      setError('Please select or enter a community name.');
      return;
    }

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estate: estateInput.trim() }),
      });

      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', phone: '', category: categories[0]?.id || '', service_area: '', note: '' });
      } else {
        setError('Could not submit. Please try again.');
      }
    } catch {
      setError('No connection to server. Please try later.');
    }
  };

  if (submitted) {
    return (
      <div className="suggest-page">
        <div className="suggest-success">
          <div className="suggest-success-icon">
            <CheckCircle size={32} />
          </div>
          <h2>Thank you!</h2>
          <p>Your suggestion has been submitted. An admin will review and add it to the directory.</p>
          <button className="suggest-again-btn" onClick={() => setSubmitted(false)}>
            Suggest another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-page">
      <div className="suggest-header">
        <h2>Suggest a contact</h2>
        <p>Know a reliable local service provider? Share their details and help the community.</p>
      </div>

      <form className="suggest-form" onSubmit={handleSubmit}>
        {/* Estate combobox */}
        <div className="suggest-field" ref={comboRef}>
          <label htmlFor="s-estate">Community / Estate <span className="req">*</span></label>
          <div className="combobox-wrap">
            <input
              id="s-estate"
              type="text"
              className="combobox-input"
              value={estateInput}
              onChange={e => handleEstateInputChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type or select a community"
              autoComplete="off"
            />
            <ChevronDown size={16} className="combobox-arrow" />
            {showDropdown && (
              <div className="combobox-dropdown">
                {filteredEstates.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    className={`combobox-option ${e.slug === selectedEstateSlug ? 'active' : ''}`}
                    onClick={() => handleEstateSelect(e)}
                  >
                    {e.name}
                  </button>
                ))}
                {isNewEstate && (
                  <div className="combobox-new">
                    <span>Create new:</span> <strong>{estateInput.trim()}</strong>
                  </div>
                )}
                {filteredEstates.length === 0 && !isNewEstate && (
                  <div className="combobox-empty">No communities found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="suggest-field">
          <label htmlFor="s-name">Name or business name <span className="req">*</span></label>
          <input id="s-name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Ramesh Plumbing" />
        </div>

        <div className="suggest-field">
          <label htmlFor="s-phone">Phone number <span className="req">*</span></label>
          <input id="s-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
        </div>

        <div className="suggest-field">
          <label>Service category <span className="req">*</span></label>
          <CategoryDropdown
            value={form.category}
            onChange={(val) => setForm(prev => ({ ...prev, category: val }))}
            categories={categories}
          />
        </div>

        <div className="suggest-field">
          <label htmlFor="s-area">Service area</label>
          <input id="s-area" name="service_area" value={form.service_area} onChange={handleChange} placeholder="e.g. Sector 15, All Sectors" />
        </div>

        <div className="suggest-field">
          <label htmlFor="s-note">Additional notes</label>
          <textarea id="s-note" name="note" value={form.note} onChange={handleChange} rows={3} placeholder="Anything useful — specialty, timing, experience..." />
        </div>

        {error && <p className="suggest-error">{error}</p>}

        <button type="submit" className="suggest-submit-btn">
          <Send size={16} />
          Submit suggestion
        </button>
      </form>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, ChevronDown } from 'lucide-react';
import { addSubmittedSuggestionId } from '../utils/storage';
import './SuggestPage.css';

interface CategoryItem {
  id: string;
  name: string;
}

interface Estate {
  id: number;
  slug: string;
  name: string;
  description: string;
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
  const [website, setWebsite] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Estate textbox state
  const [estateInput, setEstateInput] = useState('');

  const formatEstate = (e: Estate) => [e.name, e.description].filter(Boolean).join(', ');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then((data: CategoryItem[]) => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(sorted);
        if (sorted.length > 0 && !form.category) {
          setForm(prev => ({ ...prev, category: sorted[0].id }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!estate) {
      setEstateInput('');
      return;
    }

    fetch(`/api/estates/${estate}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: Estate | null) => {
        if (data) setEstateInput(formatEstate(data));
      })
      .catch(() => {
        setEstateInput(estate);
      });
  }, [estate]);

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
        body: JSON.stringify({ ...form, estate: estateInput.trim(), website }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Number.isInteger(data.id)) addSubmittedSuggestionId(data.id);
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
        <p>{estate ? 'Know a reliable local service provider? Share their details and help the community.' : 'If your estate is not listed, enter the estate and location below, then add a local service contact.'}</p>
      </div>

      <form className="suggest-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="website"
          className="suggest-honeypot"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="suggest-field">
          <label htmlFor="s-estate">Estate, location <span className="req">*</span></label>
          <input
            id="s-estate"
            name="estate"
            type="text"
            className="suggest-estate-input"
            value={estateInput}
            onChange={e => setEstateInput(e.target.value)}
            placeholder="e.g. Ballymakenny Park, Drogheda"
            autoComplete="off"
            disabled={Boolean(estate)}
            required
          />
        </div>

        <div className="suggest-field-row">
          <div className="suggest-field">
            <label htmlFor="s-name">Name or business name <span className="req">*</span></label>
              <input id="s-name" name="name" value={form.name} onChange={handleChange} required placeholder="John's Plumbing" />
          </div>

          <div className="suggest-field">
            <label htmlFor="s-phone">Phone number <span className="req">*</span></label>
            <input id="s-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="+353 87 123 4567" />
          </div>
        </div>

        <div className="suggest-field-row">
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
            <input id="s-area" name="service_area" value={form.service_area} onChange={handleChange} placeholder="e.g. Drogheda" />
          </div>
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

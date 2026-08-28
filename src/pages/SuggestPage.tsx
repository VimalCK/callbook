import { useState, useEffect, useRef } from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
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
  onSubmitted?: (estateSlug: string) => void;
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
      <button type="button" className="combobox-trigger" onClick={() => setOpen(!open)} aria-label="Service category">
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

export function SuggestPage({ estate, onSubmitted }: SuggestPageProps) {
  const [form, setForm] = useState({
    name: '',
    business_name: '',
    phone: '',
    whatsapp: '',
    category: '',
    service_area: '',
    working_hours: '',
    note: '',
    services: '',
    is_verified: false,
  });
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
          setForm(prev => ({ ...prev, category: sorted[0].id, services: sorted[0].description || '' }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (categoryId: string) => {
    const selected = categories.find(c => c.id === categoryId);
    setForm(prev => ({ ...prev, category: categoryId, services: selected?.description || '' }));
  };

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
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
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
        if (data.estate?.slug) {
          onSubmitted?.(data.estate.slug);
          return;
        }
        setSubmitted(true);
        setForm({ name: '', business_name: '', phone: '', whatsapp: '', category: categories[0]?.id || '', service_area: '', working_hours: '', note: '', services: '', is_verified: false });
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Could not submit. Please try again.');
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
      <p className="suggest-intro">
        {estate ? 'Know a reliable local service provider? Share their details and help the community.' : 'If your estate is not listed, enter the estate and location below, then add a local service contact.'}
      </p>

      <form id="suggest-form" className="suggest-form" onSubmit={handleSubmit}>
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
          <input
            id="s-estate"
            name="estate"
            type="text"
            className="suggest-estate-input"
            value={estateInput}
            onChange={e => setEstateInput(e.target.value)}
            placeholder="Estate, location *"
            aria-label="Estate, location"
            autoComplete="off"
            disabled={Boolean(estate)}
            required
          />
        </div>

        <div className="suggest-field-row">
          <div className="suggest-field">
              <input id="s-name" name="name" value={form.name} onChange={handleChange} required placeholder="Person name *" aria-label="Person name" />
          </div>

          <div className="suggest-field">
            <input id="s-business" name="business_name" value={form.business_name} onChange={handleChange} placeholder="Business name" aria-label="Business name" />
          </div>
        </div>

        <div className="suggest-field-row">
          <div className="suggest-field">
            <input id="s-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="Phone number *" aria-label="Phone number" />
          </div>

          <div className="suggest-field">
            <input id="s-whatsapp" name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp number" aria-label="WhatsApp number" />
          </div>
        </div>

        <div className="suggest-field-row">
          <div className="suggest-field">
            <CategoryDropdown
              value={form.category}
              onChange={handleCategoryChange}
              categories={categories}
            />
          </div>

          <div className="suggest-field">
            <input id="s-area" name="service_area" value={form.service_area} onChange={handleChange} placeholder="Service area" aria-label="Service area" />
          </div>
        </div>

        <div className="suggest-field">
          <input id="s-hours" name="working_hours" value={form.working_hours} onChange={handleChange} placeholder="Working hours" aria-label="Working hours" />
        </div>

        <div className="suggest-field">
          <textarea id="s-note" name="note" value={form.note} onChange={handleChange} rows={3} placeholder="Additional notes" aria-label="Additional notes" />
        </div>

        <div className="suggest-field">
          <input id="s-services" name="services" value={form.services} onChange={handleChange} placeholder="Services" aria-label="Services" />
        </div>

        <div className="suggest-field">
          <label className="suggest-checkbox">
            <input type="checkbox" name="is_verified" checked={form.is_verified} onChange={handleChange} />
            <span>Verified service provider</span>
          </label>
        </div>

        {error && <p className="suggest-error">{error}</p>}

      </form>
    </div>
  );
}

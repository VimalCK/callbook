import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Check, X, Lock, Users, Inbox, Phone, MapPin, BadgeCheck, ChevronDown, Clock, MessageSquare, Home, Tag, Star, BarChart3, Eye, Search } from 'lucide-react';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { getInitials } from '../utils/initials';
import './AdminPage.css';

interface ProviderRow {
  id: number;
  estate_id: number;
  estate_name?: string;
  name: string;
  business_name: string | null;
  category: string;
  description: string;
  phone: string;
  whatsapp: string | null;
  service_area: string | null;
  working_hours: string | null;
  is_verified: boolean;
  services: string[];
  status: string;
}

interface FeedbackRow {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface SuggestionRow {
  id: number;
  name: string;
  business_name: string | null;
  phone: string;
  whatsapp: string | null;
  category: string;
  service_area: string | null;
  working_hours: string | null;
  services?: string | string[] | null;
  note: string | null;
  estate_name: string | null;
  metadata: string | null;
  status: string;
  submitted_at: string;
  suggested_edits?: Record<string, string | boolean>;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  provider_count?: number;
}

interface EstateAnalyticsRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  visit_count: number;
  last_visited_at: string | null;
}

interface ProviderAnalyticsRow {
  id: number;
  name: string;
  business_name: string | null;
  category: string;
  estate_id: number;
  estate_name: string;
  open_count: number;
  last_opened_at: string | null;
}

interface SearchAnalyticsRow {
  search_term: string;
  estate_id: number;
  estate_name: string;
  search_count: number;
  last_searched_at: string | null;
}

interface AnalyticsData {
  totals: {
    estate_visits: number;
    provider_opens: number;
    searches: number;
  };
  estate_visits: EstateAnalyticsRow[];
  top_providers: ProviderAnalyticsRow[];
  top_searches: SearchAnalyticsRow[];
}

const EMPTY_ANALYTICS: AnalyticsData = {
  totals: {
    estate_visits: 0,
    provider_opens: 0,
    searches: 0,
  },
  estate_visits: [],
  top_providers: [],
  top_searches: [],
};

const EMPTY_FORM = {
  name: '',
  business_name: '',
  category: 'plumber',
  description: '',
  phone: '',
  whatsapp: '',
  service_area: '',
  working_hours: '',
  is_verified: false,
  is_disabled: false,
  services: '',
  estate_name: '',
};

type FormData = typeof EMPTY_FORM;

const formatServicesText = (value: string | string[] | boolean | null | undefined) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean).join(', ');
  } catch {
    // Already plain text.
  }

  return trimmed;
};

/* Shared edit form used by both providers and suggestions */
function EditForm({ form, onChange, onSubmit, onCancel, submitLabel, categories, placeholderLabels = false, showDisabledOption = false }: {
  form: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  categories: CategoryRow[];
  placeholderLabels?: boolean;
  showDisabledOption?: boolean;
}) {
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [catOpen]);

  const handleCategorySelect = (id: string) => {
    const syntheticEvent = { target: { name: 'category', value: id, type: 'select-one' } } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
    setCatOpen(false);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <div className="admin-field">
          {!placeholderLabels && <label>Person name <span className="req">*</span></label>}
          <input className="form-control" name="name" value={form.name} onChange={onChange} required placeholder={placeholderLabels ? 'Person name *' : 'e.g. John Murphy'} aria-label="Person name" />
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>Business name</label>}
          <input className="form-control" name="business_name" value={form.business_name} onChange={onChange} placeholder={placeholderLabels ? 'Business name' : 'e.g. Murphy Plumbing'} aria-label="Business name" />
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>Category <span className="req">*</span></label>}
          <div className="admin-custom-select" ref={catRef}>
            <button type="button" className="admin-select-trigger form-select-trigger" onClick={() => setCatOpen(!catOpen)} aria-label="Category">
              <span>{categories.find(c => c.id === form.category)?.name || 'Select'}</span>
              <ChevronDown size={14} className={catOpen ? 'rotated' : ''} />
            </button>
            {catOpen && (
              <div className="admin-select-dropdown">
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`admin-select-option ${c.id === form.category ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>Phone <span className="req">*</span></label>}
          <input className="form-control" name="phone" value={form.phone} onChange={onChange} required placeholder={placeholderLabels ? 'Phone *' : '+353 87 123 4567'} aria-label="Phone" />
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>WhatsApp number</label>}
          <input className="form-control" name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder={placeholderLabels ? 'WhatsApp number' : '+353 87 123 4567'} aria-label="WhatsApp number" />
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>Service area</label>}
          <input className="form-control" name="service_area" value={form.service_area} onChange={onChange} placeholder={placeholderLabels ? 'Service area' : 'e.g. Drogheda'} aria-label="Service area" />
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>Working hours</label>}
          <input className="form-control" name="working_hours" value={form.working_hours} onChange={onChange} placeholder={placeholderLabels ? 'Working hours' : 'e.g. Mon-Sat, 9 AM - 6 PM'} aria-label="Working hours" />
        </div>
        <div className="admin-field">
          {!placeholderLabels && <label>Estate, location</label>}
          <input className="form-control" name="estate_name" value={form.estate_name} onChange={onChange} placeholder={placeholderLabels ? 'Estate, location' : 'e.g. Ballymakenny Park, Drogheda'} aria-label="Estate, location" />
        </div>
        <div className="admin-field full-width">
          {!placeholderLabels && <label>Description</label>}
          <textarea className="form-control form-textarea" name="description" value={form.description} onChange={onChange} rows={2} placeholder={placeholderLabels ? 'Description' : 'Brief description of services...'} aria-label="Description" />
        </div>
        <div className="admin-field full-width">
          {!placeholderLabels && <label>Services (comma separated)</label>}
          <input className="form-control" name="services" value={form.services} onChange={onChange} placeholder={placeholderLabels ? 'Services' : 'Pipe repair, Leak fixing, Bathroom fitting'} aria-label="Services" />
        </div>
        <div className="admin-field">
          <label className="admin-checkbox form-checkbox">
            <input type="checkbox" name="is_verified" checked={form.is_verified} onChange={onChange} />
            <span>Verified service provider</span>
          </label>
        </div>
        {showDisabledOption && (
          <div className="admin-field">
            <label className="admin-checkbox form-checkbox admin-disable-checkbox">
              <input type="checkbox" name="is_disabled" checked={form.is_disabled} onChange={onChange} />
              <span>Disable service provider</span>
            </label>
          </div>
        )}
      </div>
      <div className="admin-form-footer">
        <button type="button" className="admin-secondary-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="admin-primary-btn">{submitLabel}</button>
      </div>
    </form>
  );
}

/* Custom dropdown for estate filter */
function EstateFilterDropdown({ estates, providers, value, onChange }: {
  estates: { id: number; slug: string; name: string; description: string }[];
  providers: ProviderRow[];
  value: string;
  onChange: (val: string) => void;
}) {
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

  const selectedEstate = estates.find(e => String(e.id) === value) || estates[0];
  const selectedLabel = selectedEstate
    ? `${selectedEstate.name} (${providers.filter(p => p.estate_id === selectedEstate.id).length})`
    : 'Select estate';

  return (
    <div className="admin-filter-bar" ref={ref}>
      <button className="admin-filter-trigger" onClick={() => setOpen(!open)}>
        <span>{selectedLabel}</span>
        <ChevronDown size={16} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="admin-filter-dropdown">
          {estates.map(est => {
            const count = providers.filter(p => p.estate_id === est.id).length;
            return (
              <button
                key={est.id}
                className={`admin-filter-option ${value === String(est.id) ? 'active' : ''}`}
                onClick={() => { onChange(String(est.id)); setOpen(false); }}
              >
                <span className="admin-filter-label">
                  <span>{est.name}</span>
                  {est.description && <span className="admin-filter-desc">{est.description}</span>}
                </span>
                <span className="admin-filter-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [estates, setEstates] = useState<{ id: number; slug: string; name: string; description: string }[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [estateFilter, setEstateFilter] = useState<string>('');
  const [providerSearch, setProviderSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [providerFeedback, setProviderFeedback] = useState<FeedbackRow[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'providers' | 'suggestions' | 'categories' | 'analytics'>('providers');
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<number | null>(null);
  const [suggestionForm, setSuggestionForm] = useState(EMPTY_FORM);
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const switchTab = (t: 'providers' | 'suggestions' | 'categories' | 'analytics') => {
    setTab(t);
    setShowForm(false);
    setEditingId(null);
    setProviderFeedback([]);
    setEditingSuggestion(null);
    setExpandedSuggestion(null);
    fetchData();
  };
  const [token, setToken] = useState<string | null>(localStorage.getItem('callbook_admin_token'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'x-admin-token': token || '' };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('callbook_admin_token', data.token);
      } else {
        setLoginError('Incorrect password. Try again.');
      }
    } catch {
      setLoginError('Cannot connect to server. Make sure it is running.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('callbook_admin_token');
  };

  const fetchData = async () => {
    try {
      const [pRes, sRes, eRes, cRes, aRes] = await Promise.all([
        fetch('/api/providers', { headers: { 'x-admin-token': token || '' } }),
        fetch('/api/suggestions', { headers: { 'x-admin-token': token || '' } }),
        fetch('/api/estates'),
        fetch('/api/categories'),
        fetch('/api/admin/analytics', { headers: { 'x-admin-token': token || '' } }),
      ]);
      if ([pRes, sRes, eRes, cRes, aRes].some(handleUnauthorized)) return;
      if (pRes.ok) setProviders(await pRes.json());
      if (sRes.ok) setSuggestions(await sRes.json());
      if (eRes.ok) setEstates(await eRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
      if (cRes.ok) {
        const cats = await cRes.json();
        setCategories(cats.sort((a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name)));
      }
    } catch { /* server not running */ }
  };

  useEffect(() => { if (token) fetchData(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!estateFilter && estates.length > 0) {
      setEstateFilter(String(estates[0].id));
    }
  }, [estateFilter, estates]);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUnauthorized = (res: Response) => {
    if (res.status !== 401) return false;
    setToken(null);
    localStorage.removeItem('callbook_admin_token');
    setLoginError('Session expired. Sign in again.');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSuggestionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSuggestionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      estate_name: form.estate_name || null,
      business_name: form.business_name || null,
      whatsapp: form.whatsapp || null,
      service_area: form.service_area || null,
      working_hours: form.working_hours || null,
      services: form.services.split(',').map(s => s.trim()).filter(Boolean),
    };

    const url = editingId ? `/api/admin/providers/${editingId}` : '/api/admin/providers';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(payload) });

    if (handleUnauthorized(res)) return;
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Number.isInteger(data?.estate_id)) {
        setEstateFilter(String(data.estate_id));
      }
      flash(editingId ? 'Provider updated' : 'Provider added');
      setShowForm(false);
      setEditingId(null);
      setProviderFeedback([]);
      setForm(EMPTY_FORM);
      await fetchData();
    } else {
      const data = await res.json().catch(() => null);
      flash(data?.error || 'Error saving. Check required fields.');
    }
  };

  const fetchProviderFeedback = async (providerId: number) => {
    const res = await fetch(`/api/admin/providers/${providerId}/feedback`, { headers: authHeaders });
    if (handleUnauthorized(res)) return;
    if (res.ok) setProviderFeedback(await res.json());
    else setProviderFeedback([]);
  };

  const handleEdit = (p: ProviderRow) => {
    const estate = estates.find(e => e.id === p.estate_id);
    setEditingId(p.id);
    setForm({
      name: p.name,
      business_name: p.business_name || '',
      category: p.category,
      description: p.description,
      phone: p.phone,
      whatsapp: p.whatsapp || '',
      service_area: p.service_area || '',
      working_hours: p.working_hours || '',
      is_verified: p.is_verified,
      is_disabled: p.status === 'disabled',
      services: (p.services || []).join(', '),
      estate_name: estate ? [estate.name, estate.description].filter(Boolean).join(', ') : p.estate_name || '',
    });
    setShowForm(true);
    fetchProviderFeedback(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFeedback = (feedbackId: number) => {
    setConfirmDialog({
      message: 'Delete this feedback permanently?',
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch(`/api/admin/feedback/${feedbackId}`, { method: 'DELETE', headers: authHeaders });
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          flash('Feedback deleted');
          setProviderFeedback(prev => prev.filter(item => item.id !== feedbackId));
        } else {
          flash('Error deleting feedback');
        }
      },
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      message: 'Delete this provider permanently?',
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE', headers: authHeaders });
        if (handleUnauthorized(res)) return;
        if (res.ok) { flash('Provider deleted'); fetchData(); }
      },
    });
  };

  const handleDeleteEstate = () => {
    const estate = estates.find(e => e.id === Number(estateFilter));
    if (!estate) return;

    const estateName = [estate.name, estate.description].filter(Boolean).join(', ');
    const providerCount = providers.filter(p => p.estate_id === estate.id).length;
    setConfirmDialog({
      message: `Delete ${estateName} and all ${providerCount} service provider(s)? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch(`/api/admin/estates/${estate.id}`, { method: 'DELETE', headers: authHeaders });
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          flash('Estate deleted');
          setEstateFilter('');
          setProviderSearch('');
          await fetchData();
        } else {
          const data = await res.json().catch(() => null);
          flash(data?.error || 'Error deleting estate');
        }
      },
    });
  };

  const handleApprove = async (id: number) => {
    const res = await fetch(`/api/admin/suggestions/${id}/approve`, { method: 'POST', headers: authHeaders });
    if (handleUnauthorized(res)) return;
    if (res.ok) { flash('Approved and added as provider'); fetchData(); setExpandedSuggestion(null); }
    else {
      const data = await res.json().catch(() => null);
      flash(data?.error || 'Error approving suggestion');
    }
  };

  const handleDismiss = async (id: number) => {
    setConfirmDialog({
      message: 'Dismiss this suggestion?',
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch(`/api/admin/suggestions/${id}`, { method: 'DELETE', headers: authHeaders });
        if (handleUnauthorized(res)) return;
        if (res.ok) { flash('Suggestion dismissed'); fetchData(); setExpandedSuggestion(null); }
      },
    });
  };

  const handleEditSuggestion = (s: SuggestionRow) => {
    setEditingSuggestion(s.id);
    setExpandedSuggestion(null);
    const meta = s.metadata ? JSON.parse(s.metadata) : {};
    const estate = estates.find(e => e.slug === s.estate_name || e.name === s.estate_name);
    setSuggestionForm({
      name: String(getSuggestedValue(s, 'name') || ''),
      business_name: String(getSuggestedValue(s, 'business_name') || meta.business_name || ''),
      category: String(getSuggestedValue(s, 'category') || ''),
      description: String(getSuggestedValue(s, 'description') || ''),
      phone: String(getSuggestedValue(s, 'phone') || ''),
      whatsapp: String(getSuggestedValue(s, 'whatsapp') || meta.whatsapp || ''),
      service_area: String(getSuggestedValue(s, 'service_area') || ''),
      working_hours: String(getSuggestedValue(s, 'working_hours') || meta.working_hours || ''),
      is_verified: Boolean(getSuggestedValue(s, 'is_verified') ?? meta.is_verified),
      services: formatServicesText(getSuggestedValue(s, 'services') || meta.services),
      estate_name: estate ? [estate.name, estate.description].filter(Boolean).join(', ') : s.estate_name || '',
    });
  };

  const formatSuggestionEstate = (estateName: string | null) => {
    if (!estateName) return '';
    const estate = estates.find(e => e.slug === estateName || e.name === estateName);
    return estate ? [estate.name, estate.description].filter(Boolean).join(', ') : estateName;
  };

  const getSuggestedValue = (s: SuggestionRow, field: string) => {
    if (s.suggested_edits && Object.prototype.hasOwnProperty.call(s.suggested_edits, field)) {
      return s.suggested_edits[field];
    }
    if (field === 'description') return s.note;
    return s[field as keyof SuggestionRow] as string | boolean | null | undefined;
  };

  const hasSuggestedEdit = (s: SuggestionRow, field: string) => Boolean(s.suggested_edits && Object.prototype.hasOwnProperty.call(s.suggested_edits, field));

  const hasSuggestedEdits = (s: SuggestionRow) => Boolean(s.suggested_edits && Object.keys(s.suggested_edits).length > 0);

  const renderSuggestionValue = (s: SuggestionRow, field: string, value: string | boolean | null | undefined) => (
    <span className={`admin-detail-value ${hasSuggestedEdit(s, field) ? 'suggested-edit-highlight' : ''}`}>
      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-'}
    </span>
  );

  const handleSaveSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSuggestion) return;
    const res = await fetch(`/api/admin/suggestions/${editingSuggestion}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: suggestionForm.name,
        phone: suggestionForm.phone,
        category: suggestionForm.category,
        service_area: suggestionForm.service_area || null,
        note: suggestionForm.description || null,
        estate_name: suggestionForm.estate_name || null,
        business_name: suggestionForm.business_name || null,
        whatsapp: suggestionForm.whatsapp || null,
        working_hours: suggestionForm.working_hours || null,
        services: suggestionForm.services || null,
        is_verified: suggestionForm.is_verified || false,
      }),
    });
    if (handleUnauthorized(res)) return;
    if (res.ok) {
      flash('Suggestion updated');
      setEditingSuggestion(null);
      fetchData();
    } else {
      flash('Error saving changes');
    }
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending' || hasSuggestedEdits(s));
  const mostOpenedProvider = analytics.top_providers[0];

  const selectedEstateProviders = estateFilter
    ? providers.filter(p => p.estate_id === Number(estateFilter))
    : [];

  const providerSearchTerm = providerSearch.trim().toLowerCase();
  const filteredProviders = providerSearchTerm
    ? selectedEstateProviders.filter(p => {
      const categoryName = categories.find(c => c.id === p.category)?.name || p.category;
      return [p.name, p.business_name, p.phone, p.whatsapp, p.service_area, categoryName]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(providerSearchTerm));
    })
    : selectedEstateProviders;

  const getSelectedEstateName = () => {
    const estate = estates.find(e => e.id === Number(estateFilter));
    return estate ? [estate.name, estate.description].filter(Boolean).join(', ') : '';
  };

  const handleAddProvider = () => {
    setShowForm(true);
    setEditingId(null);
    setProviderFeedback([]);
    setForm({ ...EMPTY_FORM, estate_name: getSelectedEstateName() });
  };

  // ===== LOGIN SCREEN =====
  if (!token) {
    return (
      <>
        <Header showTabs={false} />
        <div className="admin-login-page">
          <div className="admin-login-card">
            <div className="admin-login-icon">
              <Lock size={24} />
            </div>
            <h1>Admin Access</h1>
            <p>Enter the password to manage Estate Contacts service providers</p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button type="submit">Sign in</button>
            </form>
            {loginError && <p className="admin-login-error">{loginError}</p>}
          </div>
        </div>
      </>
    );
  }

  // ===== ADMIN DASHBOARD =====
  return (
    <>
      <Header showTabs={false} onLogout={handleLogout} />
      <div className="admin-page">
        {/* Header */}

      {/* Flash */}
      {message && <div className="admin-toast">{message}</div>}

      {/* Tabs */}
      <div className="admin-tab-bar">
        <button className={`admin-tab ${tab === 'providers' ? 'active' : ''}`} onClick={() => switchTab('providers')}>
          <Users size={20} strokeWidth={tab === 'providers' ? 2.2 : 1.8} />
          <span>Service Providers</span>
          <span className="admin-tab-badge">{providers.length}</span>
        </button>
        <button className={`admin-tab ${tab === 'suggestions' ? 'active' : ''}`} onClick={() => switchTab('suggestions')}>
          <Inbox size={20} strokeWidth={tab === 'suggestions' ? 2.2 : 1.8} />
          <span>Suggestions</span>
          {pendingSuggestions.length > 0 && <span className="admin-tab-badge">{pendingSuggestions.length}</span>}
        </button>
        <button className={`admin-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => switchTab('categories')}>
          <Tag size={20} strokeWidth={tab === 'categories' ? 2.2 : 1.8} />
          <span>Categories</span>
          <span className="admin-tab-badge">{categories.length}</span>
        </button>
        <button className={`admin-tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => switchTab('analytics')}>
          <BarChart3 size={20} strokeWidth={tab === 'analytics' ? 2.2 : 1.8} />
          <span>Analytics</span>
        </button>
      </div>

      {/* ===== PROVIDERS TAB ===== */}
      {tab === 'providers' && (
        <div className="admin-section admin-providers-section">
          {showForm ? (
            <div className="admin-provider-edit-screen">
              <div className="admin-form-card admin-provider-edit-card">
                <EditForm
                  form={form}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={() => { setShowForm(false); setEditingId(null); setProviderFeedback([]); }}
                  submitLabel={editingId ? 'Save changes' : 'Add provider'}
                  categories={categories}
                  showDisabledOption={Boolean(editingId)}
                />
                {editingId && (
                  <div className="admin-feedback-panel">
                    <div className="admin-feedback-header">
                      <h3>Feedback</h3>
                    </div>
                    {providerFeedback.length > 0 ? (
                      <div className="admin-feedback-list">
                        {providerFeedback.map(item => (
                          <div key={item.id} className="admin-feedback-item">
                            <div className="admin-feedback-content">
                              <div className="admin-feedback-meta">
                                <span className="admin-feedback-rating">
                                  {Array.from({ length: item.rating }, (_, i) => (
                                    <Star key={i} size={9} fill="currentColor" />
                                  ))}
                                </span>
                                <span>{new Date(item.created_at).toLocaleString()}</span>
                              </div>
                              <p>{item.comment || '-'}</p>
                            </div>
                            <button className="admin-icon-btn danger" onClick={() => handleDeleteFeedback(item.id)} aria-label="Delete feedback">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-feedback-empty">No feedback yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="admin-section-actions">
                <button className="admin-secondary-btn danger" onClick={handleDeleteEstate} disabled={!estateFilter}>
                  <Trash2 size={15} />
                  Delete estate
                </button>
                <button className="admin-secondary-btn" onClick={handleAddProvider}>
                  Add
                </button>
              </div>

              {/* Estate filter */}
              {estates.length > 0 && (
                <EstateFilterDropdown
                  estates={estates}
                  providers={providers}
                  value={estateFilter}
                  onChange={setEstateFilter}
                />
              )}

              <SearchBar value={providerSearch} onChange={setProviderSearch} placeholder="Search service providers" />

              <div className="admin-table">
                {filteredProviders.map(p => (
                  <div key={p.id} className={`admin-row ${p.status === 'disabled' ? 'admin-row-disabled' : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleEdit(p)}>
                    <div className="admin-row-avatar">
                      {getInitials(p.business_name || p.name)}
                    </div>
                    <div className="admin-row-content">
                      <div className="admin-row-title">
                        {p.business_name || p.name}
                        {p.is_verified && <BadgeCheck size={13} className="admin-verified" />}
                        {p.status === 'pending' && <span className="admin-pending-badge">Pending approval</span>}
                        {p.status === 'disabled' && <span className="admin-disabled-badge">Disabled</span>}
                      </div>
                      <div className="admin-row-meta">
                        <span><Phone size={11} /> {p.phone}</span>
                        {p.service_area && <span><MapPin size={11} /> {p.service_area}</span>}
                        <span className="admin-row-cat">{categories.find(c => c.id === p.category)?.name || p.category}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions" onClick={e => e.stopPropagation()}>
                      <button className="admin-icon-btn danger" onClick={() => handleDelete(p.id)} aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredProviders.length === 0 && (
                  <div className="admin-empty">
                    <Users size={24} />
                    <p>{providerSearchTerm ? 'No matching service providers' : 'No service providers yet'}</p>
                    <span>{providerSearchTerm ? 'Try a different name, phone, area, or category' : 'Click "Add" to get started'}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== SUGGESTIONS TAB ===== */}
      {tab === 'suggestions' && (
        <div className="admin-section admin-suggestions-section">
          {editingSuggestion ? (
            <div className="admin-suggestion-edit-screen">
              <div className="admin-form-card admin-suggestion-edit-card">
                <EditForm
                  form={suggestionForm}
                  onChange={handleSuggestionFormChange}
                  onSubmit={handleSaveSuggestion}
                  onCancel={() => setEditingSuggestion(null)}
                  submitLabel="Save changes"
                  categories={categories}
                />
              </div>
            </div>
          ) : (
          <div className="admin-table">
            {pendingSuggestions.map(s => (
              <div key={s.id} className={`admin-suggestion ${expandedSuggestion === s.id ? 'expanded' : ''}`}>
                {/* Summary row */}
                <button
                  className="admin-suggestion-header"
                  onClick={() => { setExpandedSuggestion(expandedSuggestion === s.id ? null : s.id); setEditingSuggestion(null); }}
                >
                  <div className="admin-row-avatar suggestion">{s.name.charAt(0)}</div>
                  <div className="admin-row-content">
                    <div className="admin-row-title">
                      {String(getSuggestedValue(s, 'name') || s.name)}
                      {hasSuggestedEdits(s) && <span className="admin-suggested-edit-badge">Suggested edit</span>}
                    </div>
                    {s.estate_name && (
                      <div className="admin-row-estate">
                        <Home size={11} />
                        <span>{formatSuggestionEstate(s.estate_name)}</span>
                      </div>
                    )}
                    <div className="admin-row-meta">
                      <span><Phone size={11} /> {String(getSuggestedValue(s, 'phone') || s.phone)}</span>
                      <span className="admin-row-cat">{categories.find(c => c.id === String(getSuggestedValue(s, 'category') || s.category))?.name || String(getSuggestedValue(s, 'category') || s.category)}</span>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`admin-suggestion-chevron ${expandedSuggestion === s.id ? 'rotated' : ''}`} />
                </button>

                {/* Expanded */}
                {expandedSuggestion === s.id && (
                  <div className="admin-suggestion-details">
                        <div className="admin-detail-grid">
                          <div className="admin-detail-item">
                            <Phone size={14} />
                            <div>
                              <span className="admin-detail-label">Phone</span>
                              {renderSuggestionValue(s, 'phone', getSuggestedValue(s, 'phone'))}
                            </div>
                          </div>
                          <div className="admin-detail-item">
                            <MessageSquare size={14} />
                            <div>
                              <span className="admin-detail-label">WhatsApp</span>
                              {renderSuggestionValue(s, 'whatsapp', getSuggestedValue(s, 'whatsapp'))}
                            </div>
                          </div>
                          <div className="admin-detail-item">
                            <Users size={14} />
                            <div>
                              <span className="admin-detail-label">Category</span>
                              {renderSuggestionValue(s, 'category', categories.find(c => c.id === String(getSuggestedValue(s, 'category') || s.category))?.name || String(getSuggestedValue(s, 'category') || s.category))}
                            </div>
                          </div>
                          <div className="admin-detail-item">
                            <MapPin size={14} />
                            <div>
                              <span className="admin-detail-label">Service area</span>
                              {renderSuggestionValue(s, 'service_area', getSuggestedValue(s, 'service_area'))}
                            </div>
                          </div>
                          {s.estate_name && (
                            <div className="admin-detail-item">
                              <Home size={14} />
                              <div>
                                <span className="admin-detail-label">Estate, location</span>
                                <span className="admin-detail-value">{formatSuggestionEstate(s.estate_name)}</span>
                              </div>
                            </div>
                          )}
                          <div className="admin-detail-item">
                            <Clock size={14} />
                            <div>
                              <span className="admin-detail-label">Working hours</span>
                              {renderSuggestionValue(s, 'working_hours', getSuggestedValue(s, 'working_hours'))}
                            </div>
                          </div>
                          <div className="admin-detail-item">
                            <MessageSquare size={14} />
                            <div>
                              <span className="admin-detail-label">Notes</span>
                              {renderSuggestionValue(s, 'description', getSuggestedValue(s, 'description'))}
                            </div>
                          </div>
                          <div className="admin-detail-item">
                            <Clock size={14} />
                            <div>
                              <span className="admin-detail-label">Submitted</span>
                              <span className="admin-detail-value">{new Date(s.submitted_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="admin-suggestion-actions">
                          <button className="admin-primary-btn" onClick={() => handleApprove(s.id)}>
                            <Check size={15} />
                            Approve
                          </button>
                          <button className="admin-secondary-btn" onClick={() => handleEditSuggestion(s)}>
                            <Pencil size={15} />
                            Edit
                          </button>
                          <button className="admin-secondary-btn danger" onClick={() => handleDismiss(s.id)}>
                            <X size={15} />
                            Dismiss
                          </button>
                        </div>
                  </div>
                )}
              </div>
            ))}
            {pendingSuggestions.length === 0 && (
              <div className="admin-empty">
                <Inbox size={24} />
                <p>No pending suggestions</p>
                <span>Suggestions from users will appear here</span>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* ===== CATEGORIES TAB ===== */}
      {tab === 'categories' && (
        <div className="admin-section admin-categories-section">
          {/* Add new category form */}
          <div className="admin-cat-add" style={{ padding: '0 var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <div className="admin-cat-add-row">
              <input
                className="admin-cat-input form-control"
                value={newCatId}
                onChange={e => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="slug (e.g. locksmith)"
              />
              <input
                className="admin-cat-input form-control"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Display name"
              />
              <button
                className="admin-secondary-btn"
                onClick={async () => {
                  if (!newCatId || !newCatName) return;
                  const res = await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ id: newCatId, name: newCatName }),
                  });
                  if (res.ok) {
                    flash('Category added');
                    setNewCatId('');
                    setNewCatName('');
                    fetchData();
                  } else {
                    const data = await res.json();
                    flash(data.error || 'Error adding category');
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="admin-table">
            {categories.map(cat => (
              <div key={cat.id} className="admin-row">
                {editingCatId === cat.id ? (
                  /* Editing mode */
                  <>
                    <div className="admin-row-avatar">
                      <Tag size={16} />
                    </div>
                    <div className="admin-row-content" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="admin-cat-input form-control"
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        placeholder="Name"
                        style={{ flex: 1 }}
                      />
                      <input
                        className="admin-cat-input form-control"
                        value={editCatDesc}
                        onChange={e => setEditCatDesc(e.target.value)}
                        placeholder="Description"
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-btn approve"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/categories/${cat.id}`, {
                            method: 'PUT',
                            headers: authHeaders,
                            body: JSON.stringify({ name: editCatName, description: editCatDesc }),
                          });
                          if (res.ok) {
                            flash('Category updated');
                            setEditingCatId(null);
                            fetchData();
                          }
                        }}
                        aria-label="Save"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        className="admin-icon-btn"
                        onClick={() => setEditingCatId(null)}
                        aria-label="Cancel"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  /* View mode — click to edit */
                  <>
                    <div className="admin-row-avatar" style={{ cursor: 'pointer' }} onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatDesc(cat.description || ''); }}>
                      <Tag size={16} />
                    </div>
                    <div className="admin-row-content" style={{ cursor: 'pointer' }} onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatDesc(cat.description || ''); }}>
                      <div className="admin-row-title">{cat.name}</div>
                      <div className="admin-row-meta">
                        <span>{cat.id}</span>
                        {cat.description && <span>{cat.description}</span>}
                        <span>{cat.provider_count || 0} provider{(cat.provider_count || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-btn danger"
                        onClick={async () => {
                          setConfirmDialog({
                            message: `Delete category "${cat.name}"?`,
                            onConfirm: async () => {
                              setConfirmDialog(null);
                              const res = await fetch(`/api/admin/categories/${cat.id}`, {
                                method: 'DELETE',
                                headers: authHeaders,
                              });
                              if (res.ok) {
                                flash('Category deleted');
                                fetchData();
                              } else {
                                const data = await res.json();
                                flash(data.error || 'Error deleting category');
                              }
                            },
                          });
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <div className="admin-empty">
                <Tag size={24} />
                <p>No categories</p>
                <span>Add a category to get started</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ANALYTICS TAB ===== */}
      {tab === 'analytics' && (
        <div className="admin-section admin-analytics-section">
          <div className="admin-analytics-scroll">
            <div className="admin-analytics-summary">
              <div className="admin-analytics-card">
                <Home size={18} />
                <div>
                  <span className="analytics-value">{analytics.totals.estate_visits}</span>
                  <span className="analytics-label">Total estate visits</span>
                </div>
              </div>
              <div className="admin-analytics-card">
                <Eye size={18} />
                <div>
                  <span className="analytics-value">{analytics.totals.provider_opens}</span>
                  <span className="analytics-label">Contact opens</span>
                </div>
              </div>
              <div className="admin-analytics-card">
                <Search size={18} />
                <div>
                  <span className="analytics-value">{analytics.totals.searches}</span>
                  <span className="analytics-label">Searches</span>
                </div>
              </div>
            </div>

            <section className="admin-analytics-block">
              <div className="admin-analytics-heading">
                <h2>Visits By Estate</h2>
                <span>{analytics.estate_visits.length} estates</span>
              </div>
              <div className="admin-analytics-list">
                {analytics.estate_visits.map(estate => (
                  <div key={estate.id} className="admin-analytics-row">
                    <div className="admin-row-avatar analytics"><Home size={16} /></div>
                    <div className="admin-row-content">
                      <div className="admin-row-title">{[estate.name, estate.description].filter(Boolean).join(', ')}</div>
                      <div className="admin-row-meta">
                        <span>{estate.last_visited_at ? `Last visit ${new Date(estate.last_visited_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'No visits yet'}</span>
                      </div>
                    </div>
                    <strong className="admin-analytics-count">{estate.visit_count}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-analytics-block">
              <div className="admin-analytics-heading">
                <h2>Most Opened Contacts</h2>
                {mostOpenedProvider && <span>Top: {mostOpenedProvider.business_name || mostOpenedProvider.name}</span>}
              </div>
              <div className="admin-analytics-list">
                {analytics.top_providers.map(provider => (
                  <div key={provider.id} className="admin-analytics-row">
                    <div className="admin-row-avatar analytics">{getInitials(provider.business_name || provider.name)}</div>
                    <div className="admin-row-content">
                      <div className="admin-row-title">{provider.business_name || provider.name}</div>
                      <div className="admin-row-meta">
                        <span>{categories.find(c => c.id === provider.category)?.name || provider.category}</span>
                        <span>{provider.estate_name}</span>
                        <span>{provider.last_opened_at ? `Last opened ${new Date(provider.last_opened_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not opened yet'}</span>
                      </div>
                    </div>
                    <strong className="admin-analytics-count">{provider.open_count}</strong>
                  </div>
                ))}
                {analytics.top_providers.length === 0 && (
                  <div className="admin-empty">
                    <BarChart3 size={24} />
                    <p>No contact opens yet</p>
                    <span>Counts will appear after people open contact details</span>
                  </div>
                )}
              </div>
            </section>

            <section className="admin-analytics-block">
              <div className="admin-analytics-heading">
                <h2>Top Search Keywords</h2>
                <span>Top 10</span>
              </div>
              <div className="admin-analytics-list">
                {analytics.top_searches.map(item => (
                  <div key={`${item.estate_id}-${item.search_term}`} className="admin-analytics-row">
                    <div className="admin-row-avatar analytics"><Search size={16} /></div>
                    <div className="admin-row-content">
                      <div className="admin-row-title">{item.search_term}</div>
                      <div className="admin-row-meta">
                        <span>{item.estate_name}</span>
                        <span>{item.last_searched_at ? `Last searched ${new Date(item.last_searched_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not searched yet'}</span>
                      </div>
                    </div>
                    <strong className="admin-analytics-count">{item.search_count}</strong>
                  </div>
                ))}
                {analytics.top_searches.length === 0 && (
                  <div className="admin-empty">
                    <Search size={24} />
                    <p>No searches yet</p>
                    <span>Keywords will appear after people use search</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
    {/* Custom confirm dialog */}
    {confirmDialog && (
      <div className="admin-overlay" onClick={() => setConfirmDialog(null)}>
        <div className="admin-dialog" onClick={e => e.stopPropagation()}>
          <p className="admin-dialog-message">{confirmDialog.message}</p>
          <div className="admin-dialog-actions">
            <button className="admin-secondary-btn" onClick={() => setConfirmDialog(null)}>Cancel</button>
            <button className="admin-primary-btn admin-dialog-danger" onClick={confirmDialog.onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, Lock, Users, Inbox, Phone, MapPin, BadgeCheck, ChevronDown, Clock, MessageSquare, Home, Tag } from 'lucide-react';
import { Header } from '../components/Header';
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
}

interface SuggestionRow {
  id: number;
  name: string;
  phone: string;
  category: string;
  service_area: string | null;
  note: string | null;
  estate_name: string | null;
  metadata: string | null;
  status: string;
  submitted_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  provider_count?: number;
}

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
  services: '',
  estate_name: '',
};

type FormData = typeof EMPTY_FORM;

/* Shared edit form used by both providers and suggestions */
function EditForm({ form, onChange, onSubmit, onCancel, submitLabel, categories }: {
  form: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  categories: CategoryRow[];
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
          <label>Person name <span className="req">*</span></label>
          <input name="name" value={form.name} onChange={onChange} required placeholder="e.g. Rajesh Kumar" />
        </div>
        <div className="admin-field">
          <label>Business name</label>
          <input name="business_name" value={form.business_name} onChange={onChange} placeholder="e.g. Kumar Plumbing" />
        </div>
        <div className="admin-field">
          <label>Category <span className="req">*</span></label>
          <div className="admin-custom-select" ref={catRef}>
            <button type="button" className="admin-select-trigger" onClick={() => setCatOpen(!catOpen)}>
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
          <label>Phone <span className="req">*</span></label>
          <input name="phone" value={form.phone} onChange={onChange} required placeholder="+919876543210" />
        </div>
        <div className="admin-field">
          <label>WhatsApp number</label>
          <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="919876543210 (no + sign)" />
        </div>
        <div className="admin-field">
          <label>Service area</label>
          <input name="service_area" value={form.service_area} onChange={onChange} placeholder="e.g. All Sectors" />
        </div>
        <div className="admin-field">
          <label>Working hours</label>
          <input name="working_hours" value={form.working_hours} onChange={onChange} placeholder="e.g. Mon–Sat, 9 AM – 6 PM" />
        </div>
        <div className="admin-field">
          <label>Estate, location</label>
          <input name="estate_name" value={form.estate_name} onChange={onChange} placeholder="e.g. Ballymakenny Park, Drogheda" />
        </div>
        <div className="admin-field full-width">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={2} placeholder="Brief description of services..." />
        </div>
        <div className="admin-field full-width">
          <label>Services (comma separated)</label>
          <input name="services" value={form.services} onChange={onChange} placeholder="Pipe repair, Leak fixing, Bathroom fitting" />
        </div>
        <div className="admin-field">
          <label className="admin-checkbox">
            <input type="checkbox" name="is_verified" checked={form.is_verified} onChange={onChange} />
            <BadgeCheck size={14} />
            <span>Verified provider</span>
          </label>
        </div>
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

  const selectedLabel = value === 'all'
    ? `All estates (${providers.length})`
    : `${estates.find(e => String(e.id) === value)?.name || ''} (${providers.filter(p => p.estate_id === Number(value)).length})`;

  return (
    <div className="admin-filter-bar" ref={ref}>
      <button className="admin-filter-trigger" onClick={() => setOpen(!open)}>
        <span>{selectedLabel}</span>
        <ChevronDown size={16} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="admin-filter-dropdown">
          <button
            className={`admin-filter-option ${value === 'all' ? 'active' : ''}`}
            onClick={() => { onChange('all'); setOpen(false); }}
          >
            All estates
            <span className="admin-filter-count">{providers.length}</span>
          </button>
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
  const [estateFilter, setEstateFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'providers' | 'suggestions' | 'categories'>('providers');
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<number | null>(null);
  const [suggestionForm, setSuggestionForm] = useState(EMPTY_FORM);
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const switchTab = (t: 'providers' | 'suggestions' | 'categories') => {
    setTab(t);
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
      const [pRes, sRes, eRes, cRes] = await Promise.all([
        fetch('/api/providers'),
        fetch('/api/suggestions', { headers: { 'x-admin-token': token || '' } }),
        fetch('/api/estates'),
        fetch('/api/categories'),
      ]);
      if ([pRes, sRes, eRes, cRes].some(handleUnauthorized)) return;
      if (pRes.ok) setProviders(await pRes.json());
      if (sRes.ok) setSuggestions(await sRes.json());
      if (eRes.ok) setEstates(await eRes.json());
      if (cRes.ok) {
        const cats = await cRes.json();
        setCategories(cats.sort((a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name)));
      }
    } catch { /* server not running */ }
  };

  useEffect(() => { if (token) fetchData(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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
      flash(editingId ? 'Provider updated' : 'Provider added');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchData();
    } else {
      const data = await res.json().catch(() => null);
      flash(data?.error || 'Error saving. Check required fields.');
    }
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
      services: (p.services || []).join(', '),
      estate_name: estate ? [estate.name, estate.description].filter(Boolean).join(', ') : p.estate_name || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const meta = s.metadata ? JSON.parse(s.metadata) : {};
    const estate = estates.find(e => e.slug === s.estate_name || e.name === s.estate_name);
    setSuggestionForm({
      name: s.name,
      business_name: meta.business_name || '',
      category: s.category,
      description: s.note || '',
      phone: s.phone,
      whatsapp: meta.whatsapp || '',
      service_area: s.service_area || '',
      working_hours: meta.working_hours || '',
      is_verified: meta.is_verified || false,
      services: meta.services || '',
      estate_name: estate ? [estate.name, estate.description].filter(Boolean).join(', ') : s.estate_name || '',
    });
  };

  const formatSuggestionEstate = (estateName: string | null) => {
    if (!estateName) return '';
    const estate = estates.find(e => e.slug === estateName || e.name === estateName);
    return estate ? [estate.name, estate.description].filter(Boolean).join(', ') : estateName;
  };

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

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const filteredProviders = estateFilter === 'all'
    ? providers
    : providers.filter(p => p.estate_id === Number(estateFilter));

  const getSelectedEstateName = () => {
    if (estateFilter === 'all') return '';
    const estate = estates.find(e => e.id === Number(estateFilter));
    return estate ? [estate.name, estate.description].filter(Boolean).join(', ') : '';
  };

  const handleAddProvider = () => {
    setShowForm(true);
    setEditingId(null);
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
      </div>

      {/* ===== PROVIDERS TAB ===== */}
      {tab === 'providers' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>All Service Providers</h2>
            <button className="admin-primary-btn" onClick={handleAddProvider}>
              <Plus size={15} />
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

          {showForm && (
            <div className="admin-form-card">
              <div className="admin-form-header">
                <h3>{editingId ? 'Edit Provider' : 'New Provider'}</h3>
                <button className="admin-icon-btn" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  <X size={18} />
                </button>
              </div>
              <EditForm
                form={form}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingId(null); }}
                submitLabel={editingId ? 'Save changes' : 'Add provider'}
                categories={categories}
              />
            </div>
          )}

          <div className="admin-table">
            {filteredProviders.map(p => (
              <div key={p.id} className="admin-row" style={{ cursor: 'pointer' }} onClick={() => handleEdit(p)}>
                <div className="admin-row-avatar">
                  {getInitials(p.business_name || p.name)}
                </div>
                <div className="admin-row-content">
                  <div className="admin-row-title">
                    {p.business_name || p.name}
                    {p.is_verified && <BadgeCheck size={13} className="admin-verified" />}
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
                <p>No service providers yet</p>
                <span>Click "Add" to get started</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SUGGESTIONS TAB ===== */}
      {tab === 'suggestions' && (
        <div className="admin-section">
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
                    <div className="admin-row-title">{s.name}</div>
                    <div className="admin-row-meta">
                      <span><Phone size={11} /> {s.phone}</span>
                      <span className="admin-row-cat">{categories.find(c => c.id === s.category)?.name || s.category}</span>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`admin-suggestion-chevron ${expandedSuggestion === s.id ? 'rotated' : ''}`} />
                </button>

                {/* Expanded */}
                {expandedSuggestion === s.id && (
                  <div className="admin-suggestion-details">
                    {editingSuggestion === s.id ? (
                      <div className="admin-form-card">
                        <div className="admin-form-header">
                          <h3>Edit Suggestion</h3>
                          <button className="admin-icon-btn" onClick={() => setEditingSuggestion(null)}>
                            <X size={18} />
                          </button>
                        </div>
                        <EditForm
                          form={suggestionForm}
                          onChange={handleSuggestionFormChange}
                          onSubmit={handleSaveSuggestion}
                          onCancel={() => setEditingSuggestion(null)}
                          submitLabel="Save"
                          categories={categories}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="admin-detail-grid">
                          <div className="admin-detail-item">
                            <Phone size={14} />
                            <div>
                              <span className="admin-detail-label">Phone</span>
                              <span className="admin-detail-value">{s.phone}</span>
                            </div>
                          </div>
                          <div className="admin-detail-item">
                            <Users size={14} />
                            <div>
                              <span className="admin-detail-label">Category</span>
                              <span className="admin-detail-value">{categories.find(c => c.id === s.category)?.name || s.category}</span>
                            </div>
                          </div>
                          {s.service_area && (
                            <div className="admin-detail-item">
                              <MapPin size={14} />
                              <div>
                                <span className="admin-detail-label">Service area</span>
                                <span className="admin-detail-value">{s.service_area}</span>
                              </div>
                            </div>
                          )}
                          {s.estate_name && (
                            <div className="admin-detail-item">
                              <Home size={14} />
                              <div>
                                <span className="admin-detail-label">Estate, location</span>
                                <span className="admin-detail-value">{formatSuggestionEstate(s.estate_name)}</span>
                              </div>
                            </div>
                          )}
                          {s.note && (
                            <div className="admin-detail-item">
                              <MessageSquare size={14} />
                              <div>
                                <span className="admin-detail-label">Notes</span>
                                <span className="admin-detail-value">{s.note}</span>
                              </div>
                            </div>
                          )}
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
                      </>
                    )}
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
        </div>
      )}

      {/* ===== CATEGORIES TAB ===== */}
      {tab === 'categories' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Categories</h2>
          </div>

          {/* Add new category form */}
          <div className="admin-cat-add" style={{ padding: '0 var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <div className="admin-cat-add-row">
              <input
                className="admin-cat-input"
                value={newCatId}
                onChange={e => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="slug (e.g. locksmith)"
              />
              <input
                className="admin-cat-input"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Display name"
              />
              <button
                className="admin-primary-btn"
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
                <Plus size={15} />
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
                        className="admin-cat-input"
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        placeholder="Name"
                        style={{ flex: 1 }}
                      />
                      <input
                        className="admin-cat-input"
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

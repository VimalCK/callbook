import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, LogOut, Lock, Users, Inbox, Phone, MapPin, BadgeCheck, ChevronDown, Clock, MessageSquare, Home } from 'lucide-react';
import './AdminPage.css';

interface ProviderRow {
  id: number;
  estate_id: number;
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
  status: string;
  submitted_at: string;
}

const CATEGORIES = [
  { id: 'plumber', name: 'Plumbing' },
  { id: 'electrician', name: 'Electrical' },
  { id: 'carpenter', name: 'Carpentry' },
  { id: 'painter', name: 'Painting' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'gardener', name: 'Gardening' },
  { id: 'appliance-repair', name: 'Appliances' },
  { id: 'pest-control', name: 'Pest Control' },
  { id: 'mechanic', name: 'Mechanic' },
  { id: 'other', name: 'Other' },
];

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
function EditForm({ form, onChange, onSubmit, onCancel, submitLabel }: {
  form: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
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
          <select name="category" value={form.category} onChange={onChange}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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
          <label>Community</label>
          <input name="estate_name" value={form.estate_name} onChange={onChange} placeholder="e.g. Ballymakenny Park" />
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

export function AdminPage() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [estates, setEstates] = useState<{ id: number; slug: string; name: string }[]>([]);
  const [estateFilter, setEstateFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'providers' | 'suggestions'>('providers');
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<number | null>(null);
  const [suggestionForm, setSuggestionForm] = useState(EMPTY_FORM);

  const switchTab = (t: 'providers' | 'suggestions') => {
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
      const [pRes, sRes, eRes] = await Promise.all([
        fetch('/api/providers'),
        fetch('/api/suggestions', { headers: { 'x-admin-token': token || '' } }),
        fetch('/api/estates'),
      ]);
      if (pRes.ok) setProviders(await pRes.json());
      if (sRes.ok) setSuggestions(await sRes.json());
      if (eRes.ok) setEstates(await eRes.json());
    } catch { /* server not running */ }
  };

  useEffect(() => { if (token) fetchData(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
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
      business_name: form.business_name || null,
      whatsapp: form.whatsapp || null,
      service_area: form.service_area || null,
      working_hours: form.working_hours || null,
      services: form.services.split(',').map(s => s.trim()).filter(Boolean),
    };

    const url = editingId ? `/api/admin/providers/${editingId}` : '/api/admin/providers';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(payload) });

    if (res.ok) {
      flash(editingId ? 'Provider updated' : 'Provider added');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchData();
    } else {
      flash('Error saving. Check required fields.');
    }
  };

  const handleEdit = (p: ProviderRow) => {
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
      estate_name: '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this provider permanently?')) return;
    const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) { flash('Provider deleted'); fetchData(); }
  };

  const handleApprove = async (id: number) => {
    const res = await fetch(`/api/admin/suggestions/${id}/approve`, { method: 'POST', headers: authHeaders });
    if (res.ok) { flash('Approved and added as provider'); fetchData(); setExpandedSuggestion(null); }
  };

  const handleDismiss = async (id: number) => {
    if (!confirm('Dismiss this suggestion?')) return;
    const res = await fetch(`/api/admin/suggestions/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) { flash('Suggestion dismissed'); fetchData(); setExpandedSuggestion(null); }
  };

  const handleEditSuggestion = (s: SuggestionRow) => {
    setEditingSuggestion(s.id);
    setSuggestionForm({
      name: s.name,
      business_name: '',
      category: s.category,
      description: s.note || '',
      phone: s.phone,
      whatsapp: '',
      service_area: s.service_area || '',
      working_hours: '',
      is_verified: false,
      services: '',
      estate_name: s.estate_name || '',
    });
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
      }),
    });
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

  // ===== LOGIN SCREEN =====
  if (!token) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <Lock size={24} />
          </div>
          <h1>Admin Access</h1>
          <p>Enter the password to manage Callbook providers</p>
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
    );
  }

  // ===== ADMIN DASHBOARD =====
  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h1>Callbook Admin</h1>
        </div>
        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>

      {/* Flash */}
      {message && <div className="admin-toast">{message}</div>}

      {/* Tabs */}
      <div className="admin-tab-bar">
        <button className={`admin-tab ${tab === 'providers' ? 'active' : ''}`} onClick={() => switchTab('providers')}>
          <Users size={15} />
          Providers
          <span className="admin-tab-badge">{providers.length}</span>
        </button>
        <button className={`admin-tab ${tab === 'suggestions' ? 'active' : ''}`} onClick={() => switchTab('suggestions')}>
          <Inbox size={15} />
          Suggestions
          {pendingSuggestions.length > 0 && <span className="admin-tab-badge">{pendingSuggestions.length}</span>}
        </button>
      </div>

      {/* ===== PROVIDERS TAB ===== */}
      {tab === 'providers' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>All Providers</h2>
            <button className="admin-primary-btn" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>
              <Plus size={15} />
              Add
            </button>
          </div>

          {/* Estate filter */}
          {estates.length > 1 && (
            <div className="admin-filter-bar">
              <select
                className="admin-filter-select"
                value={estateFilter}
                onChange={e => setEstateFilter(e.target.value)}
              >
                <option value="all">All communities ({providers.length})</option>
                {estates.map(est => (
                  <option key={est.id} value={String(est.id)}>
                    {est.name} ({providers.filter(p => p.estate_id === est.id).length})
                  </option>
                ))}
              </select>
            </div>
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
              />
            </div>
          )}

          <div className="admin-table">
            {filteredProviders.map(p => (
              <div key={p.id} className="admin-row">
                <div className="admin-row-avatar">
                  {(p.business_name || p.name).charAt(0)}
                </div>
                <div className="admin-row-content">
                  <div className="admin-row-title">
                    {p.business_name || p.name}
                    {p.is_verified && <BadgeCheck size={13} className="admin-verified" />}
                  </div>
                  <div className="admin-row-meta">
                    <span><Phone size={11} /> {p.phone}</span>
                    {p.service_area && <span><MapPin size={11} /> {p.service_area}</span>}
                    <span className="admin-row-cat">{CATEGORIES.find(c => c.id === p.category)?.name || p.category}</span>
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button className="admin-icon-btn" onClick={() => handleEdit(p)} aria-label="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="admin-icon-btn danger" onClick={() => handleDelete(p.id)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {filteredProviders.length === 0 && (
              <div className="admin-empty">
                <Users size={24} />
                <p>No providers yet</p>
                <span>Click "Add" to get started</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SUGGESTIONS TAB ===== */}
      {tab === 'suggestions' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Pending Suggestions</h2>
            <button className="admin-secondary-btn" onClick={fetchData}>Refresh</button>
          </div>
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
                      <span className="admin-row-cat">{CATEGORIES.find(c => c.id === s.category)?.name || s.category}</span>
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
                              <span className="admin-detail-value">{CATEGORIES.find(c => c.id === s.category)?.name || s.category}</span>
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
                                <span className="admin-detail-label">Community</span>
                                <span className="admin-detail-value">{s.estate_name}</span>
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
    </div>
  );
}

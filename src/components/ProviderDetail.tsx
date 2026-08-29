import { useEffect, useState } from 'react';
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Clock,
  BadgeCheck, Share2, Copy, X, Calendar, Star, Pencil
} from 'lucide-react';

/* Auto-linkify URLs in text */
function Linkify({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="detail-link">{part}</a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
import type { Provider } from '../types/provider';
import { getCallUrl, getWhatsAppUrl, shareProvider, copyPhone } from '../utils/share';
import { getInitials } from '../utils/initials';
import './ProviderDetail.css';

interface ProviderDetailProps {
  provider: Provider;
  categoryName?: string;
  onBack: () => void;
}

interface ProviderFeedback {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ProviderFeedbackSummary {
  count: number;
  average_rating: number;
  items: ProviderFeedback[];
}

export function ProviderDetail({ provider, categoryName, onBack }: ProviderDetailProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ProviderFeedbackSummary>({ count: 0, average_rating: 0, items: [] });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState('');
  const [showEditSuggestion, setShowEditSuggestion] = useState(false);
  const [editWebsite, setEditWebsite] = useState('');
  const [editForm, setEditForm] = useState({
    name: provider.name,
    business_name: provider.businessName || '',
    phone: provider.phone,
    whatsapp: provider.whatsapp || '',
    category: provider.category,
    description: provider.description,
    service_area: provider.serviceArea || '',
    working_hours: provider.workingHours || '',
    services: provider.services.join(', '),
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const displayName = provider.businessName || provider.name;
  const isPending = provider.status === 'pending';
  const categoryLabel = categoryName || provider.category.replace(/-/g, ' ');
  const hasEditChanges = [
    editForm.name !== provider.name,
    editForm.business_name !== (provider.businessName || ''),
    editForm.phone !== provider.phone,
    editForm.whatsapp !== (provider.whatsapp || ''),
    editForm.category !== provider.category,
    editForm.description !== provider.description,
    editForm.service_area !== (provider.serviceArea || ''),
    editForm.working_hours !== (provider.workingHours || ''),
    editForm.services !== provider.services.join(', '),
  ].some(Boolean);

  const loadFeedback = () => {
    if (isPending) return;
    fetch(`/api/providers/${provider.id}/feedback`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ProviderFeedbackSummary) => setFeedback(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadFeedback();
  }, [provider.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setShowEditSuggestion(false);
    setEditForm({
      name: provider.name,
      business_name: provider.businessName || '',
      phone: provider.phone,
      whatsapp: provider.whatsapp || '',
      category: provider.category,
      description: provider.description,
      service_area: provider.serviceArea || '',
      working_hours: provider.workingHours || '',
      services: provider.services.join(', '),
    });
  }, [provider]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleShare = async () => {
    const result = await shareProvider(provider);
    if (result === 'copied') showToast('Contact copied to clipboard');
    else if (result === 'shared') showToast('Shared successfully');
    else showToast('Could not share');
  };

  const handleCopy = async () => {
    const ok = await copyPhone(provider.phone);
    showToast(ok ? 'Phone number copied' : 'Could not copy');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      showToast('Choose a rating first');
      return;
    }
    if (!comment.trim()) {
      showToast('Write a short comment first');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/providers/${provider.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment, website }),
      });
      if (res.ok) {
        setRating(0);
        setComment('');
        setWebsite('');
        showToast('Feedback submitted');
        loadFeedback();
      } else if (res.status === 429) {
        showToast('Too many feedback submissions. Try later.');
      } else {
        showToast('Could not submit feedback');
      }
    } catch {
      showToast('No connection. Try later.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleEditSuggestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditChanges) return;
    setIsSubmittingEdit(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`/api/providers/${provider.id}/suggest-edits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, website: editWebsite }),
        signal: controller.signal,
      });

      if (res.ok) {
        setShowEditSuggestion(false);
        setEditWebsite('');
        showToast('Suggested edits sent for review');
      } else if (res.status === 429) {
        showToast('Too many suggestions. Try later.');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Could not submit suggested edits');
      }
    } catch {
      showToast('No connection. Try later.');
    } finally {
      window.clearTimeout(timeoutId);
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="detail">
      {/* WhatsApp-style top bar with avatar */}
      <div className="detail-topbar">
        <button className="detail-back-btn" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <div className="detail-topbar-avatar">
          {provider.image ? (
            <img src={provider.image} alt="" />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <div className="detail-topbar-info">
          <div className="detail-topbar-name">{displayName}</div>
          <div className="detail-topbar-status">
            {isPending ? 'Pending approval' : categoryLabel}
          </div>
        </div>
        <div className="detail-topbar-actions">
          <button className="detail-topbar-btn" onClick={handleShare} aria-label="Share">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Profile section */}
      <div className="detail-profile">
        <div className="detail-avatar-wrap">
          <div className="detail-avatar">
            {provider.image ? (
              <img src={provider.image} alt="" />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>
          {provider.isVerified && (
            <div className="detail-badge" aria-label="Verified provider">
              <BadgeCheck size={13} />
            </div>
          )}
        </div>
        <h1 className="detail-name">{displayName}</h1>
        {provider.businessName && provider.name !== provider.businessName && (
          <p className="detail-person">{provider.name}</p>
        )}
        {isPending && <span className="detail-pending-badge">Pending approval</span>}
        <span className="detail-category-badge">{categoryLabel}</span>
      </div>

      {/* Action row — like WhatsApp contact actions */}
      <div className="detail-action-row">
        <a href={getCallUrl(provider.phone)} className="detail-action-item">
          <div className="detail-action-icon">
            <Phone size={22} />
          </div>
          <span className="detail-action-label">Call</span>
        </a>
        {provider.whatsapp && (
          <a href={getWhatsAppUrl(provider.whatsapp)} target="_blank" rel="noopener noreferrer" className="detail-action-item">
            <div className="detail-action-icon detail-action-icon-wa">
              <MessageCircle size={22} />
            </div>
            <span className="detail-action-label detail-action-label-wa">Message</span>
          </a>
        )}
        <button className="detail-action-item" onClick={handleCopy}>
          <div className="detail-action-icon">
            <Copy size={20} />
          </div>
          <span className="detail-action-label">Copy</span>
        </button>
        {!isPending && (
          <button className="detail-action-item" onClick={() => setShowEditSuggestion(prev => !prev)}>
            <div className="detail-action-icon">
              <Pencil size={20} />
            </div>
            <span className="detail-action-label">Edit</span>
          </button>
        )}
        <button className="detail-action-item" onClick={handleShare}>
          <div className="detail-action-icon">
            <Share2 size={20} />
          </div>
          <span className="detail-action-label">Share</span>
        </button>
      </div>

      {/* Description */}
      <div className="detail-card">
        <h2 className="detail-card-title">About</h2>
        <p className="detail-desc"><Linkify text={provider.description} /></p>
      </div>

      {!isPending && showEditSuggestion && <div className="detail-card">
        <form className="detail-edit-form" onSubmit={handleEditSuggestionSubmit}>
          <input
            type="text"
            name="website"
            className="detail-honeypot"
            value={editWebsite}
            onChange={e => setEditWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input className="form-control" name="name" value={editForm.name} onChange={handleEditSuggestionChange} placeholder="Person name" />
          <input className="form-control" name="business_name" value={editForm.business_name} onChange={handleEditSuggestionChange} placeholder="Business name" />
          <input className="form-control" name="phone" value={editForm.phone} onChange={handleEditSuggestionChange} placeholder="Phone" />
          <input className="form-control" name="whatsapp" value={editForm.whatsapp} onChange={handleEditSuggestionChange} placeholder="WhatsApp" />
          <input className="form-control" name="service_area" value={editForm.service_area} onChange={handleEditSuggestionChange} placeholder="Service area" />
          <input className="form-control" name="working_hours" value={editForm.working_hours} onChange={handleEditSuggestionChange} placeholder="Working hours" />
          <textarea className="form-control form-textarea" name="description" value={editForm.description} onChange={handleEditSuggestionChange} rows={3} placeholder="Description or notes" />
          <input className="form-control" name="services" value={editForm.services} onChange={handleEditSuggestionChange} placeholder="Services, comma separated" />
          <div className="detail-edit-actions">
            <button type="button" className="detail-edit-cancel" onClick={() => setShowEditSuggestion(false)}>
              Cancel
            </button>
            <button type="submit" className="detail-feedback-submit" disabled={isSubmittingEdit || !hasEditChanges}>
              {isSubmittingEdit ? 'Submitting...' : 'Submit suggested edits'}
            </button>
          </div>
        </form>
      </div>}

      {/* Contact & info */}
      <div className="detail-card">
        <h2 className="detail-card-title">Contact Info</h2>
        <div className="detail-info-row">
          <Phone size={18} className="detail-info-icon" />
          <div className="detail-info-content">
            <div className="detail-info-value">{provider.phone}</div>
            <div className="detail-info-label">Phone</div>
          </div>
        </div>
        {provider.serviceArea && (
          <div className="detail-info-row">
            <MapPin size={18} className="detail-info-icon" />
            <div className="detail-info-content">
              <div className="detail-info-value">{provider.serviceArea}</div>
              <div className="detail-info-label">Service area</div>
            </div>
          </div>
        )}
        {provider.workingHours && (
          <div className="detail-info-row">
            <Clock size={18} className="detail-info-icon" />
            <div className="detail-info-content">
              <div className="detail-info-value">{provider.workingHours}</div>
              <div className="detail-info-label">Working hours</div>
            </div>
          </div>
        )}
        {provider.lastUpdated && (
          <div className="detail-info-row">
            <Calendar size={18} className="detail-info-icon" />
            <div className="detail-info-content">
              <div className="detail-info-value">{new Date(provider.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="detail-info-label">Last updated</div>
            </div>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="detail-card">
        <h2 className="detail-card-title">Services</h2>
        <div className="detail-tags">
          {provider.services.map(s => (
            <span key={s} className="detail-tag">{s}</span>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {!isPending && <div className="detail-card">
        <div className="detail-feedback-header">
          <h2 className="detail-card-title">Feedback</h2>
          {feedback.count > 0 && (
            <span className="detail-rating-summary">
              <Star size={13} fill="currentColor" />
              {feedback.average_rating} ({feedback.count})
            </span>
          )}
        </div>
        <form className="detail-feedback-form" onSubmit={handleFeedbackSubmit}>
          <input
            type="text"
            name="website"
            className="detail-honeypot"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="detail-star-row" aria-label="Rating">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`detail-star-btn ${value <= rating ? 'active' : ''}`}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
              >
                <Star size={22} fill={value <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Share a short comment about this provider"
            required
          />
          <button type="submit" className="detail-feedback-submit" disabled={isSubmittingFeedback || rating < 1 || !comment.trim()}>
            {isSubmittingFeedback ? 'Submitting...' : 'Submit feedback'}
          </button>
        </form>
        {feedback.items.length > 0 && (
          <div className="detail-feedback-list">
            {feedback.items.map(item => (
              <div key={item.id} className="detail-feedback-item">
                <div className="detail-feedback-meta">
                  <div className="detail-feedback-stars">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} size={10} fill={index < item.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span>{new Date(item.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {item.comment && <p>{item.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Disclaimer */}
      <p className="detail-note">
        Estate Contacts is a directory only. Verify pricing and availability directly with the provider.
      </p>

      {/* Toast */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

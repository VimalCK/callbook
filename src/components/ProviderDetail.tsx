import { useEffect, useState } from 'react';
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Clock,
  BadgeCheck, Share2, Copy, X, Calendar, Star
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

export function ProviderDetail({ provider, onBack }: ProviderDetailProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ProviderFeedbackSummary>({ count: 0, average_rating: 0, items: [] });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const displayName = provider.businessName || provider.name;

  const loadFeedback = () => {
    fetch(`/api/providers/${provider.id}/feedback`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ProviderFeedbackSummary) => setFeedback(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadFeedback();
  }, [provider.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {provider.isVerified ? 'Verified provider' : provider.category.replace('-', ' ')}
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
        <span className="detail-category-badge">{provider.category.replace('-', ' ')}</span>
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
      <div className="detail-card">
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
      </div>

      {/* Disclaimer */}
      <p className="detail-note">
        Callbook is a directory only. Verify pricing and availability directly with the provider.
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

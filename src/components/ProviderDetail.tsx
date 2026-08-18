import { useState } from 'react';
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Clock,
  BadgeCheck, Share2, Copy, X, Calendar
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
import './ProviderDetail.css';

interface ProviderDetailProps {
  provider: Provider;
  onBack: () => void;
}

export function ProviderDetail({ provider, onBack }: ProviderDetailProps) {
  const [toast, setToast] = useState<string | null>(null);
  const displayName = provider.businessName || provider.name;

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
            displayName.charAt(0)
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
              <span>{displayName.charAt(0)}</span>
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

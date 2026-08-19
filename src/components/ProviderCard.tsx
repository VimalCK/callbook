import { Phone, MessageCircle, BadgeCheck, MapPin } from 'lucide-react';
import type { Provider } from '../types/provider';
import { getCallUrl, getWhatsAppUrl } from '../utils/share';
import { getInitials } from '../utils/initials';
import './ProviderCard.css';

interface ProviderCardProps {
  provider: Provider;
  categoryName?: string;
  onViewDetails: (provider: Provider) => void;
}

export function ProviderCard({ provider, categoryName, onViewDetails }: ProviderCardProps) {
  const displayName = provider.businessName || provider.name;
  const label = categoryName || provider.category.replace(/-/g, ' ');

  return (
    <article className="pcard" onClick={() => onViewDetails(provider)} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onViewDetails(provider); }}
    >
      {/* Circular avatar */}
      <div className="pcard-avatar">
        {provider.image ? (
          <img src={provider.image} alt="" loading="lazy" />
        ) : (
          <span className="pcard-initial">{getInitials(displayName)}</span>
        )}
        {provider.isVerified && (
          <span className="pcard-verified" aria-label="Verified"><BadgeCheck size={11} /></span>
        )}
      </div>

      {/* Content */}
      <div className="pcard-content">
        <div className="pcard-top-row">
          <h3 className="pcard-name">{displayName}</h3>
        </div>
        {provider.businessName && provider.name !== provider.businessName && (
          <p className="pcard-desc">{provider.name}</p>
        )}
        {(provider.phone || provider.whatsapp) && (
          <span className="pcard-area">
            <Phone size={10} />
            {provider.phone || provider.whatsapp}
          </span>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="pcard-quick-actions" onClick={e => e.stopPropagation()}>
        <a href={getCallUrl(provider.phone)} className="pcard-quick-btn" aria-label={`Call ${provider.name}`}>
          <Phone size={18} />
        </a>
        {provider.whatsapp && (
          <a
            href={getWhatsAppUrl(provider.whatsapp)}
            className="pcard-quick-btn pcard-quick-btn-wa"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${provider.name}`}
          >
            <MessageCircle size={18} />
          </a>
        )}
      </div>
    </article>
  );
}

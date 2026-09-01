import { useEffect, useRef, useState } from 'react';
import { MapPin, Phone, MessageCircle, Shield, RefreshCw, Heart, Send, ChevronDown } from 'lucide-react';
import './AboutPage.css';

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;

interface AboutPageProps {
  onSwitchEstate: () => void;
  focusFeedback?: boolean;
  onFeedbackFocused?: () => void;
}

const FEEDBACK_TYPES = [
  { id: 'issue', name: 'Issue' },
  { id: 'feature', name: 'Feature request' },
  { id: 'correction', name: 'Correction' },
  { id: 'other', name: 'Other' },
];

export function AboutPage({ onSwitchEstate, focusFeedback = false, onFeedbackFocused }: AboutPageProps) {
  const feedbackRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [feedbackType, setFeedbackType] = useState('issue');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!typeDropdownOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [typeDropdownOpen]);

  useEffect(() => {
    if (!focusFeedback) return;

    window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      messageRef.current?.focus({ preventScroll: true });
      onFeedbackFocused?.();
    }, 0);
  }, [focusFeedback, onFeedbackFocused]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setStatus('Please enter a short message.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');

    try {
      const res = await fetch('/api/app-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: feedbackType,
          message,
          website,
        }),
      });

      if (res.ok) {
        setMessage('');
        setWebsite('');
        setFeedbackType('issue');
        setStatus('Thanks. Your feedback was sent.');
      } else if (res.status === 429) {
        setStatus('Too many feedback submissions. Please try later.');
      } else {
        const data = await res.json().catch(() => null);
        setStatus(data?.error || 'Could not send feedback.');
      }
    } catch {
      setStatus('No connection. Try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFeedbackType = FEEDBACK_TYPES.find(item => item.id === feedbackType) || FEEDBACK_TYPES[0];

  return (
    <div className="page about">
      <div className="about-profile">
        <div className="about-icon">
          <MapPin size={28} />
        </div>
        <h2>Estate Contacts</h2>
        <p className="about-sub">Your estate's trusted service directory</p>
        <span className="about-version">Version {__APP_VERSION__} ({__APP_COMMIT__})</span>
      </div>

      <div className="about-card">
        <h3>About</h3>
        <p>
          A simple directory of trusted local service providers for your residential estate.
          Find plumbers, electricians, cleaners, and more — recommended by your neighbors.
        </p>
      </div>

      <div className="about-card">
        <h3>How it works</h3>
        <div className="about-steps">
          <div className="about-step">
            <span className="step-num">1</span>
            <p><strong>Search or browse</strong> for the service you need</p>
          </div>
          <div className="about-step">
            <span className="step-num">2</span>
            <p><strong>View details</strong> — services, area, availability</p>
          </div>
          <div className="about-step">
            <span className="step-num">3</span>
            <p><strong>Contact directly</strong> via phone or WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="about-card">
        <h3>Important</h3>
        <div className="about-notice">
          <Shield size={16} />
          <p>
            Estate Contacts is a contact directory only. It does not handle payments, bookings, or reviews.
            Always verify pricing and availability directly.
          </p>
        </div>
      </div>

      <div className="about-card">
        <h3>Contact methods</h3>
        <div className="about-methods">
          <div className="method">
            <div className="method-icon"><Phone size={16} /></div>
            <span className="method-text">Direct phone call</span>
          </div>
          <div className="method">
            <div className="method-icon"><MessageCircle size={16} /></div>
            <span className="method-text">WhatsApp message</span>
          </div>
        </div>
      </div>

      <div className="about-card">
        <h3>Estate</h3>
        <p style={{ marginBottom: '12px' }}>Switch to a different estate's directory.</p>
        <button className="about-switch-btn" onClick={onSwitchEstate}>
          <RefreshCw size={14} />
          <span>Switch Estate</span>
        </button>
      </div>

      <div className="about-card" ref={feedbackRef}>
        <h3>Send Feedback</h3>
        <p className="about-feedback-copy">Report an issue, suggest a feature, or tell us what can be improved.</p>
        <form className="about-feedback-form" onSubmit={handleSubmitFeedback}>
          <input
            type="text"
            className="about-honeypot"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="combobox-wrap" ref={typeDropdownRef}>
            <button type="button" className="combobox-trigger form-select-trigger" onClick={() => setTypeDropdownOpen(!typeDropdownOpen)} aria-label="Feedback type" aria-expanded={typeDropdownOpen}>
              <span>{selectedFeedbackType.name}</span>
              <ChevronDown size={16} className={`combobox-arrow-btn ${typeDropdownOpen ? 'rotated' : ''}`} />
            </button>
            {typeDropdownOpen && (
              <div className="combobox-dropdown">
                {FEEDBACK_TYPES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`combobox-option ${item.id === feedbackType ? 'active' : ''}`}
                    onClick={() => { setFeedbackType(item.id); setTypeDropdownOpen(false); }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={messageRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Write your feedback"
            required
          />
          <button className="about-feedback-submit" type="submit" disabled={isSubmitting || message.trim().length < 5}>
            <Send size={14} />
            <span>{isSubmitting ? 'Sending...' : 'Send Feedback'}</span>
          </button>
          {status && <p className="about-feedback-status">{status}</p>}
        </form>
      </div>

      <footer className="about-footer">
        <p>
          Built with <Heart className="about-heart" size={12} fill="currentColor" /> for neighbors who help each other.
        </p>
      </footer>
    </div>
  );
}

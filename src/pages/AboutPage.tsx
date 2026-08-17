import { MapPin, Phone, MessageCircle, Shield, RefreshCw } from 'lucide-react';
import './AboutPage.css';

interface AboutPageProps {
  onSwitchEstate: () => void;
}

export function AboutPage({ onSwitchEstate }: AboutPageProps) {
  return (
    <div className="page about">
      <div className="about-profile">
        <div className="about-icon">
          <MapPin size={28} />
        </div>
        <h2>Callbook</h2>
        <p className="about-sub">Your community's trusted service directory</p>
        <span className="about-version">Version 1.0</span>
      </div>

      <div className="about-card">
        <h3>About</h3>
        <p>
          A simple directory of trusted local service providers for your residential community.
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
            Callbook is a contact directory only. It does not handle payments, bookings, or reviews.
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
        <h3>Community</h3>
        <p style={{ marginBottom: '12px' }}>Switch to a different community's directory.</p>
        <button className="about-switch-btn" onClick={onSwitchEstate}>
          <RefreshCw size={14} />
          <span>Switch community</span>
        </button>
      </div>

      <footer className="about-footer">
        <p>Made for the community</p>
      </footer>
    </div>
  );
}

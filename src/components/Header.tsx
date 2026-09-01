import { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './Header.css';

type Tab = 'home' | 'suggest' | 'about';

interface HeaderProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onSearchToggle?: () => void;
  onAbout?: () => void;
  onFeedback?: () => void;
  onSwitchEstate?: () => void;
  onLogout?: () => void;
  showTabs?: boolean;
  estateName?: string;
}

export function Header({ activeTab = 'home', onTabChange, onSearchToggle, onAbout, onFeedback, onSwitchEstate, onLogout, showTabs = true, estateName }: HeaderProps) {
  const isOnline = useOnlineStatus();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const hasMenuItems = onAbout || onFeedback || onSwitchEstate || onLogout;

  return (
    <header className="header">
      {!isOnline && (
        <div className="offline-banner" role="status" aria-live="polite">
          <WifiOff size={12} />
          <span>No connection</span>
        </div>
      )}
      <div className="header-top">
        <div className="header-brand">
          <h1 className="header-title">Estate Contacts</h1>
          {estateName && (
            <span className="header-estate">
              {estateName}
            </span>
          )}
        </div>
        <div className="header-actions">
          {onSearchToggle && (
            <button className="header-btn" onClick={onSearchToggle} aria-label="Search">
              <Search size={20} />
            </button>
          )}
          {hasMenuItems && (
            <div className="header-menu-wrap" ref={menuRef}>
              <button className="header-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="More options" aria-expanded={menuOpen}>
                <MoreVertical size={20} />
              </button>
              {menuOpen && (
                <div className="header-menu" role="menu">
                  {onAbout && (
                    <button className="header-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onAbout(); }}>
                      <span>About</span>
                    </button>
                  )}
                  {onSwitchEstate && (
                    <button className="header-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onSwitchEstate(); }}>
                      <span>Change Estate</span>
                    </button>
                  )}
                  {onFeedback && (
                    <button className="header-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onFeedback(); }}>
                      <span>Send Feedback</span>
                    </button>
                  )}
                  {onLogout && (
                    <button className="header-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onLogout(); }}>
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showTabs && onTabChange && (
        <nav className="header-tabs" aria-label="Main navigation">
          <button
            className={`header-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
            aria-current={activeTab === 'home' ? 'page' : undefined}
          >
            Services
          </button>
          <button
            className={`header-tab ${activeTab === 'suggest' ? 'active' : ''}`}
            onClick={() => onTabChange('suggest')}
            aria-current={activeTab === 'suggest' ? 'page' : undefined}
          >
            Suggest
          </button>
        </nav>
      )}
    </header>
  );
}

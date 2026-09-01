import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ProviderDetail } from './components/ProviderDetail';
import { HomePage } from './pages/HomePage';
import { SuggestPage } from './pages/SuggestPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { EstatePicker } from './pages/EstatePicker';
import { useProviders } from './hooks/useProviders';
import {
  addRecentlyViewed,
  getSelectedEstate,
  setSelectedEstate,
  clearSelectedEstate,
  getSubmittedSuggestionIds,
  removeSubmittedSuggestionIds,
} from './utils/storage';
import type { Provider } from './types/provider';

interface SuggestionStatus {
  id: number;
  name: string;
  estate_name: string | null;
  status: string;
}

type Tab = 'home' | 'suggest' | 'about' | 'admin';

const mapProvider = (p: Record<string, unknown>): Provider => ({
  id: String(p.id),
  estateSlug: (p.estate_slug as string) || undefined,
  name: p.name as string,
  businessName: (p.business_name as string) || undefined,
  category: p.category as string,
  description: p.description as string,
  phone: p.phone as string,
  whatsapp: (p.whatsapp as string) || undefined,
  serviceArea: (p.service_area as string) || undefined,
  address: (p.address as string) || undefined,
  workingHours: (p.working_hours as string) || undefined,
  image: (p.image as string) || undefined,
  isVerified: Boolean(p.is_verified),
  status: (p.status as string) || 'approved',
  lastUpdated: (p.updated_at as string) || undefined,
  services: (p.services as string[]) || [],
});

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [estate, setEstate] = useState<string | null>(getSelectedEstate());
  const [estateName, setEstateName] = useState<string>('');
  const [focusFeedback, setFocusFeedback] = useState(false);
  const [approvedSuggestions, setApprovedSuggestions] = useState<SuggestionStatus[]>([]);
  const { providers, categories, isLoading, error, refetch } = useProviders(estate);

  useEffect(() => {
    const ids = getSubmittedSuggestionIds();
    if (ids.length === 0) return;

    fetch(`/api/suggestions/status?ids=${ids.join(',')}`)
      .then(r => r.ok ? r.json() : [])
      .then((statuses: SuggestionStatus[]) => {
        const existingIds = new Set(statuses.map(item => item.id));
        const missingIds = ids.filter(id => !existingIds.has(id));
        if (missingIds.length > 0) removeSubmittedSuggestionIds(missingIds);

        const approved = statuses.filter(item => item.status === 'approved');
        if (approved.length > 0) setApprovedSuggestions(approved);
      })
      .catch(() => {});
  }, []);

  const dismissApprovedSuggestion = () => {
    removeSubmittedSuggestionIds(approvedSuggestions.map(item => item.id));
    setApprovedSuggestions([]);
  };

  const approvedNames = approvedSuggestions.map(item => item.name);
  const approvalTitle = approvedSuggestions.length === 1
    ? 'Your suggestion was approved'
    : `${approvedSuggestions.length} of your suggestions were approved`;
  const approvalMessage = approvedSuggestions.length === 1
    ? `${approvedNames[0]} is now listed in Estate Contacts.`
    : `${approvedNames.slice(0, 2).join(', ')}${approvedNames.length > 2 ? `, and ${approvedNames.length - 2} more` : ''} are now listed in Estate Contacts.`;

  const approvalBanner = approvedSuggestions.length > 0 && (
    <div className="approval-banner" role="status">
      <div>
        <strong>{approvalTitle}</strong>
        <span>{approvalMessage}</span>
      </div>
      <button type="button" onClick={dismissApprovedSuggestion}>OK</button>
    </div>
  );

  // Fetch estate display name
  useEffect(() => {
    if (estate) {
      fetch(`/api/estates/${estate}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setEstateName([data.name, data.description].filter(Boolean).join(', '));
        })
        .catch(() => {});
    } else {
      setEstateName('');
    }
  }, [estate]);

  useEffect(() => {
    if (!estate) return;

    fetch('/api/analytics/estate-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estate }),
    }).catch(() => {});
  }, [estate]);

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setTab('admin');
      return;
    }
    const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    const contactMatch = path.match(/^contact\/(\d+)$/);
    if (contactMatch) {
      fetch(`/api/providers/${contactMatch[1]}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const provider = mapProvider(data);
          if (provider.estateSlug) {
            setSelectedEstate(provider.estateSlug);
            setEstate(provider.estateSlug);
          }
          addRecentlyViewed(provider.id);
          fetch('/api/analytics/provider-open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider_id: Number(provider.id) }),
          }).catch(() => {});
          setSelectedProvider(provider);
        })
        .catch(() => {});
      return;
    }

    // Check if URL has an estate slug (e.g., /ballymakenny-park)
    if (path && path !== 'admin' && !path.startsWith('api')) {
      // Validate it's a real estate by fetching
      fetch(`/api/estates/${path}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.slug) {
            setSelectedEstate(data.slug);
            setEstate(data.slug);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSelectEstate = useCallback((slug: string) => {
    setSelectedEstate(slug);
    setEstate(slug);
  }, []);

  const handleSuggestionSubmitted = useCallback((slug: string) => {
    setSelectedEstate(slug);
    setEstate(slug);
    setTab('home');
    setTimeout(refetch, 0);
  }, [refetch]);

  const handleSwitchEstate = useCallback(() => {
    clearSelectedEstate();
    setEstate(null);
    setSelectedProvider(null);
    setTab('home');
  }, []);

  const handleViewProvider = useCallback((provider: Provider) => {
    addRecentlyViewed(provider.id);
    fetch('/api/analytics/provider-open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: Number(provider.id) }),
    }).catch(() => {});
    setSelectedProvider(provider);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedProvider(null);
  }, []);

  const handleTabChange = useCallback((newTab: 'home' | 'suggest' | 'about') => {
    setTab(newTab);
    setSelectedProvider(null);
  }, []);

  const handleOpenFeedback = useCallback(() => {
    setSelectedProvider(null);
    setTab('about');
    setFocusFeedback(true);
  }, []);

  // Admin page — full screen, no estate filter needed
  if (tab === 'admin') {
    return (
      <div className="app">
        <main id="main-content">
          <AdminPage />
        </main>
      </div>
    );
  }

  // No estate selected — show picker or suggest page
  if (!estate) {
    if (tab === 'suggest') {
      return (
        <div className="app">
          {approvalBanner}
          <Header activeTab="suggest" onTabChange={(t) => { if (t === 'home') setTab('home'); }} showTabs={false} />
          <main id="main-content">
            <SuggestPage estate="" onSubmitted={handleSuggestionSubmitted} />
          </main>
          <BottomNav active="suggest" cancelMode onChange={(t) => { if (t === 'home') setTab('home'); }} />
        </div>
      );
    }
    return (
      <div className="app">
        {approvalBanner}
        <main id="main-content">
          <EstatePicker onSelect={handleSelectEstate} onSuggest={() => setTab('suggest')} />
        </main>
      </div>
    );
  }

  // Provider detail — full screen
  if (selectedProvider) {
    return (
      <div className="app">
        {approvalBanner}
        <main id="main-content">
          <ProviderDetail provider={selectedProvider} categoryName={categories.find(c => c.id === selectedProvider.category)?.name} onBack={handleBack} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {approvalBanner}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header activeTab={tab} onTabChange={handleTabChange} onAbout={() => handleTabChange('about')} onFeedback={handleOpenFeedback} onSwitchEstate={handleSwitchEstate} showTabs={false} estateName={estateName} />
      <main id="main-content">
        {tab === 'home' && (
          <HomePage
            providers={providers}
            categories={categories}
            isLoading={isLoading}
            error={error}
            onRefetch={refetch}
            onViewProvider={handleViewProvider}
            estate={estate}
          />
        )}
        {tab === 'suggest' && <SuggestPage estate={estate} onSubmitted={handleSuggestionSubmitted} />}
        {tab === 'about' && <AboutPage onSwitchEstate={handleSwitchEstate} focusFeedback={focusFeedback} onFeedbackFocused={() => setFocusFeedback(false)} />}
      </main>
      <BottomNav active={tab === 'about' ? 'home' : tab} onChange={handleTabChange} />
    </div>
  );
}

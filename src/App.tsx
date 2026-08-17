import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ProviderDetail } from './components/ProviderDetail';
import { HomePage } from './pages/HomePage';
import { SuggestPage } from './pages/SuggestPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { EstatePicker } from './pages/EstatePicker';
import { useProviders } from './hooks/useProviders';
import { addRecentlyViewed, getSelectedEstate, setSelectedEstate, clearSelectedEstate } from './utils/storage';
import type { Provider } from './types/provider';

type Tab = 'home' | 'suggest' | 'about' | 'admin';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [estate, setEstate] = useState<string | null>(getSelectedEstate());
  const [estateCount, setEstateCount] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const { providers, categories, isLoading, error, refetch } = useProviders(estate);

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setTab('admin');
    }
    // Check if URL has an estate slug (e.g., /ballymakenny-park)
    const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (path && path !== 'admin' && !path.startsWith('api')) {
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
    // If no estate selected, check how many exist
    if (!getSelectedEstate()) {
      fetch('/api/estates')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setEstateCount(data.length);
          if (data.length === 1) {
            // Auto-select the only estate
            setSelectedEstate(data[0].slug);
            setEstate(data[0].slug);
          } else if (data.length > 1) {
            setShowPicker(true);
          }
          // If 0 estates, just show the main app with empty state
        })
        .catch(() => { setEstateCount(0); });
    }
  }, []);

  const handleSelectEstate = useCallback((slug: string) => {
    setSelectedEstate(slug);
    setEstate(slug);
    setShowPicker(false);
  }, []);

  const handleSwitchEstate = useCallback(() => {
    clearSelectedEstate();
    setEstate(null);
    setSelectedProvider(null);
    setTab('home');
    setShowPicker(true);
  }, []);

  const handleViewProvider = useCallback((provider: Provider) => {
    addRecentlyViewed(provider.id);
    setSelectedProvider(provider);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedProvider(null);
  }, []);

  const handleTabChange = useCallback((newTab: 'home' | 'suggest' | 'about') => {
    setTab(newTab);
    setSelectedProvider(null);
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

  // Show estate picker only when multiple estates exist and none selected
  if (showPicker && !estate) {
    return (
      <div className="app">
        <main id="main-content">
          <EstatePicker onSelect={handleSelectEstate} />
        </main>
      </div>
    );
  }

  // Provider detail — full screen
  if (selectedProvider) {
    return (
      <div className="app">
        <main id="main-content">
          <ProviderDetail provider={selectedProvider} onBack={handleBack} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header activeTab={tab} onTabChange={handleTabChange} onSwitchEstate={handleSwitchEstate} showTabs={true} />
      <main id="main-content">
        {tab === 'home' && (
          <HomePage
            providers={providers}
            categories={categories}
            isLoading={isLoading}
            error={error}
            onRefetch={refetch}
            onViewProvider={handleViewProvider}
          />
        )}
        {tab === 'suggest' && <SuggestPage estate={estate} />}
        {tab === 'about' && <AboutPage onSwitchEstate={handleSwitchEstate} />}
      </main>
    </div>
  );
}

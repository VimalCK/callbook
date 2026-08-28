import { BookOpen, PlusCircle, Send } from 'lucide-react';
import './BottomNav.css';

interface BottomNavProps {
  active: 'home' | 'suggest' | 'about';
  onChange: (tab: 'home' | 'suggest' | 'about') => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const handleSuggestClick = () => {
    if (active !== 'suggest') {
      onChange('suggest');
      return;
    }

    const form = document.getElementById('suggest-form') as HTMLFormElement | null;
    form?.requestSubmit();
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        className={`nav-btn ${active === 'home' ? 'active' : ''}`}
        onClick={() => onChange('home')}
        aria-current={active === 'home' ? 'page' : undefined}
      >
        <BookOpen size={21} strokeWidth={active === 'home' ? 2.2 : 1.8} />
        <span>Services</span>
      </button>
      <button
        className={`nav-btn ${active === 'suggest' ? 'active' : ''}`}
        onClick={handleSuggestClick}
        type="button"
        aria-current={active === 'suggest' ? 'page' : undefined}
      >
        {active === 'suggest' ? (
          <Send size={20} strokeWidth={2.2} />
        ) : (
          <PlusCircle size={20} strokeWidth={1.8} />
        )}
        <span>{active === 'suggest' ? 'Submit' : 'Suggest Service Provider'}</span>
      </button>
    </nav>
  );
}

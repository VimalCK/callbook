import { BookOpen, PlusCircle } from 'lucide-react';
import './BottomNav.css';

interface BottomNavProps {
  active: 'home' | 'suggest' | 'about';
  onChange: (tab: 'home' | 'suggest' | 'about') => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
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
        onClick={() => onChange('suggest')}
        aria-current={active === 'suggest' ? 'page' : undefined}
      >
        <PlusCircle size={20} strokeWidth={active === 'suggest' ? 2.2 : 1.8} />
        <span>Suggest</span>
      </button>
    </nav>
  );
}

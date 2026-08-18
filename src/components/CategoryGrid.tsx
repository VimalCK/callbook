import { useRef, useState, useCallback } from 'react';
import {
  Wrench, Zap, Hammer, Paintbrush, SprayCan,
  Flower2, Settings, Bug, Car, MoreHorizontal
} from 'lucide-react';
import type { Category } from '../types/provider';
import './CategoryGrid.css';

const defaultIcon = <MoreHorizontal size={16} />;

const categoryIcons: Record<string, React.ReactNode> = {
  'plumber': <Wrench size={16} />,
  'electrician': <Zap size={16} />,
  'carpenter': <Hammer size={16} />,
  'painter': <Paintbrush size={16} />,
  'cleaning': <SprayCan size={16} />,
  'gardener': <Flower2 size={16} />,
  'appliance-repair': <Settings size={16} />,
  'pest-control': <Bug size={16} />,
  'mechanic': <Car size={16} />,
  'other': <MoreHorizontal size={16} />,
};

interface CategoryGridProps {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (categoryId: string) => void;
}

export function CategoryGrid({ categories, activeCategory, onSelect }: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
    dragMoved.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeft - walk;
    if (Math.abs(walk) > 5) dragMoved.current = true;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleChipClick = (categoryId: string) => {
    // Don't fire click if user was dragging
    if (dragMoved.current) return;
    onSelect(categoryId);
  };

  return (
    <div className="categories-wrap">
      <div
        ref={scrollRef}
        className="categories-scroll"
        role="group"
        aria-label="Filter by service category"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleChipClick(cat.id)}
            aria-pressed={activeCategory === cat.id}
          >
            <span className="cat-chip-icon">{categoryIcons[cat.id] || defaultIcon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

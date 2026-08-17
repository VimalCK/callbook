const RECENT_SEARCHES_KEY = 'callbook_recent_searches';
const RECENT_VIEWED_KEY = 'callbook_recent_viewed';
const ESTATE_KEY = 'callbook_estate';
const MAX_RECENT = 5;

export function getSelectedEstate(): string | null {
  return localStorage.getItem(ESTATE_KEY);
}

export function setSelectedEstate(slug: string): void {
  localStorage.setItem(ESTATE_KEY, slug);
}

export function clearSelectedEstate(): void {
  localStorage.removeItem(ESTATE_KEY);
}

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;
  const recent = getRecentSearches().filter(s => s !== trimmed);
  recent.unshift(trimmed);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentlyViewed(providerId: string): void {
  const recent = getRecentlyViewed().filter(id => id !== providerId);
  recent.unshift(providerId);
  localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

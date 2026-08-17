import type { Provider } from '../types/provider';
import { searchSynonyms } from '../data/searchSynonyms';

export function searchProviders(providers: Provider[], query: string): Provider[] {
  const q = query.toLowerCase().trim();
  if (!q) return providers;

  // Check if query matches a synonym → get category
  const synonymCategory = searchSynonyms[q] ||
    Object.entries(searchSynonyms).find(([key]) => q.includes(key))?.[1];

  return providers.filter(provider => {
    const searchableText = [
      provider.name,
      provider.businessName,
      provider.category,
      provider.description,
      provider.serviceArea,
      ...provider.services,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Direct text match
    if (searchableText.includes(q)) return true;

    // Synonym match
    if (synonymCategory && provider.category === synonymCategory) return true;

    // Partial word matching
    const words = q.split(/\s+/);
    return words.every(word => searchableText.includes(word));
  });
}

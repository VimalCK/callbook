export interface Provider {
  id: string;
  name: string;
  businessName?: string;
  category: string;
  description: string;
  phone: string;
  whatsapp?: string;
  serviceArea?: string;
  address?: string;
  workingHours?: string;
  image?: string;
  isVerified?: boolean;
  status?: 'approved' | 'pending' | string;
  lastUpdated?: string;
  services: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  providerCount: number;
}

export type SearchSuggestion = {
  term: string;
  category: string;
};

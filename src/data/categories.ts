import type { Category } from '../types/provider';
import { providers } from './providers';

export const categories: Category[] = [
  { id: 'plumber', name: 'Plumbing', description: 'Pipes, leaks, taps, tanks' },
  { id: 'electrician', name: 'Electrical', description: 'Wiring, switches, appliances' },
  { id: 'carpenter', name: 'Carpentry', description: 'Furniture, doors, wood work' },
  { id: 'painter', name: 'Painting', description: 'Interior, exterior, texture' },
  { id: 'cleaning', name: 'Cleaning', description: 'Home, deep clean, regular' },
  { id: 'gardener', name: 'Gardening', description: 'Plants, landscaping, lawn' },
  { id: 'appliance-repair', name: 'Appliances', description: 'AC, fridge, washing machine' },
  { id: 'pest-control', name: 'Pest Control', description: 'Termites, cockroaches, rats' },
  { id: 'mechanic', name: 'Mechanic', description: 'Car, bike, breakdown' },
  { id: 'other', name: 'Other', description: 'Locks, hardware, misc' },
].map(cat => ({
  ...cat,
  providerCount: providers.filter(p => p.category === cat.id).length,
}));

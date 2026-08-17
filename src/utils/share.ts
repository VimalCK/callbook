import type { Provider } from '../types/provider';

export async function shareProvider(provider: Provider): Promise<'shared' | 'copied' | 'error'> {
  const text = `${provider.businessName || provider.name}\n${provider.description}\nPhone: ${provider.phone}${provider.whatsapp ? `\nWhatsApp: https://wa.me/${provider.whatsapp}` : ''}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: provider.businessName || provider.name, text });
      return 'shared';
    } catch {
      return 'error';
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'error';
  }
}

export async function copyPhone(phone: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(phone);
    return true;
  } catch {
    return false;
  }
}

export function getCallUrl(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

export function getWhatsAppUrl(whatsapp: string): string {
  return `https://wa.me/${whatsapp}`;
}

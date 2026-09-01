import type { Provider } from '../types/provider';

export async function shareProvider(provider: Provider): Promise<'shared' | 'copied' | 'error'> {
  const title = provider.businessName || provider.name;
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const url = `${appUrl.replace(/\/$/, '')}/contact/${provider.id}`;
  const text = `${title}\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
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

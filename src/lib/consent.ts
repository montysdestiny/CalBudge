// Cookie consent for Google Analytics. GA (which sets cookies) only loads
// after the visitor accepts; Vercel Analytics is cookieless and always on.

const GA_ID = 'G-7XMBD8WC8J';
const STORAGE_KEY = 'calbudge-cookie-consent';

export type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't persist.
  }
  if (consent === 'granted') loadGoogleAnalytics();
  else window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
}

export function loadGoogleAnalytics() {
  // Already loaded this session (e.g. re-accepted after declining).
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  window.dataLayer = window.dataLayer || [];
  // gtag.js expects the raw `arguments` object, not a rest-params array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  // Drop the URL hash: shared plan links carry the user's inputs there
  // (lib/share.ts) and they must not end up in analytics.
  window.gtag('config', GA_ID, {
    page_location: window.location.origin + window.location.pathname + window.location.search,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

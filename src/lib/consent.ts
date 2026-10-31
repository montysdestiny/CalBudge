// Cookie consent for Google Analytics. GA (which sets cookies) only loads
// after the visitor accepts; Vercel Analytics is cookieless and always on.

const GA_ID = 'G-7XMBD8WC8J';
export const CONSENT_STORAGE_KEY = 'calbudge-cookie-consent';

export type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't persist.
  }
  if (consent === 'granted') loadGoogleAnalytics();
  else {
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    // Consent mode alone would keep sending cookieless pings for the rest of
    // this page view; this opt-out flag stops gtag.js sending anything.
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
    deleteGoogleAnalyticsCookies();
  }
}

// Withdrawing consent should remove the cookies GA already set, not just
// stop new ones. GA may set them on the host or a parent domain, so expire
// each _ga cookie on every candidate domain.
function deleteGoogleAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map(c => c.split('=')[0].trim())
    .filter(n => n === '_ga' || n.startsWith('_ga_'));
  const parts = location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join('.')}`);
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
  }
}

export function loadGoogleAnalytics() {
  // Already loaded this session (e.g. re-accepted after declining).
  if (window.gtag) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = false;
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

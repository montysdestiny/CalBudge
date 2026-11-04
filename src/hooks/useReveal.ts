import { useEffect } from 'react';

// Fades [data-reveal] elements in as they scroll into view. Everything is
// visible in the prerendered HTML: only elements below the fold are hidden,
// and only once JavaScript is running, so crawlers and no-JS visitors get the
// full page. Re-runs when `key` changes (the wizard swaps the page content).
export function useReveal(key: unknown) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove('reveal-pending');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    for (const el of elements) {
      if (el.getBoundingClientRect().top < window.innerHeight) continue;
      el.classList.add('reveal-pending');
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      elements.forEach(el => el.classList.remove('reveal-pending'));
    };
  }, [key]);
}

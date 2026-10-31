import { type ReactNode, useEffect, useState } from 'react';
import { CONSENT_STORAGE_KEY } from '@/lib/consent';

// Plain-language privacy policy. Keep it in step with the code: what's
// stored (lib/consent.ts), what analytics receive (main.tsx, lib/consent.ts)
// and the Content-Security-Policy in vercel.json that limits where the page
// can send data. Bump LAST_UPDATED when anything here changes.

const LAST_UPDATED = '31 October 2026';

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-12 text-2xl font-bold tracking-tight text-ink">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-text">{children}</p>;
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-muted-text">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const Strong = ({ children }: { children: ReactNode }) => <strong className="font-bold text-ink">{children}</strong>;

const linkClass = 'font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink';

// The address is never in the prerendered HTML, where scrapers harvest it:
// the server renders "calbudgehelp [at] outlook.com" and the browser turns it
// into a mailto link after hydration.
const EMAIL_USER = 'calbudgehelp';
const EMAIL_DOMAIN = 'outlook.com';

function ContactEmail() {
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- must differ from the server render
  useEffect(() => setReady(true), []);
  if (!ready) return <span className="font-medium text-ink">{`${EMAIL_USER} [at] ${EMAIL_DOMAIN}`}</span>;
  const address = `${EMAIL_USER}@${EMAIL_DOMAIN}`;
  return (
    <a href={`mailto:${address}`} className={linkClass}>
      {address}
    </a>
  );
}

export default function PrivacyPolicy({ onCookieSettings }: { onCookieSettings: () => void }) {
  return (
    <article className="animate-block-in">
      <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Privacy policy</h1>
      <p className="mt-4 text-sm text-hint-text">Last updated {LAST_UPDATED}</p>

      <div className="mt-8 rounded-lg border border-line bg-paper px-5 py-4">
        <p className="text-[0.9375rem] leading-relaxed text-ink">
          <Strong>The short version:</Strong> CalBudge has no accounts and no database. Your calculator answers and any
          client file you open on the coaches page are processed in your browser. They are never uploaded to us and
          never stored. Google Analytics only runs if you accept cookies.
        </p>
      </div>

      <H2>Your calculator answers</H2>
      <P>
        Everything you enter (age, height, weight, training, goals) is calculated in your browser. It is not sent to
        our server or to anyone else, and it is not saved: reload or close the page and it is gone.
      </P>
      <P>
        If you choose <Strong>Copy link to my plan</Strong>, your answers are written into the link itself, after the{' '}
        <code className="font-mono text-[0.8125rem]">#</code>. Browsers never send that part of a link to a website,
        and we remove it from everything our analytics see. Anyone you give the link to can see the answers in it, so
        share it only with people you are happy to show them to.
      </P>

      <H2>Client files on the coaches page</H2>
      <P>
        When you choose a CSV on the <a href="/coaches" className={linkClass}>coaches page</a>, your browser reads it
        on your device. It is <Strong>never uploaded</Strong>: not to our server, not to Vercel, not to Google.
      </P>
      <List
        items={[
          'Nothing from the file is stored: not on a server, and not in your browser’s cookies, local storage or other storage.',
          'The results exist only in the open page. Press Clear, reload or close the tab and they are gone.',
          'The PDF and CSV reports are created in your browser and saved straight to your device.',
          'If any client names use non-Latin letters, the page downloads a font file from our own site so the PDF can print them. That request contains no client data.',
          'Analytics on this page record that it was visited. They never see file names, contents or results.',
        ]}
      />
      <P>
        The site is also set up so that the browser itself blocks it from sending data anywhere other than our own
        site and, if you accepted cookies, Google Analytics (a Content-Security-Policy). Because you control the files,
        you are responsible for having your clients’ permission to use their details.
      </P>

      <H2>What we do collect</H2>
      <P>
        <Strong>Cookieless page statistics (Vercel Web Analytics).</Strong> To see which pages are used, we count page
        views: the page address (without anything after a <code className="font-mono text-[0.8125rem]">#</code>), the
        site that referred you, your browser, operating system, device type and country. It sets no cookies and does
        not identify you; according to Vercel, visitors are counted using a hash of the request that is discarded after
        a day. Our legal basis is our legitimate interest in understanding how the site is used.
      </P>
      <P>
        <Strong>Google Analytics, only with your consent.</Strong> If you click Accept on the cookie banner, Google
        Analytics sets cookies (<code className="font-mono text-[0.8125rem]">_ga</code> and{' '}
        <code className="font-mono text-[0.8125rem]">_ga_*</code>) and records which pages you visit, roughly where
        you are (country or city), your device and how you interact with the page. Advertising features are turned off.
        Google keeps this data for at most 14 months. If you decline, Google Analytics never loads. You can change your
        mind at any time in{' '}
        <button
          type="button"
          onClick={onCookieSettings}
          className="cursor-pointer border-none bg-transparent p-0 font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          cookie settings
        </button>
        .
      </P>
      <P>
        <Strong>Server logs.</Strong> Like any website host, Vercel processes your IP address and basic request
        details to deliver the pages and protect the site from abuse.
      </P>

      <H2>What’s stored on your device</H2>
      <P>
        One item in your browser’s local storage,{' '}
        <code className="font-mono text-[0.8125rem]">{CONSENT_STORAGE_KEY}</code>, remembers whether you accepted or
        declined cookies, so we don’t ask again. Google Analytics cookies are added only if you accept.
      </P>

      <H2>Who processes data for us</H2>
      <List
        items={[
          <>
            <Strong>Vercel Inc.</Strong> hosts the site and provides the cookieless page statistics.
          </>,
          <>
            <Strong>Google LLC</Strong> provides Google Analytics, only if you consent.
          </>,
        ]}
      />
      <P>
        Both are based in the United States, so this data may be processed there. We don’t sell data, show ads or share
        data with anyone else.
      </P>

      <H2>Your rights</H2>
      <P>
        Depending on where you live (for example under the UK or EU GDPR), you can ask to access, correct or delete
        personal data about you, object to its use, or withdraw consent. Because we don’t have accounts or store your
        answers, we usually hold nothing that we can link to you. You can also complain to your local data protection
        authority.
      </P>

      <H2>Children</H2>
      <P>CalBudge is not intended for anyone under 13, and the calculator doesn’t accept ages below 13.</P>

      <H2>Changes and contact</H2>
      <P>
        If this policy changes, we’ll update this page and the date at the top. For questions or privacy requests,
        email <ContactEmail />.
      </P>
    </article>
  );
}

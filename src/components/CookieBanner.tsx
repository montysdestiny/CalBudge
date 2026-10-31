import { Button } from '@/components/Blocks';
import { type Consent, saveConsent } from '@/lib/consent';

export default function CookieBanner({ onClose }: { onClose: () => void }) {
  function choose(consent: Consent) {
    saveConsent(consent);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="animate-block-in fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-lg border border-line bg-paper p-5 shadow-[0_8px_24px_rgba(27,42,74,0.12)]"
    >
      <p className="text-sm text-muted-text">
        We'd like to use Google Analytics cookies to understand how people use CalBudge. Your calculator answers and
        client files are never collected.{' '}
        <a href="/privacy" className="font-medium text-ink underline underline-offset-2">
          Privacy policy
        </a>
      </p>
      <div className="mt-4 flex gap-3">
        <Button variant="outline" className="flex-1 py-2 text-sm" onClick={() => choose('denied')}>
          Decline
        </Button>
        <Button className="flex-1 py-2 text-sm" onClick={() => choose('granted')}>
          Accept
        </Button>
      </div>
    </div>
  );
}

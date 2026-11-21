// Renders copy from pages.ts, turning [label](/path) into a link. Internal
// links between the calculator pages help visitors and help Google find and
// weigh those pages. Site-relative paths and https links are linked; https
// links open normally with rel="noopener" (and "me" for our own profiles).

const LINK = /\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/g;

export default function RichText({ text, onInk = false }: { text: string; onInk?: boolean }) {
  const linkClass = onInk
    ? 'font-medium text-paper underline decoration-line-onink underline-offset-4 hover:decoration-paper'
    : 'font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink';
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={m.index} href={m[2]} className={linkClass} rel={m[2].startsWith('https://') ? 'me noopener' : undefined}>
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

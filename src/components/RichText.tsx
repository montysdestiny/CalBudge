// Renders copy from pages.ts, turning [label](/path) into a link. Internal
// links between the calculator pages help visitors and help Google find and
// weigh those pages. Only site-relative paths are linked.

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export default function RichText({ text }: { text: string }) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={m.index} href={m[2]} className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}


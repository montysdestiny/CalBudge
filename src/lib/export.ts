import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// html-to-image renders through SVG foreignObject, which doesn't support
// the meal cards' 3D flip (rotateY + backface-visibility) — it paints the
// back face on top, degraded into a flat 180° rotation. Flatten the cards
// to their front face for the duration of the capture, then restore.
function flattenFlipCards(node: HTMLElement) {
  const inners = node.querySelectorAll<HTMLElement>(".meal-flip-inner");
  const backs = node.querySelectorAll<HTMLElement>(".meal-flip-back");
  const prevTransforms = Array.from(inners).map(el => el.style.transform);
  const prevVisibility = Array.from(backs).map(el => el.style.visibility);
  inners.forEach(el => { el.style.transform = "none"; });
  backs.forEach(el => { el.style.visibility = "hidden"; });
  return () => {
    inners.forEach((el, i) => { el.style.transform = prevTransforms[i]; });
    backs.forEach((el, i) => { el.style.visibility = prevVisibility[i]; });
  };
}

// Renders at 2x for a crisp export regardless of the viewer's own zoom.
async function captureNode(node: HTMLElement) {
  const restore = flattenFlipCards(node);
  try {
    return await toPng(node, {
      pixelRatio: 2,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
    });
  } finally {
    restore();
  }
}

export async function exportNodeAsImage(node: HTMLElement, filename: string) {
  const dataUrl = await captureNode(node);
  triggerDownload(dataUrl, filename);
}

export async function exportNodeAsPdf(node: HTMLElement, filename: string) {
  const dataUrl = await captureNode(node);
  const { width, height } = node.getBoundingClientRect();

  // Portrait A4 at 2x-equivalent point scale, image centered and scaled
  // to fit the page with a small margin — the ledger content is usually
  // taller than it is wide, so this reads naturally on a printed page.
  const pdf = new jsPDF({ orientation: height > width ? 'portrait' : 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const scale = Math.min(maxWidth / width, maxHeight / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const x = (pageWidth - drawWidth) / 2;
  const y = margin;

  pdf.addImage(dataUrl, 'PNG', x, y, drawWidth, drawHeight);
  pdf.save(filename);
}

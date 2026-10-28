// PDF report for bulk estimates: a summary page listing every client, then
// one page per client. Drawn as real text with jsPDF (not a screenshot), so
// it stays sharp, searchable and small. Imported lazily by BulkEstimator.

import { jsPDF } from 'jspdf';
import { type ClientResult, goalLabel, nameSupport } from '@/lib/bulk';

const INK: [number, number, number] = [27, 42, 74];
const MUTED: [number, number, number] = [91, 100, 114];
const LINE: [number, number, number] = [199, 206, 218];
const GOLD: [number, number, number] = [201, 162, 39];
const MARGIN = 48;

const DISCLAIMER =
  'Estimates for informational purposes only, not medical advice. Macros: protein 1.8 g/kg bodyweight, fat 25% of calories, carbs the remainder.';

/** Base64-encoded TTFs for names outside Western European characters. */
export interface ReportFonts {
  regular: string;
  bold: string;
}

export function buildBulkReport(results: ClientResult[], fonts?: ReportFonts): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  let FONT = 'helvetica';
  if (fonts) {
    pdf.addFileToVFS('NotoSans-Regular.ttf', fonts.regular);
    pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    pdf.addFileToVFS('NotoSans-Bold.ttf', fonts.bold);
    pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    FONT = 'NotoSans';
  }
  const printable = (r: ClientResult) => {
    const support = nameSupport(r.name);
    return support === 'unsupported' || (support === 'needs-font' && !fonts) ? `Client (row ${r.row})` : r.name;
  };
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  // Fixed English locale: the PDF's text is English, and some locales'
  // month names wouldn't render in the built-in font.
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmt = (n: number) => n.toLocaleString('en-US');

  const color = (c: [number, number, number]) => pdf.setTextColor(c[0], c[1], c[2]);
  const rule = (y: number) => {
    pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
    pdf.setLineWidth(0.75);
    pdf.line(MARGIN, y, W - MARGIN, y);
  };
  const footer = () => {
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(8);
    color(MUTED);
    // Stack the disclaimer upward so a second wrapped line never touches the credit line.
    const lines: string[] = pdf.splitTextToSize(DISCLAIMER, W - MARGIN * 2);
    pdf.text(lines, MARGIN, H - 40 - (lines.length - 1) * 10);
    pdf.setFont(FONT, 'bold');
    pdf.text('Made with CalBudge · cal-budge.vercel.app', MARGIN, H - 22);
    pdf.setFont(FONT, 'normal');
    pdf.text(`Page ${pdf.getNumberOfPages()}`, W - MARGIN, H - 22, { align: 'right' });
  };
  const header = (title: string, subtitle: string) => {
    pdf.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    pdf.rect(MARGIN, MARGIN, 28, 4, 'F');
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(9);
    color(MUTED);
    pdf.text('CALBUDGE · CLIENT NUTRITION REPORT', MARGIN, MARGIN + 22);
    pdf.setFontSize(22);
    color(INK);
    pdf.text(pdf.splitTextToSize(title, W - MARGIN * 2)[0], MARGIN, MARGIN + 50);
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(10);
    color(MUTED);
    pdf.text(pdf.splitTextToSize(subtitle, W - MARGIN * 2), MARGIN, MARGIN + 68);
  };
  // Simple table: first column left-aligned, the rest right-aligned.
  const table = (y: number, cols: { label: string; width: number }[], rows: string[][], size = 10) => {
    const rowH = size + 9;
    const draw = (cells: string[], yy: number, bold: boolean, c: [number, number, number]) => {
      pdf.setFont(FONT, bold ? 'bold' : 'normal');
      pdf.setFontSize(bold ? size - 1 : size);
      color(c);
      let x = MARGIN;
      cells.forEach((cell, i) => {
        const text = pdf.splitTextToSize(cell, cols[i].width - 6)[0] ?? '';
        if (i === 0) pdf.text(text, x, yy);
        else pdf.text(text, x + cols[i].width, yy, { align: 'right' });
        x += cols[i].width;
      });
    };
    const head = (yy: number) => {
      draw(cols.map(c => c.label.toUpperCase()), yy, true, MUTED);
      rule(yy + 6);
      return yy + 6 + rowH;
    };
    let yy = head(y);
    for (const r of rows) {
      if (yy > H - 90) {
        // Continue on a new page, repeating the column headings.
        footer();
        pdf.addPage();
        yy = head(MARGIN + 20);
      }
      draw(r, yy, false, INK);
      rule(yy + 6);
      yy += rowH;
    }
    return yy;
  };

  // ---- Summary page ----
  header('Client summary', `${results.length} client${results.length === 1 ? '' : 's'} · ${date}`);
  const usable = W - MARGIN * 2;
  table(
    MARGIN + 104,
    [
      { label: 'Client', width: usable * 0.3 },
      { label: 'Goal', width: usable * 0.2 },
      { label: 'Target kcal', width: usable * 0.14 },
      { label: 'Protein', width: usable * 0.12 },
      { label: 'Carbs', width: usable * 0.12 },
      { label: 'Fat', width: usable * 0.12 },
    ],
    results.map(r => [
      printable(r),
      goalLabel(r),
      fmt(r.targetKcal),
      r.macros ? `${r.macros.proteinG} g` : '–',
      r.macros ? `${r.macros.carbsG} g` : '–',
      r.macros ? `${r.macros.fatG} g` : '–',
    ]),
    9,
  );
  footer();

  // ---- One page per client ----
  for (const r of results) {
    pdf.addPage();
    header(printable(r), `${goalLabel(r)} · ${r.inputsSummary}`);

    let y = MARGIN + 110;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(9);
    color(MUTED);
    pdf.text('DAILY CALORIE TARGET', MARGIN, y);
    pdf.setFontSize(40);
    color(INK);
    pdf.text(`${fmt(r.targetKcal)} kcal`, MARGIN, y + 40);
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(11);
    color(MUTED);
    const sub = [`Maintenance (TDEE): ${fmt(r.tdeeKcal)} kcal`, r.bmrKcal != null && `BMR: ${fmt(r.bmrKcal)} kcal`]
      .filter(Boolean)
      .join('     ');
    pdf.text(sub, MARGIN, y + 62);
    y += 76;
    if (r.note) {
      pdf.setFont(FONT, 'bold');
      color(GOLD);
      pdf.text(`Note: ${r.note}`, MARGIN, y + 6);
      y += 18;
    }

    y += 22;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(12);
    color(INK);
    pdf.text('Macros', MARGIN, y);
    if (r.macros) {
      const m = r.macros;
      const pct = (k: number) => `${Math.round((k / r.targetKcal) * 100)}%`;
      y = table(
        y + 22,
        [
          { label: 'Macro', width: usable * 0.4 },
          { label: 'Grams', width: usable * 0.2 },
          { label: 'kcal', width: usable * 0.2 },
          { label: '% of target', width: usable * 0.2 },
        ],
        [
          ['Protein', `${m.proteinG} g`, fmt(m.proteinKcal), pct(m.proteinKcal)],
          ['Carbohydrates', `${m.carbsG} g`, fmt(m.carbsKcal), pct(m.carbsKcal)],
          ['Fat', `${m.fatG} g`, fmt(m.fatKcal), pct(m.fatKcal)],
        ],
      );
    } else {
      pdf.setFont(FONT, 'normal');
      pdf.setFontSize(10);
      color(MUTED);
      pdf.text('Add a bodyweight for this client to include a macro split.', MARGIN, y + 20);
      y += 30;
    }

    y += 22;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(12);
    color(INK);
    pdf.text('Meal split', MARGIN, y);
    y = table(
      y + 22,
      [
        { label: 'Meal', width: usable * 0.6 },
        { label: 'kcal', width: usable * 0.2 },
        { label: 'Share', width: usable * 0.2 },
      ],
      r.meals.map(meal => [meal.name, fmt(meal.kcal), `${Math.round((meal.kcal / r.targetKcal) * 100)}%`]),
    );

    if (r.weeksToTarget != null) {
      y += 18;
      pdf.setFont(FONT, 'normal');
      pdf.setFontSize(11);
      color(INK);
      pdf.text(
        `Estimated time to target weight: about ${r.weeksToTarget} week${r.weeksToTarget === 1 ? '' : 's'} at this pace.`,
        MARGIN,
        y,
      );
    }
    footer();
  }

  return pdf;
}

export function generateBulkReport(results: ClientResult[], filename: string, fonts?: ReportFonts) {
  buildBulkReport(results, fonts).save(filename);
}

import { useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button, ErrorText } from '@/components/Blocks';
import { AccentHeading, Container, SectionHeading, revealDelay } from '@/components/Section';
import RichText from '@/components/RichText';
import { Faq } from '@/components/HomeContent';
import {
  type ClientResult,
  type RowError,
  type Separator,
  MAX_FILE_BYTES,
  MAX_ROWS,
  TEMPLATE_CSV,
  decodeFileBytes,
  goalLabel,
  nameSupport,
  processCsv,
  resultsToCsv,
} from '@/lib/bulk';
import { track } from '@/lib/consent';
import type { LandingPage } from '@/lib/pages';

// The BOM makes Excel open UTF-8 CSVs with accented names intact.
function downloadCsv(text: string, filename: string) {
  downloadBlob(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ERRORS_SHOWN = 50;

const COLUMNS: { name: string; required: string; notes: string }[] = [
  { name: 'name', required: 'Yes', notes: 'Client name or ID. Shown on the report.' },
  { name: 'goal', required: 'Yes', notes: 'cut, bulk or maintain' },
  { name: 'pace', required: 'Unless maintain', notes: 'mild, moderate or aggressive' },
  { name: 'sex', required: 'Yes*', notes: 'male or female' },
  { name: 'age', required: 'Yes*', notes: '13 to 100' },
  { name: 'height_cm or height_in', required: 'Yes*', notes: 'Use _in / _lb columns for imperial units' },
  { name: 'weight_kg or weight_lb', required: 'Yes*', notes: 'Also used for the macro split' },
  { name: 'gym_per_week', required: 'Yes*', notes: 'Strength sessions per week, 0 to 14' },
  { name: 'cardio_per_week', required: 'Yes*', notes: 'Cardio sessions per week, 0 to 14' },
  { name: 'steps', required: 'No', notes: 'Average daily steps; refines the activity factor' },
  { name: 'body_fat_pct', required: 'No', notes: 'Switches BMR to Katch-McArdle' },
  { name: 'bmr', required: 'No', notes: 'Measured BMR; used instead of a formula' },
  { name: 'tdee', required: 'No', notes: '*If set, the starred columns are optional (weight still gives macros)' },
  { name: 'target_weight_kg or _lb', required: 'No', notes: 'Adds an estimated timeline' },
];

export default function BulkEstimator({ page }: { page: LandingPage }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<ClientResult[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [separator, setSeparator] = useState<Separator>(',');
  const [dragging, setDragging] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  function showFatal(message: string) {
    setResults([]);
    setErrors([]);
    setWarnings([]);
    setFatal(message);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setPdfError('');
    // Clear the input so choosing the same (fixed) file again still triggers a change.
    if (fileInput.current) fileInput.current.value = '';
    if (file.size > MAX_FILE_BYTES) {
      showFatal('That file is over 5 MB. Split it into smaller files.');
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      showFatal("Couldn't read that file. Try saving it again as CSV.");
      return;
    }
    const decoded = decodeFileBytes(bytes);
    if ('error' in decoded) {
      showFatal(decoded.error);
      return;
    }
    // Binary content (control characters) means this isn't a text/CSV file.
    // eslint-disable-next-line no-control-regex
    if (!/\.(csv|txt|tsv)$/i.test(file.name) && /[\u0000-\u0008\u000e-\u001f]/.test(decoded.text.slice(0, 2000))) {
      showFatal("That doesn't look like a CSV file. Save your spreadsheet as CSV and upload that.");
      return;
    }
    const out = processCsv(decoded.text);
    // Counts only: names and measurements never go to analytics.
    track('coaches_upload', { clients: out.results.length, error_rows: out.errors.length, failed: out.fatal ? 1 : 0 });
    setResults(out.results);
    setErrors(out.errors);
    setWarnings(out.warnings);
    setSeparator(out.separator);
    setFatal(out.fatal);
  }

  const dateStamp = () => new Date().toISOString().slice(0, 10);
  const unprintableNames = results.filter(r => nameSupport(r.name) === 'unsupported');

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError('');
    try {
      const { generateBulkReport } = await import('@/lib/bulkReport');
      // Names outside Western European letters need the embedded font.
      let fonts;
      if (results.some(r => nameSupport(r.name) === 'needs-font')) {
        const load = async (file: string) => {
          const res = await fetch(`/fonts/${file}`);
          if (!res.ok) throw new Error(`font ${file}: HTTP ${res.status}`);
          const buf = new Uint8Array(await res.arrayBuffer());
          let binary = '';
          for (let i = 0; i < buf.length; i += 0x8000) binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          return btoa(binary);
        };
        const [regular, bold] = await Promise.all([load('NotoSans-Regular.ttf'), load('NotoSans-Bold.ttf')]);
        fonts = { regular, bold };
      }
      generateBulkReport(results, `calbudge-client-report-${dateStamp()}.pdf`, fonts);
      track('coaches_report', { format: 'pdf', clients: results.length });
    } catch {
      setPdfError("Couldn't generate the PDF. Check your connection and try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  function reset() {
    setFileName(null);
    setResults([]);
    setErrors([]);
    setWarnings([]);
    setFatal(null);
    setPdfError('');
    if (fileInput.current) fileInput.current.value = '';
  }

  const hasOutput = results.length > 0 || errors.length > 0 || fatal;
  const [reportSection, privacySection] = page.sections;

  return (
    <>
      <section className="ledger-lines mt-3 mx-3 rounded-[28px] sm:mx-6 bg-ink pt-14 pb-44 text-center sm:pt-20">
        <Container className="relative">
          <div className="animate-block-in mx-auto inline-flex items-center gap-2 rounded-full border border-line-onink px-4 py-1.5 text-[0.8125rem] font-medium text-onink-text">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Free. No signup. Files stay in your browser.
          </div>
          <h1 className="animate-block-in mx-auto mt-6 max-w-4xl font-display text-[2.75rem] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-paper sm:text-7xl">
            <AccentHeading text={page.h1} accent={page.h1Accent} />
          </h1>
          <p className="animate-block-in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-onink-text">{page.intro}</p>
        </Container>
      </section>

      <Container className="relative z-10 -mt-32 max-w-5xl">
        <div className="rounded-2xl border border-line bg-card p-6 shadow-[0_24px_60px_-20px_rgba(27,42,74,0.35)] sm:p-8">
          <ol className="grid gap-8 md:grid-cols-[1fr_1.6fr]">
            <li>
              <div aria-hidden="true" className="font-display text-5xl leading-none font-bold text-accent">1</div>
              <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">Download the template</h2>
              <p className="mt-1.5 text-sm text-muted-text">
                One row per client. Fill it in with Excel, Google Sheets or Numbers and save as CSV.
              </p>
              <Button
                variant="outline"
                className="mt-4 py-2.5 text-sm"
                onClick={() => downloadCsv(TEMPLATE_CSV, 'calbudge-clients-template.csv')}
              >
                Download template (CSV)
              </Button>
            </li>

            <li id="upload" className="scroll-mt-24">
              <div aria-hidden="true" className="font-display text-5xl leading-none font-bold text-accent">2</div>
              <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">Upload your client file</h2>
              <label
                onDragOver={e => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) void handleFile(file);
                }}
                className={
                  'mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ' +
                  (dragging ? 'border-ink bg-hover-tint' : 'border-input hover:border-ink')
                }
              >
                {/* pointer-events-none stops dragleave firing when the cursor crosses the text. */}
                <span className="pointer-events-none font-bold text-ink">{fileName ?? 'Drop a CSV file here, or click to choose'}</span>
                <span className="pointer-events-none mt-1 text-sm text-muted-text">
                  {fileName ? 'Drop or click to choose another file' : `Up to ${MAX_ROWS.toLocaleString()} clients per file`}
                </span>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,.tsv,.txt,text/csv"
                  className="sr-only"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </label>
              <p className="mt-3 flex gap-2 text-sm text-muted-text">
                <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                <span>
                  <span className="font-medium text-ink">Your file never leaves this device.</span> It's read in your browser,
                  nothing is uploaded or stored, and the results disappear when you press Clear or close the tab.{' '}
                  <a href="/privacy" className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                    Privacy policy
                  </a>
                </span>
              </p>
            </li>
          </ol>

          {hasOutput && (
            <div className="mt-8 border-t border-line pt-8" aria-live="polite">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Results</h2>
                <button
                  type="button"
                  onClick={reset}
                  className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-muted-text underline decoration-line underline-offset-4 hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <ErrorText>{fatal}</ErrorText>

              {!fatal && (
                <p className="mt-1 text-sm text-muted-text">
                  {results.length} client{results.length === 1 ? '' : 's'} calculated
                  {errors.length > 0 && `, ${errors.length} row${errors.length === 1 ? '' : 's'} need${errors.length === 1 ? 's' : ''} fixing`}.
                </p>
              )}

              {warnings.map(w => (
                <p key={w} className="mt-3 text-sm text-muted-text">
                  {w}
                </p>
              ))}

              {errors.length > 0 && (
                <ul className="mt-4 space-y-2 rounded-lg border border-deficit/40 px-4 py-3 text-sm">
                  {errors.slice(0, ERRORS_SHOWN).map(e => (
                    <li key={e.row}>
                      <span className="font-bold text-deficit">
                        Row {e.row} ({e.name}):
                      </span>{' '}
                      <span className="text-muted-text">{e.problems.join('; ')}</span>
                    </li>
                  ))}
                  {errors.length > ERRORS_SHOWN && (
                    <li className="font-medium text-muted-text">
                      ...and {errors.length - ERRORS_SHOWN} more. Fix these first, then upload the file again.
                    </li>
                  )}
                </ul>
              )}

              {results.length > 0 && (
                <>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={downloadPdf} disabled={pdfBusy}>
                      {pdfBusy ? 'Generating...' : 'Download PDF report'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        downloadCsv(resultsToCsv(results, separator), `calbudge-client-results-${dateStamp()}.csv`);
                        track('coaches_report', { format: 'csv', clients: results.length });
                      }}
                    >
                      Download results (CSV)
                    </Button>
                  </div>
                  <ErrorText>{pdfError}</ErrorText>
                  {unprintableNames.length > 0 && (
                    <p className="mt-3 text-sm text-muted-text">
                      {unprintableNames.length} name{unprintableNames.length === 1 ? ' uses' : 's use'} an alphabet the PDF can't print (such as
                      Chinese or Arabic), so {unprintableNames.length === 1 ? 'it appears' : 'they appear'} as "Client (row N)" in the PDF. The
                      table and CSV keep the original names.
                    </p>
                  )}

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                      <thead>
                        <tr className="border-b border-line text-xs tracking-wide text-hint-text uppercase">
                          <th className="py-2 pr-3 font-medium">Client</th>
                          <th className="py-2 pr-3 font-medium">Goal</th>
                          <th className="py-2 pr-3 text-right font-medium">Target</th>
                          <th className="py-2 pr-3 text-right font-medium">TDEE</th>
                          <th className="py-2 pr-3 text-right font-medium">Protein</th>
                          <th className="py-2 pr-3 text-right font-medium">Carbs</th>
                          <th className="py-2 text-right font-medium">Fat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => (
                          <tr key={r.row} className="border-b border-line">
                            <td className="py-2.5 pr-3 font-medium text-ink">
                              {r.name}
                              {r.note && <div className="text-xs font-normal text-hint-text">{r.note}</div>}
                            </td>
                            <td className="py-2.5 pr-3 text-muted-text">{goalLabel(r)}</td>
                            <td className="py-2.5 pr-3 text-right font-bold text-ink">{r.targetKcal.toLocaleString()}</td>
                            <td className="py-2.5 pr-3 text-right text-muted-text">{r.tdeeKcal.toLocaleString()}</td>
                            <td className="py-2.5 pr-3 text-right text-muted-text">{r.macros ? `${r.macros.proteinG} g` : '–'}</td>
                            <td className="py-2.5 pr-3 text-right text-muted-text">{r.macros ? `${r.macros.carbsG} g` : '–'}</td>
                            <td className="py-2.5 text-right text-muted-text">{r.macros ? `${r.macros.fatG} g` : '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Container>

      {reportSection && (
        <section className="mt-24 sm:mt-32">
          <Container className="grid items-center gap-12 md:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionHeading eyebrow="The report">{reportSection.heading}</SectionHeading>
              {reportSection.paragraphs.map(para => (
                <p key={para.slice(0, 40)} className="mt-4 text-base leading-relaxed text-muted-text" data-reveal>
                  <RichText text={para} />
                </p>
              ))}
            </div>
            <div data-reveal style={revealDelay(1)}>
              <SampleReportPage />
            </div>
          </Container>
        </section>
      )}

      {privacySection && (
        <section className="ledger-lines mt-24 mx-3 rounded-[28px] sm:mx-6 bg-ink py-20 sm:mt-32 sm:py-24">
          <Container className="relative grid gap-8 md:grid-cols-[1fr_1.6fr] md:gap-12">
            <SectionHeading eyebrow="Your clients' data" onInk>
              {privacySection.heading}
            </SectionHeading>
            <div>
              {privacySection.paragraphs.map(para => (
                <p key={para.slice(0, 40)} className="mt-4 text-base leading-relaxed text-onink-text first:mt-0" data-reveal>
                  <RichText onInk text={para} />
                </p>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="mt-24 mb-24 sm:mt-32 sm:mb-32">
        <Container>
          <SectionHeading eyebrow="Reference">File columns</SectionHeading>
          <div className="mt-8 overflow-x-auto rounded-2xl bg-card shadow-ring" data-reveal>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs tracking-wide text-hint-text uppercase">
                  <th className="px-5 py-3 font-medium">Column</th>
                  <th className="px-5 py-3 font-medium">Required</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {COLUMNS.map(c => (
                  <tr key={c.name} className="border-b border-line align-top last:border-b-0">
                    <td className="px-5 py-3 font-mono text-[0.8125rem] text-ink">{c.name}</td>
                    <td className="px-5 py-3 text-muted-text">{c.required}</td>
                    <td className="px-5 py-3 text-muted-text">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
      {page.faqs && <Faq items={page.faqs} />}
      <div className="h-24" />
    </>
  );
}

/** A page of the PDF, drawn in HTML from the template's first example client. */
function SampleReportPage() {
  const sample = processCsv(TEMPLATE_CSV).results[0];
  return (
    <div aria-label="Sample report page" role="img" className="mx-auto max-w-sm rounded-sm border border-line bg-card p-7 shadow-[0_24px_50px_-20px_rgba(27,42,74,0.4)]">
      <div className="h-1 w-8 bg-accent" />
      <div className="mt-3 text-[0.625rem] font-bold tracking-wider text-muted-text uppercase">CalBudge · Client nutrition report</div>
      <div className="mt-2 text-xl font-bold text-ink">{sample.name}</div>
      <div className="text-xs text-muted-text">{goalLabel(sample)}</div>
      <div className="mt-4 text-[0.625rem] font-bold tracking-wider text-muted-text uppercase">Daily calorie target</div>
      <div className="text-3xl font-bold text-ink tabular-nums">{sample.targetKcal.toLocaleString('en-US')} kcal</div>
      <div className="mt-1 text-xs text-muted-text tabular-nums">Maintenance (TDEE): {sample.tdeeKcal.toLocaleString('en-US')} kcal</div>
      {sample.macros && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs tabular-nums">
          <div><dt className="text-muted-text">Protein</dt><dd className="font-bold text-ink">{sample.macros.proteinG} g</dd></div>
          <div><dt className="text-muted-text">Carbs</dt><dd className="font-bold text-ink">{sample.macros.carbsG} g</dd></div>
          <div><dt className="text-muted-text">Fat</dt><dd className="font-bold text-ink">{sample.macros.fatG} g</dd></div>
        </dl>
      )}
      <ul className="mt-3 border-t border-line pt-2 text-xs tabular-nums">
        {sample.meals.map(m => (
          <li key={m.name} className="flex justify-between py-0.5">
            <span className="text-muted-text">{m.name}</span>
            <span className="font-bold text-ink">{m.kcal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

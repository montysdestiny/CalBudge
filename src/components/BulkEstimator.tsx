import { useRef, useState } from 'react';
import { Button, ErrorText } from '@/components/Blocks';
import { type ClientResult, type RowError, MAX_ROWS, TEMPLATE_CSV, goalLabel, processCsv, resultsToCsv } from '@/lib/bulk';
import type { LandingPage } from '@/lib/pages';

function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
  const [dragging, setDragging] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  async function handleFile(file: File) {
    setFileName(file.name);
    setPdfError('');
    if (file.size > 5_000_000) {
      setResults([]);
      setErrors([]);
      setFatal('That file is over 5 MB. Export it as CSV, or split it into smaller files.');
      return;
    }
    const out = processCsv(await file.text());
    setResults(out.results);
    setErrors(out.errors);
    setFatal(out.fatal);
  }

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError('');
    try {
      const { generateBulkReport } = await import('@/lib/bulkReport');
      generateBulkReport(results, 'calbudge-client-report.pdf');
    } catch {
      setPdfError('Could not generate the PDF. Try again.');
    } finally {
      setPdfBusy(false);
    }
  }

  function reset() {
    setFileName(null);
    setResults([]);
    setErrors([]);
    setFatal(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  const hasOutput = results.length > 0 || errors.length > 0 || fatal;

  return (
    <section className="animate-block-in">
      <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">{page.h1}</h1>
      <p className="mt-4 text-lg text-muted-text">{page.intro}</p>
      <p className="mt-3 text-sm font-medium text-ink">
        Files are processed in your browser. Client data never leaves your computer.
      </p>

      <ol className="mt-10 space-y-8">
        <li>
          <div className="font-mono text-sm text-hint-text">01</div>
          <h2 className="mt-1 text-base font-bold text-ink">Download the template</h2>
          <p className="mt-1 text-sm text-muted-text">
            One row per client. Fill it in with Excel, Google Sheets or Numbers and save as CSV.
          </p>
          <Button
            variant="outline"
            className="mt-3 py-2 text-sm"
            onClick={() => downloadText(TEMPLATE_CSV, 'calbudge-clients-template.csv', 'text/csv')}
          >
            Download template (CSV)
          </Button>
        </li>

        <li>
          <div className="font-mono text-sm text-hint-text">02</div>
          <h2 className="mt-1 text-base font-bold text-ink">Upload your client file</h2>
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
              'mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ' +
              (dragging ? 'border-ink bg-hover-tint' : 'border-line hover:border-ink')
            }
          >
            <span className="font-bold text-ink">{fileName ?? 'Drop a CSV file here, or click to choose'}</span>
            <span className="mt-1 text-sm text-muted-text">Up to {MAX_ROWS.toLocaleString()} clients per file</span>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
        </li>
      </ol>

      {hasOutput && (
        <div className="mt-10" aria-live="polite">
          <div className="font-mono text-sm text-hint-text">03</div>
          <h2 className="mt-1 text-base font-bold text-ink">Results</h2>
          <ErrorText>{fatal}</ErrorText>

          {!fatal && (
            <p className="mt-1 text-sm text-muted-text">
              {results.length} client{results.length === 1 ? '' : 's'} calculated
              {errors.length > 0 && `, ${errors.length} row${errors.length === 1 ? '' : 's'} need${errors.length === 1 ? 's' : ''} fixing`}.
            </p>
          )}

          {errors.length > 0 && (
            <ul className="mt-4 space-y-2 rounded-lg border border-deficit/40 px-4 py-3 text-sm">
              {errors.map(e => (
                <li key={e.row}>
                  <span className="font-bold text-deficit">
                    Row {e.row} ({e.name}):
                  </span>{' '}
                  <span className="text-muted-text">{e.problems.join('; ')}</span>
                </li>
              ))}
            </ul>
          )}

          {results.length > 0 && (
            <>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={downloadPdf} disabled={pdfBusy}>
                  {pdfBusy ? 'Generating...' : 'Download PDF report'}
                </Button>
                <Button variant="outline" onClick={() => downloadText(resultsToCsv(results), 'calbudge-client-results.csv', 'text/csv')}>
                  Download results (CSV)
                </Button>
                <Button variant="outline" onClick={reset}>
                  Clear
                </Button>
              </div>
              <ErrorText>{pdfError}</ErrorText>

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
                        <td className="py-2 pr-3 font-medium text-ink">
                          {r.name}
                          {r.note && <div className="text-xs font-normal text-hint-text">{r.note}</div>}
                        </td>
                        <td className="py-2 pr-3 text-muted-text">{goalLabel(r)}</td>
                        <td className="py-2 pr-3 text-right font-bold text-ink">{r.targetKcal.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-right text-muted-text">{r.tdeeKcal.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-right text-muted-text">{r.macros ? `${r.macros.proteinG} g` : '–'}</td>
                        <td className="py-2 pr-3 text-right text-muted-text">{r.macros ? `${r.macros.carbsG} g` : '–'}</td>
                        <td className="py-2 text-right text-muted-text">{r.macros ? `${r.macros.fatG} g` : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {page.sections.map(sec => (
        <section key={sec.heading} className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-ink">{sec.heading}</h2>
          {sec.paragraphs.map(para => (
            <p key={para.slice(0, 40)} className="mt-3 text-[0.9375rem] leading-relaxed text-muted-text">
              {para}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink">File columns</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-hint-text uppercase">
                <th className="py-2 pr-3 font-medium">Column</th>
                <th className="py-2 pr-3 font-medium">Required</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map(c => (
                <tr key={c.name} className="border-b border-line align-top">
                  <td className="py-2 pr-3 font-mono text-[0.8125rem] text-ink">{c.name}</td>
                  <td className="py-2 pr-3 text-muted-text">{c.required}</td>
                  <td className="py-2 text-muted-text">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

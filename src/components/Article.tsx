import { ArrowRight } from 'lucide-react';
import { Faq } from '@/components/HomeContent';
import RichText from '@/components/RichText';
import { Container, revealDelay } from '@/components/Section';
import { ARTICLES, type Article, type ArticleBlock, articlePath, findArticle } from '@/lib/articles';
import type { LandingPage } from '@/lib/pages';
import { SOURCES } from '@/lib/sources';

// Guide pages (kind 'article') and the guides index (kind 'guides'). Fully
// prerendered: no wizard here, the CTA links to the matching calculator.

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}

function Block({ block }: { block: ArticleBlock }) {
  if ('h2' in block) {
    return <h2 className="mt-12 scroll-mt-24 text-[1.625rem] leading-tight font-medium tracking-[-0.02em] text-ink">{block.h2}</h2>;
  }
  if ('p' in block) {
    return (
      <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted-text">
        <RichText text={block.p} />
      </p>
    );
  }
  if ('list' in block) {
    return (
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[1.0625rem] leading-relaxed text-muted-text marker:text-gold-ink">
        {block.list.map(item => (
          <li key={item}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    );
  }
  if ('table' in block) {
    const { columns, rows, caption } = block.table;
    return (
      <figure className="mt-6">
        <div className="overflow-x-auto rounded-xl bg-card shadow-ring">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-hint-text">
                {columns.map(c => (
                  <th key={c} scope="col" className="px-4 py-3 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.join('|')} className="border-b border-line last:border-0">
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="px-4 py-3 font-medium text-ink">{cell}</th>
                    ) : (
                      <td key={i} className="px-4 py-3 text-muted-text tabular-nums">{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {caption && <figcaption className="mt-2 text-sm text-hint-text">{caption}</figcaption>}
      </figure>
    );
  }
  return (
    <aside className="mt-8 rounded-xl border-l-4 border-accent bg-card px-5 py-4 text-base leading-relaxed text-muted-text shadow-ring">
      <RichText text={block.tip} />
    </aside>
  );
}

function GuideCard({ article, index }: { article: Article; index: number }) {
  return (
    <li data-reveal style={revealDelay(index)}>
      <a
        href={articlePath(article.slug)}
        className="group flex h-full flex-col rounded-2xl bg-card p-6 shadow-ring transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--color-ink),0_6px_18px_-8px_rgb(27_42_74/0.35)]"
      >
        <span className="text-sm text-hint-text">{article.readMinutes} min read</span>
        <span className="mt-2 text-lg leading-snug font-medium tracking-tight text-ink">{article.h1}</span>
        <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-text">{article.dek}</span>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
          Read the guide
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
        </span>
      </a>
    </li>
  );
}

function CalculatorCta({ path, label }: { path: string; label: string }) {
  return (
    <section className="mt-20 mx-3 rounded-[28px] bg-ink py-14 text-center sm:mx-6 sm:py-16 ledger-lines">
      <Container>
        <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-medium tracking-[-0.025em] text-balance text-paper sm:text-4xl">
          Get your own numbers in about a minute
        </h2>
        <p className="mt-3 text-base text-onink-text">Free, no signup. The same formulas as this guide.</p>
        <a
          href={path}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-ink transition-colors duration-150 hover:bg-accent-hover"
        >
          {label}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </Container>
    </section>
  );
}

export function ArticlePage({ page }: { page: LandingPage }) {
  const a = page.article!;
  const related = a.related.map(findArticle).filter((r): r is Article => !!r);
  return (
    <article>
      <Container className="max-w-3xl pt-12 sm:pt-16">
        {!a.about && (
          <nav aria-label="Breadcrumb" className="text-sm text-hint-text">
            <a href="/guides" className="hover:text-ink">Guides</a>
          </nav>
        )}
        <h1 className="mt-3 text-[2.25rem] leading-[1.08] font-medium tracking-[-0.03em] text-balance text-ink sm:text-[3rem]">{a.h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-text">{a.dek}</p>
        <p className="mt-4 text-sm text-hint-text">
          {a.about ? 'Updated ' : <>By <a href="/about" className="underline decoration-line underline-offset-2 hover:text-ink">Alexander Montgomery</a> · {a.updated ? 'Updated ' : ''}</>}
          <time dateTime={a.updated ?? a.published}>{formatDate(a.updated ?? a.published)}</time> · {a.readMinutes} min read
        </p>

        <section aria-labelledby="short-answer" className="mt-8 rounded-2xl bg-card p-6 shadow-ring">
          <h2 id="short-answer" className="text-sm font-medium text-gold-ink">The short answer</h2>
          <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink">{a.shortAnswer}</p>
          <a href={a.calculator.path} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
            {a.calculator.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </section>

        {a.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        {a.sources && a.sources.length > 0 && (
          <section aria-labelledby="references" className="mt-12">
            <h2 id="references" className="text-lg font-medium text-ink">References</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-text">
              {a.sources.map(id => {
                const s: { text: string; url?: string } = SOURCES[id];
                return (
                  <li key={id}>
                    {s.text}
                    {s.url && (
                      <>
                        {' '}
                        <a href={s.url} rel="noopener" className="break-all underline decoration-line underline-offset-2 hover:text-ink">{s.url.replace('https://', '')}</a>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <p className="mt-12 border-t border-line pt-5 text-sm leading-relaxed text-hint-text">
          This guide is general information, not medical advice. If you have a medical condition, are pregnant or have a
          history of disordered eating, talk to a doctor or registered dietitian before changing how you eat.
        </p>
      </Container>

      <Faq items={a.faqs} />

      {related.length > 0 && (
        <nav aria-labelledby="related-guides" className="mt-24">
          <Container>
            <h2 id="related-guides" className="text-[1.75rem] leading-tight font-medium tracking-tight text-ink">Related guides</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((r, i) => (
                <GuideCard key={r.slug} article={r} index={i} />
              ))}
            </ul>
          </Container>
        </nav>
      )}

      <CalculatorCta path={a.calculator.path} label={a.calculator.label} />
    </article>
  );
}

export function GuidesIndex({ page }: { page: LandingPage }) {
  return (
    <>
      <Container className="pt-12 sm:pt-16">
        <h1 className="text-[2.5rem] leading-[1.05] font-medium tracking-[-0.03em] text-ink sm:text-[3.5rem]">{page.h1}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-text">{page.intro}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.filter(a => !a.comparison && !a.series).map((a, i) => (
            <GuideCard key={a.slug} article={a} index={i} />
          ))}
        </ul>
        <h2 className="mt-16 text-[1.75rem] leading-tight font-medium tracking-tight text-ink">How CalBudge compares</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-text">Honest side-by-sides with the calculators and tracking apps people weigh it against.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.filter(a => a.comparison).map((a, i) => (
            <GuideCard key={a.slug} article={a} index={i} />
          ))}
        </ul>
        <h2 className="mt-16 text-[1.75rem] leading-tight font-medium tracking-tight text-ink">Macros by calorie target</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-text">Protein, carbs and fat for common daily targets, at different bodyweights, and how to split each into meals.</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {ARTICLES.filter(a => a.series === 'calories').map(a => (
            <li key={a.slug}>
              <a href={articlePath(a.slug)} className="inline-block rounded-full bg-card px-4 py-2 text-sm font-medium text-ink shadow-ring hover:shadow-[0_0_0_1px_var(--color-ink)]">{a.linkLabel}</a>
            </li>
          ))}
        </ul>
      </Container>
      <CalculatorCta path="/" label="Calculate my budget" />
    </>
  );
}

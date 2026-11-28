import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PreviewShell from "../PreviewShell";
import Character from "../../landing/Characters";
import { PREVIEWS, previewBySlug } from "../../lib/previews";

export function generateStaticParams() {
  return PREVIEWS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = previewBySlug((await params).slug);
  return { title: p ? `ASHA Awaaz | ${p.titleEn}` : "ASHA Awaaz" };
}

const FLAG_TEXT = { risk: "जोखिम", ok: "ठीक", unclear: "बताया नहीं" } as const;

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = previewBySlug((await params).slug);
  if (!p) notFound();
  const others = PREVIEWS.filter((o) => o.slug !== p.slug);

  return (
    <PreviewShell>
      <div className="aa-card">
        <div className="nx-head">
          {p.character ? (
            <Character name={p.character} size={64} className="nx-char" />
          ) : (
            <span className="aa-cohort-emoji" aria-hidden="true">{p.emoji}</span>
          )}
          <div>
            <h1 className="aa-h1">{p.title}</h1>
            <p className="nx-en">{p.titleEn}</p>
          </div>
        </div>
        <dl className="nx-meta">
          <div><dt>Programme</dt><dd>{p.programme}</dd></div>
          <div><dt>When</dt><dd>{p.cadence}</dd></div>
        </dl>
      </div>

      <div className="aa-card">
        <p className="nx-step">1 · वह बोलती है · she says</p>
        <blockquote className="nx-said">🎙️ “{p.said}”</blockquote>

        <p className="nx-step">2 · रिकॉर्ड बनता है · the record</p>
        <div className="nx-fields">
          {p.fields.map((f) => (
            <div key={f.label} className="nx-field" data-flag={f.flag}>
              <span className="nx-field-label">{f.label}<small>{f.en}</small></span>
              <span className="nx-field-value">{f.value}</span>
              {f.flag && <span className="nx-flag">{FLAG_TEXT[f.flag]}</span>}
            </div>
          ))}
        </div>

        <p className="nx-step">3 · अगला कदम · next step</p>
        <div className="nx-outcome">
          <b>{p.outcome}</b>
          <span>{p.outcomeEn}</span>
        </div>
      </div>

      <div className="aa-card nx-rule">
        <p className="nx-step">Safety rule</p>
        <h2 className="nx-h2">{p.rule.title}</h2>
        <p>{p.rule.body}</p>
      </div>

      <div className="nx-others">
        {others.map((o) => (
          <Link key={o.slug} href={`/next/${o.slug}`} className="aa-soon-chip nx-chip">
            {o.emoji} {o.title} ›
          </Link>
        ))}
      </div>
      <p className="nx-back">
        <Link href="/next">All coming next</Link> · <Link href="/visit">Back to the live app</Link>
      </p>
    </PreviewShell>
  );
}

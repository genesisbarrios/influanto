import Link from "next/link";
import type { ReactNode } from "react";

// Crawlable explainer + FAQ block for public tool/feature pages. Renders the FAQ
// as FAQPage structured data too, so it can show up as rich results in Google.
// No "use client" — works inside both server pages and client tool pages.

export interface SeoSection { heading: string; body: ReactNode }
export interface SeoFaq { q: string; a: string }
export interface SeoLink { href: string; label: string }

export function JsonLd({ data }: { data: Record<string, any> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function faqSchema(faqs: SeoFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export default function SeoContent({
  sections = [],
  faqs = [],
  related = [],
  className = "",
}: {
  sections?: SeoSection[];
  faqs?: SeoFaq[];
  related?: SeoLink[];
  className?: string;
}) {
  return (
    <section className={`max-w-4xl mx-auto px-6 py-12 text-left text-base-content ${className}`}>
      {sections.map(s => (
        <div key={s.heading} className="mb-10">
          <h2 className="text-2xl font-extrabold mb-3">{s.heading}</h2>
          <div className="space-y-3 leading-relaxed opacity-90">{s.body}</div>
        </div>
      ))}

      {faqs.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="bg-base-200 rounded-lg px-5 py-4">
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className="mt-2 leading-relaxed opacity-90">{f.a}</p>
              </details>
            ))}
          </div>
          <JsonLd data={faqSchema(faqs)} />
        </div>
      )}

      {related.length > 0 && (
        <nav aria-label="Related" className="border-t border-base-300 pt-6">
          <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">Related</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {related.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="link link-primary font-medium">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}

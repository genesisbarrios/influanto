import { Suspense, type CSSProperties } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ButtonGetInfluanto from "@/components/ButtonGetInfluanto";
import SeoContent, { JsonLd, type SeoFaq, type SeoLink, type SeoSection } from "@/components/SeoContent";

// Public landing page for a dashboard feature (link in bio, newsletter, QR codes,
// curator search) so each one has a crawlable page that can rank for its searches.

export interface LandingFeature { title: string; body: string }

export default function FeatureLanding({
  path,
  eyebrow,
  h1,
  subtitle,
  appName,
  appDescription,
  features,
  steps,
  sections,
  faqs,
  related,
  ctaText = "Get Started Free",
}: {
  path: string;
  eyebrow: string;
  h1: string;
  subtitle: string;
  appName: string;
  appDescription: string;
  features: LandingFeature[];
  steps: string[];
  sections?: SeoSection[];
  faqs: SeoFaq[];
  related: SeoLink[];
  ctaText?: string;
}) {
  const url = `https://www.influanto.com${path}`;

  return (
    <>
      <Suspense><Header /></Suspense>
      <main className="bg-base-100">
        {/* Hero */}
        <section data-reveal className="max-w-5xl mx-auto px-6 pt-14 pb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">{eyebrow}</p>
          <h1 className="font-extrabold text-4xl lg:text-5xl tracking-tight mb-5">{h1}</h1>
          <p className="text-lg opacity-80 leading-relaxed max-w-3xl mx-auto mb-8">{subtitle}</p>
          <ButtonGetInfluanto text={ctaText} />
          <p className="text-sm opacity-60 mt-3">Free plan available. No credit card required.</p>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-extrabold text-center mb-8">What You Get</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} data-reveal className="bg-base-200 rounded-xl p-6 hover-lift" style={{ "--reveal-delay": `${Math.min(i, 6) * 80}ms` } as CSSProperties}>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="opacity-80 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-extrabold text-center mb-6">How It Works</h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={s} data-reveal="left" className="flex gap-4 items-start" style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}>
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content font-bold flex items-center justify-center">{i + 1}</span>
                <span className="pt-1 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <SeoContent sections={sections} faqs={faqs} related={related} />

        {/* Closing CTA */}
        <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
          <div data-reveal="zoom" className="bg-base-200 rounded-2xl p-8">
            <p className="text-xl font-extrabold mb-4">Start free on Influanto</p>
            <ButtonGetInfluanto text={ctaText} />
          </div>
        </section>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: appName,
            description: appDescription,
            url,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@type": "Organization", name: "Influanto", url: "https://www.influanto.com" },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Influanto", item: "https://www.influanto.com" },
              { "@type": "ListItem", position: 2, name: eyebrow, item: url },
            ],
          }}
        />
      </main>
      <Footer />
    </>
  );
}

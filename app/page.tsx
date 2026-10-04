import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { JsonLd } from "@/components/SeoContent";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Influanto — Link in Bio, Newsletter & Split Sheets for Indie Artists",
  description:
    "The all-in-one marketing platform for independent artists: link in bio, release pages, newsletter and mailing list, split sheet generator, QR codes, and a playlist curator contact tool. Free to start.",
  keywords: [
    "music marketing platform",
    "indie artist tools",
    "link in bio for musicians",
    "newsletter for musicians",
    "split sheet generator",
    "playlist curator tool",
    "qr code generator",
    "release pages",
  ],
  canonicalUrlRelative: "/",
});

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
        <Hero />
        <Problem />
        <FeaturesAccordion />
        <Pricing />
        <FAQ />
        <CTA />
      <Footer />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Influanto",
          url: "https://www.influanto.com",
          logo: "https://www.influanto.com/icon.png",
          sameAs: ["https://instagram.com/_influanto", "https://x.com/_influanto", "https://tiktok.com/@_influanto"],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Influanto",
          url: "https://www.influanto.com",
        }}
      />
    </>
  );
}
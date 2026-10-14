/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import FeatureLanding from "@/components/FeatureLanding";

export const metadata: Metadata = getSEOTags({
  title: "Split Sheets for Musicians — Create, Send & E-Sign | Influanto",
  description:
    "Why every song needs a split sheet, and how to make one in minutes: list contributors and ownership %, add publishing, send it to collaborators to e-sign, and download a PDF with an ownership chart.",
  keywords: [
    "split sheets",
    "music split sheet",
    "what is a split sheet",
    "how to make a split sheet",
    "split sheet e-signature",
    "songwriter split sheet",
    "producer split sheet",
    "split sheet app",
  ],
  canonicalUrlRelative: "/split-sheets",
  openGraph: {
    title: "Split Sheets for Musicians — Create, Send & E-Sign",
    description: "Make a split sheet in minutes, send it to collaborators to e-sign, and keep every song's ownership on record.",
    url: "https://www.influanto.com/split-sheets",
  },
});

export default function SplitSheetsLanding() {
  return (
    <FeatureLanding
      path="/split-sheets"
      eyebrow="Split Sheets"
      h1="Split Sheets: Agree on Who Owns the Song Before It Blows Up"
      subtitle="A split sheet records who wrote a song and what percentage each person owns. Create one in minutes, send it to your collaborators to sign online, and download a PDF for your records, your publisher, and your PRO."
      appName="Influanto Split Sheets"
      appDescription="Create music split sheets with contributor ownership, publishing details, e-signatures, and a downloadable PDF."
      ctaText="Create a Split Sheet Free"
      features={[
        { title: "Contributors & ownership", body: "List every writer and producer with their role and ownership %, and see the split as a live pie chart while you type." },
        { title: "Publishing details", body: "Add each contributor's publisher and publishing percentage alongside the writer splits." },
        { title: "Send & e-sign", body: "Email the split sheet to every collaborator so they can review and sign online — no printing or scanning." },
        { title: "PDF with ownership chart", body: "Download a clean PDF with contributors, publishing, signatures, agreement terms, and the ownership chart." },
        { title: "Remembers your collaborators", body: "Contributor and publishing details are saved to your contacts and auto-fill the next time you work with someone." },
        { title: "Free to start", body: "Use the free generator with no account, or save up to 5 split sheets on a free account. Influanto Pro is unlimited." },
      ]}
      steps={[
        "Enter the song title, date, and artists.",
        "Add each contributor's role and ownership percentage (it should total 100%), plus any publishing details.",
        "Send it to your collaborators to e-sign, or have everyone sign on the spot — then download the PDF.",
      ]}
      sections={[
        {
          heading: "Why You Need a Split Sheet",
          body: (
            <>
              <p>When a song gets placed on a playlist, synced to a show, or starts earning royalties, ownership can't come down to memory. Publishers, PROs like ASCAP, BMI, and SESAC, and distributors all rely on agreed splits to register the song and pay every writer correctly.</p>
              <p>A signed split sheet takes five minutes at the end of a session and prevents the disputes that end collaborations. Read more in <Link href="/blog/split-sheets-indie-artists" className="link link-primary">why split sheets are non-negotiable for indie collaborations</Link>.</p>
            </>
          ),
        },
        {
          heading: "How to Create One",
          body: (
            <p>
              Need one right now? Use the free <Link href="/Split-Sheet-Generator" className="link link-primary">split sheet generator</Link> — no account needed — or see exactly what to include in our <Link href="/Split-Sheet-Template" className="link link-primary">split sheet template</Link>. With a free Influanto account you can save your sheets, send them to collaborators to sign, and keep every song's splits in one place.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "What is a split sheet?", a: "A split sheet is a short agreement listing everyone who contributed to a song and the percentage of the song each person owns. All contributors sign it so royalties can be registered and paid correctly." },
        { q: "When should I fill out a split sheet?", a: "Before everyone leaves the session. Percentages are easy to agree on while the song is fresh, and much harder once it's released or earning money." },
        { q: "Can collaborators sign a split sheet online?", a: "Yes. Influanto emails the split sheet to each collaborator, and they can review and sign it online from any device." },
        { q: "Is creating a split sheet free?", a: "Yes. The split sheet generator is free with no account. A free Influanto account saves up to 5 split sheets with e-signatures; Influanto Pro makes it unlimited." },
      ]}
      related={[
        { href: "/Split-Sheet-Generator", label: "Free split sheet generator" },
        { href: "/Split-Sheet-Template", label: "Split sheet template" },
        { href: "/blog/split-sheets-indie-artists", label: "Why split sheets matter" },
      ]}
    />
  );
}

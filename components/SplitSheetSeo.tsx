import Link from "next/link";
import SeoContent from "@/components/SeoContent";

// Explainer + FAQ shown under the public split sheet generator and template.

const FAQS = [
  { q: "What is a music split sheet?", a: "A split sheet is a short agreement that records who wrote a song and what percentage of the song each writer owns. Everyone who contributed signs it, ideally on the day the song is made, so royalties can be registered and paid correctly later." },
  { q: "What should a split sheet include?", a: "The song title, the date, the artist(s), every contributor's name, role, ownership percentage, and contact info, publishing details (publisher and publishing percentage, plus PRO and IPI numbers if known), and each contributor's signature and date." },
  { q: "Is this split sheet generator free?", a: "Yes. Fill in the form and download your split sheet as a PDF for free, no account required. With a free Influanto account you can also save up to 5 split sheets, send them to collaborators by email, and collect e-signatures." },
  { q: "Do split sheets need to be notarized?", a: "No. A split sheet signed by every contributor is generally enough to document ownership. For large deals or disputes, have an entertainment lawyer review your agreements." },
  { q: "When should you fill out a split sheet?", a: "Before everyone leaves the session. Percentages are easy to agree on while the song is fresh and much harder to settle after it gets placed, licensed, or starts earning." },
  { q: "How are split sheet percentages decided?", a: "There's no fixed rule — collaborators agree on percentages based on each person's contribution to the lyrics, melody, and composition. Many writers split evenly among everyone in the room. The total for the composition must add up to 100%." },
];

export default function SplitSheetSeo({ variant }: { variant: "generator" | "template" }) {
  return (
    <SeoContent
      className="bg-base-100"
      sections={[
        {
          heading: variant === "generator" ? "How to Use the Split Sheet Generator" : "How to Use This Split Sheet Template",
          body: (
            <ol className="list-decimal pl-6 space-y-1">
              <li>Enter the song title, date of creation, and artist names.</li>
              <li>Add every contributor with their role (writer, producer, topliner) and ownership percentage — make sure it totals 100%.</li>
              <li>Add publishing details for anyone with a publisher.</li>
              <li>Have each contributor sign, then download the split sheet as a PDF and share a copy with everyone.</li>
            </ol>
          ),
        },
        {
          heading: "Why Every Song Needs a Split Sheet",
          body: (
            <>
              <p>Without a signed split sheet, ownership of a song comes down to memory — and memories differ once a song gets placed on a playlist, synced to a show, or starts earning royalties. Publishers, PROs like ASCAP, BMI, and SESAC, and distributors all rely on agreed splits to pay writers correctly.</p>
              <p>
                A split sheet takes five minutes to fill out at the end of a session. Read more in{" "}
                <Link href="/blog/split-sheets-indie-artists" className="link link-primary">why split sheets are non-negotiable for indie collaborations</Link>.
              </p>
            </>
          ),
        },
        {
          heading: "Save, Send, and E-Sign Split Sheets",
          body: (
            <p>
              With a free Influanto account you can save your split sheets, keep your collaborators&apos; details as contacts, email the sheet to every contributor, and collect signatures online. Your saved collaborators&apos; roles and publishing info auto-fill on your next split sheet.{" "}
              <Link href="/dashboard" className="link link-primary">Create a free account</Link>.
            </p>
          ),
        },
      ]}
      faqs={FAQS}
      related={[
        variant === "generator"
          ? { href: "/Split-Sheet-Template", label: "Split sheet template" }
          : { href: "/Split-Sheet-Generator", label: "Split sheet generator" },
        { href: "/blog/split-sheets-indie-artists", label: "Why split sheets matter" },
        { href: "/tools", label: "More free music tools" },
      ]}
    />
  );
}

/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { getSEOTags } from "@/libs/seo";
import FeatureLanding from "@/components/FeatureLanding";

export const metadata: Metadata = getSEOTags({
  title: "Free QR Code Generator for Musicians — Custom Styles & Dynamic QR | Influanto",
  description:
    "Create custom QR codes for your music, link in bio, merch, and flyers. Pick dot and corner styles, download PNG or SVG, and upgrade for dynamic QR codes with scan analytics.",
  keywords: [
    "qr code generator",
    "free qr code generator",
    "custom qr code generator",
    "dynamic qr code generator",
    "qr code with analytics",
    "qr code generator for musicians",
    "qr code for music",
    "qr code for link in bio",
  ],
  canonicalUrlRelative: "/qr-code-generator",
  openGraph: {
    title: "Free QR Code Generator for Musicians",
    description: "Custom-styled QR codes for your music, link in bio, and merch — with dynamic QR codes and scan analytics on Pro.",
    url: "https://www.influanto.com/qr-code-generator",
  },
});

export default function QrCodeLanding() {
  return (
    <FeatureLanding
      path="/qr-code-generator"
      eyebrow="QR Code Generator"
      h1="Free QR Code Generator for Musicians and Creators"
      subtitle="Turn your link in bio, a new release, or your merch store into a custom QR code for flyers, posters, stickers, and live shows — styled to match your artwork."
      appName="Influanto QR Code Generator"
      appDescription="A QR code generator with custom dot and corner styles, PNG/SVG downloads, and dynamic QR codes with scan analytics."
      ctaText="Create a QR Code Free"
      features={[
        { title: "Custom styles", body: "Choose the dot style, corner shapes, colors, and size, and see a live preview before you download." },
        { title: "PNG and SVG downloads", body: "Download a PNG for social posts or an SVG that stays sharp on posters, banners, and merch at any size." },
        { title: "Point it anywhere", body: "Link to your Influanto link in bio, a release page, your merch store, a YouTube video, or any URL." },
        { title: "Dynamic QR codes (Pro)", body: "Change where a code points after it's printed — the QR image stays the same, so old flyers send fans to your newest release." },
        { title: "Scan analytics (Pro)", body: "See how many times each code was scanned, so you know which flyer, poster, or venue actually worked." },
        { title: "Keep them organized", body: "Name and save your codes in your dashboard — 10 on the free plan, 50 on Influanto Pro." },
      ]}
      steps={[
        "Sign up free and open the QR Code Generator in your dashboard.",
        "Paste your link, give the code a name, and pick your styles and colors.",
        "Download it as PNG or SVG and put it on your flyers, stickers, posters, or merch.",
      ]}
      sections={[
        {
          heading: "QR Codes Are Guerrilla Marketing for Indie Artists",
          body: (
            <>
              <p>A QR code on a flyer, sticker, or merch table turns someone walking past into a listener in one scan. Point it at your link in bio and every scan can become a stream, a merch sale, or a new subscriber on your mailing list.</p>
              <p>With a dynamic QR code, the code you printed months ago can point to whatever you're promoting today — no reprinting needed.</p>
            </>
          ),
        },
      ]}
      faqs={[
        { q: "Is the QR code generator free?", a: "Yes. The free plan lets you create and save up to 10 custom QR codes with your choice of dot and corner styles, and download them as PNG or SVG. Influanto Pro raises that to 50 codes and adds dynamic QR codes, multi-color styling, and scan analytics." },
        { q: "What is a dynamic QR code?", a: "A dynamic QR code lets you change the destination URL after the code is printed. The QR image stays the same, so existing flyers and posters keep working and send people to your new link." },
        { q: "Can I track how many people scan my QR code?", a: "Yes, on Influanto Pro. Each code has scan analytics so you can compare which flyers, venues, or posters drive the most scans." },
        { q: "Do Influanto QR codes expire?", a: "No. Your QR codes keep working as long as they're saved in your account." },
      ]}
      related={[
        { href: "/link-in-bio", label: "Link in bio for musicians" },
        { href: "/blog/guerrilla-marketing-qr-codes-indie-artists", label: "Guerrilla marketing with QR codes" },
        { href: "/tools", label: "Free music tools" },
      ]}
    />
  );
}

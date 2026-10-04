/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { getSEOTags } from "@/libs/seo";
import FeatureLanding from "@/components/FeatureLanding";

export const metadata: Metadata = getSEOTags({
  title: "Newsletter & Mailing List Management for Indie Artists | Influanto",
  description:
    "Build and manage a mailing list as an independent artist. Collect emails from your link in bio, import contacts, and send newsletters and release announcements — free to start.",
  keywords: [
    "newsletter for musicians",
    "indie artist newsletter",
    "mailing list for musicians",
    "indie artist mailing list",
    "mailing list management",
    "newsletter management",
    "email newsletter for artists",
    "fan mailing list",
    "link in bio and newsletter",
  ],
  canonicalUrlRelative: "/newsletter",
  openGraph: {
    title: "Newsletter & Mailing List Management for Indie Artists",
    description: "Collect emails from your link in bio, manage your contacts, and send newsletters and release announcements.",
    url: "https://www.influanto.com/newsletter",
  },
});

export default function NewsletterLanding() {
  return (
    <FeatureLanding
      path="/newsletter"
      eyebrow="Newsletter & Mailing List"
      h1="Newsletter and Mailing List Management for Independent Artists"
      subtitle="Grow a fan mailing list from your link in bio, keep your contacts in one place, and send newsletters and release announcements that reach every fan — not just the ones the algorithm picks."
      appName="Influanto Newsletter & Mailing List"
      appDescription="Newsletter and mailing list management for independent artists, with a signup form on your link in bio and contact import."
      features={[
        { title: "Signup on your link in bio", body: "Fans subscribe right from your Influanto link in bio, so your mailing list grows every time someone taps the link in your bio." },
        { title: "Hosted and embeddable signup forms", body: "Share a hosted signup page or embed the form on your own website to collect subscribers wherever fans find you." },
        { title: "Import your existing list", body: "Upload a CSV of the contacts you already have — email, name, phone, Instagram, TikTok — and Influanto maps the columns for you, skipping duplicates." },
        { title: "Release announcement templates", body: "Start from a template for a new single, album, or music video — or a blank newsletter — then send it to your whole list." },
        { title: "All your contacts in one place", body: "See and manage every subscriber in your dashboard, alongside your release pages and link in bio." },
        { title: "Free to start", body: "The free plan covers 50 contacts and 5 newsletters. Influanto Pro unlocks unlimited contacts and newsletters." },
      ]}
      steps={[
        "Sign up free and turn on the newsletter signup on your link in bio.",
        "Import any emails you already have, or share your signup form to start collecting new ones.",
        "Pick a template, write your update, and send it to your mailing list on release day.",
      ]}
      sections={[
        {
          heading: "Why Indie Artists Need a Mailing List",
          body: (
            <>
              <p>Followers on Instagram or TikTok are rented — a change to the algorithm can cut your reach overnight. Your mailing list is the one audience you own, and email consistently drives more streams and sales per fan than a social post.</p>
              <p>Influanto connects your link in bio and your newsletter, so the page fans already visit becomes the place your list grows.</p>
            </>
          ),
        },
      ]}
      faqs={[
        { q: "Is there a free newsletter tool for musicians?", a: "Yes. Influanto's free plan includes newsletter and mailing list tools for up to 50 contacts and 5 newsletters. Influanto Pro removes those limits." },
        { q: "How do I build a mailing list as an independent artist?", a: "Put a signup form where fans already go — your link in bio — and offer a reason to join, like early access to new releases. With Influanto, the signup form is built into your link in bio and subscribers go straight into your contacts." },
        { q: "Can I import my existing email list?", a: "Yes. Upload a CSV file and Influanto maps the name and email columns automatically, skipping duplicates and invalid addresses." },
        { q: "Can I embed the signup form on my own website?", a: "Yes. Influanto gives you a hosted signup page and an embeddable form you can add to any website." },
      ]}
      related={[
        { href: "/link-in-bio", label: "Link in bio for musicians" },
        { href: "/blog/newsletter-for-independent-artists", label: "Why every artist needs a newsletter" },
        { href: "/playlist-curator-tool", label: "Playlist curator contact tool" },
      ]}
    />
  );
}

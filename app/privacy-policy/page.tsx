import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold mb-3">{title}</h2>
    <div className="space-y-3 leading-relaxed text-gray-800">{children}</div>
  </section>
);

const PrivacyPolicy = () => {
  return (
    <main className="max-w-2xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{" "}
          Back
        </Link>

        <div className="flex items-center gap-3 mt-4 mb-2">
          <Image src="/icon.png" alt={`${config.appName} icon`} width={40} height={40} className="rounded-lg" />
          <span className="text-lg font-bold">{config.appName}</span>
        </div>

        <h1 className="text-3xl font-extrabold pb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 5, 2026</p>

        <p className="mb-8 leading-relaxed">
          Thank you for using influanto ("we," "us," or "our"). This Privacy Policy explains how we collect,
          use, share, and protect information when you use our website at{" "}
          <a href="https://influanto.com" className="link">influanto.com</a> and the services offered
          through it (the "Service"). By using the Service, you agree to this Privacy Policy. If you do not
          agree, please do not use the Service.
        </p>

        <Section title="1. Information We Collect">
          <p className="font-semibold">Account information.</p>
          <p>
            When you sign in with Google or via a one-time email link, we receive your name, email address,
            and (if you use Google) your profile picture.
          </p>
          <p className="font-semibold">Profile & content you provide.</p>
          <p>
            Information you add to build your pages — such as your bio, location, streaming/social media
            links, uploaded images (album art, logos), release page and link-in-bio content, split sheets,
            QR codes, digital business card details, and outreach/newsletter contact lists.
          </p>
          <p className="font-semibold">Connected third-party accounts.</p>
          <p>
            If you choose to connect a Printify store or a social media account (Instagram, TikTok, YouTube),
            we store the access tokens and account identifiers needed to perform the specific action you
            request — such as fetching your merch catalog or publishing content you select to your own
            connected account. We only use this access for the feature you activate; we do not access these
            accounts for any other purpose, and you can disconnect them at any time from your dashboard.
          </p>
          <p className="font-semibold">Payment information.</p>
          <p>
            If you purchase a paid plan, payment is processed by Stripe. We do not store your full card
            details on our servers.
          </p>
          <p className="font-semibold">Usage & analytics data.</p>
          <p>
            We and our analytics providers (including Google Analytics, PostHog, Plausible, Ahrefs, and Meta
            Pixel/Conversions API) automatically collect non-personal technical information such as IP
            address, browser and device type, pages viewed, and referring pages, using cookies and similar
            technologies. When your fans visit your public link-in-bio or release pages, we also record
            aggregate visit analytics (country, city, device, browser, referrer) so you can see how your
            pages are performing — we do not sell this information.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-6 space-y-1">
            <li>To create and operate your account and the pages/tools you build with the Service;</li>
            <li>To process payments and manage subscriptions;</li>
            <li>To fetch your merch or publish content to a third-party account, only when you initiate that action;</li>
            <li>To send you service-related emails (magic-link sign-in, welcome emails, billing notices) and, if you opt in, product updates;</li>
            <li>To provide you with analytics about your pages and audience;</li>
            <li>To detect, prevent, and address fraud, abuse, and security issues; and</li>
            <li>To improve and develop the Service.</li>
          </ul>
        </Section>

        <Section title="3. TikTok, Instagram & YouTube Integrations">
          <p>
            The Service allows you to connect your own TikTok, Instagram, or YouTube account so you can
            publish content you create to that account through influanto's dashboard. We access these
            integrations only when you take an action that requires them (for example, clicking "publish" or
            "cross-post"), and only to perform that action on your behalf. We do not post automatically, and
            we do not use data from these platforms for advertising or share it with third parties for their
            own purposes. You can review or revoke a connected account's access at any time from your
            dashboard, which stops any further access immediately. Use of these integrations is also subject
            to the respective platform's own terms and developer policies.
          </p>
        </Section>

        <Section title="4. How We Share Information">
          <p>
            We do not sell your personal information. We share information only with the service providers
            necessary to operate the Service, including:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Stripe (payment processing);</li>
            <li>Supabase (database hosting);</li>
            <li>Cloudinary (image storage and delivery);</li>
            <li>Our email delivery providers (magic-link sign-in and transactional/newsletter email);</li>
            <li>Printify (merch catalog and fulfillment, if you connect a store); and</li>
            <li>TikTok, Instagram, and YouTube (only when you direct us to publish content to your own connected account on that platform).</li>
          </ul>
          <p>
            We may also disclose information if required by law, to protect our rights, or in connection with
            a merger, acquisition, or sale of assets.
          </p>
        </Section>

        <Section title="5. Data Retention & Your Rights">
          <p>
            We retain your information for as long as your account is active or as needed to provide the
            Service, comply with legal obligations, and resolve disputes. You may request access to,
            correction of, or deletion of your personal information, or export of your data, at any time by
            emailing <a href="mailto:info@influanto.com" className="link">info@influanto.com</a>. Deleting your
            account removes your profile and page content; some records may be retained where required by
            law (for example, billing records).
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            We use cookies and similar technologies to keep you signed in, remember your preferences, and
            understand how the Service is used. You can control cookies through your browser settings; note
            that disabling cookies may affect how the Service functions.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            influanto is not directed to children under 13, and we do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with personal
            information, contact us at{" "}
            <a href="mailto:info@influanto.com" className="link">info@influanto.com</a> and we will delete it.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We use reasonable administrative, technical, and physical safeguards to protect your information.
            No method of transmission or storage is completely secure, so we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section title="9. International Users">
          <p>
            The Service is operated from the United States, and your information may be processed and stored
            there. By using the Service, you consent to this transfer.
          </p>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify
            you by email or through the Service. The "Last updated" date above reflects the most recent
            revision.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            Questions about this Privacy Policy or your data? Contact us at{" "}
            <a href="mailto:info@influanto.com" className="link">info@influanto.com</a>.
          </p>
        </Section>
      </div>
    </main>
  );
};

export default PrivacyPolicy;

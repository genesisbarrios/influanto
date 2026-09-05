import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Terms of Service | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold mb-3">{title}</h2>
    <div className="space-y-3 leading-relaxed text-gray-800">{children}</div>
  </section>
);

const TOS = () => {
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
          </svg>
          Back
        </Link>

        <div className="flex items-center gap-3 mt-4 mb-2">
          <Image src="/icon.png" alt={`${config.appName} icon`} width={40} height={40} className="rounded-lg" />
          <span className="text-lg font-bold">{config.appName}</span>
        </div>

        <h1 className="text-3xl font-extrabold pb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 5, 2026</p>

        <p className="mb-8 leading-relaxed">
          These Terms of Service ("Terms") govern your access to and use of the influanto website at{" "}
          <a href="https://influanto.com" className="link">influanto.com</a> and the services offered
          through it (together, the "Service"), operated by influanto ("influanto," "we," "us," or "our").
          By creating an account or otherwise using the Service, you agree to be bound by these Terms and by
          our <Link href="/privacy-policy" className="link">Privacy Policy</Link>. If you do not agree, do
          not use the Service.
        </p>

        <Section title="1. What influanto Is">
          <p>
            influanto is an all-in-one marketing platform for artists and musicians. Depending on your plan,
            the Service may include: link-in-bio pages, release pages, QR code generation, split sheets,
            digital business cards, an outreach/newsletter tool for contacting fans and playlist curators,
            merch integration through a connected Printify store, and the ability to connect social media
            accounts (such as Instagram, TikTok, and YouTube) to publish content you create to your own
            accounts on those platforms.
          </p>
        </Section>

        <Section title="2. Eligibility & Accounts">
          <p>
            You must be at least 13 years old to use the Service. If you are between 13 and 18, you may only
            use the Service with the involvement and consent of a parent or legal guardian.
          </p>
          <p>
            You create an account by signing in with Google or via a one-time email link. You are
            responsible for maintaining the security of your account and for all activity that occurs under
            it. Notify us immediately at <a href="mailto:info@influanto.com" className="link">info@influanto.com</a> if
            you suspect unauthorized use of your account.
          </p>
        </Section>

        <Section title="3. Your Content">
          <p>
            "User Content" means anything you upload, submit, or create using the Service — including
            images, text, links, contact lists, and split sheets. You retain ownership of your User Content.
          </p>
          <p>
            By submitting User Content, you grant influanto a non-exclusive, worldwide, royalty-free license
            to host, store, reproduce, and display it solely as necessary to operate and provide the Service
            to you (for example, rendering your public link-in-bio or release page, or sending your
            newsletter to your contacts).
          </p>
          <p>
            You are solely responsible for your User Content and represent that you have the rights necessary
            to use, upload, and share it, and that it does not infringe any third party's rights or violate
            any law.
          </p>
        </Section>

        <Section title="4. Connected Third-Party Accounts & Social Publishing">
          <p>
            The Service lets you optionally connect third-party accounts, including a Printify store (to
            feature your merch) and social media accounts such as Instagram, TikTok, and YouTube (to publish
            content to your own profile on those platforms).
          </p>
          <p>
            When you connect a social media account and choose to publish or cross-post content through
            influanto, you are directing us to submit that specific, user-selected content to your own
            account on that platform using its official publishing API, on your instruction. We do not post,
            schedule, or publish anything to a connected account without an action you take. You can
            disconnect any connected account at any time from your dashboard, which revokes our access to it.
          </p>
          <p>
            Your use of any connected platform remains subject to that platform's own terms of service and
            content policies (for example, TikTok's Terms of Service and Community Guidelines). influanto is
            not responsible for the availability, content policies, or actions of third-party platforms, and
            we may disable a connected-platform feature at any time if required by that platform.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post, publish, or send content that is illegal, infringing, defamatory, or that you do not have the right to share;</li>
            <li>Send unsolicited bulk messages ("spam") through the outreach/newsletter tool, or contact people who have not agreed to hear from you;</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with one;</li>
            <li>Scrape, reverse-engineer, or interfere with the Service or attempt to gain unauthorized access to it or to other users' accounts or data;</li>
            <li>Use automated means (bots, scripts) to create accounts or access the Service, except through any API we officially provide; or</li>
            <li>Violate the terms, policies, or guidelines of any third-party platform (including TikTok, Instagram, YouTube, Printify, or your payment provider) accessed through the Service.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate this section.</p>
        </Section>

        <Section title="6. Plans, Billing & Cancellation">
          <p>
            influanto offers a free plan and paid plans (subscription and one-time), billed and processed
            securely through Stripe. We do not store your full payment card details on our servers.
          </p>
          <p>
            Subscriptions renew automatically until you cancel. You can cancel anytime from your account's
            billing portal; cancellation takes effect at the end of your current billing period, and we do
            not provide prorated refunds for partial periods. If you're unhappy with a purchase, you may
            request a refund within 7 days of your purchase by emailing{" "}
            <a href="mailto:info@influanto.com" className="link">info@influanto.com</a>.
          </p>
        </Section>

        <Section title="7. Termination">
          <p>
            You may stop using the Service and delete your account at any time. We may suspend or terminate
            your access to the Service if you violate these Terms, at our reasonable discretion, or if
            required to do so by a third-party platform we integrate with. Upon termination, your right to
            use the Service ends, though certain provisions of these Terms (such as Sections 3, 8, and 9)
            survive.
          </p>
        </Section>

        <Section title="8. Disclaimers & Limitation of Liability">
          <p>
            The Service is provided "as is" and "as available," without warranties of any kind, express or
            implied, including merchantability, fitness for a particular purpose, and non-infringement. We do
            not guarantee that the Service, or any third-party platform it connects to, will be uninterrupted,
            error-free, or continuously available.
          </p>
          <p>
            To the fullest extent permitted by law, influanto will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for any loss of profits, data, or goodwill,
            arising from your use of the Service. Our total liability for any claim arising from these Terms
            or the Service will not exceed the amount you paid us in the 12 months before the claim arose.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Florida, USA, without regard to its
            conflict-of-laws principles. Any dispute arising from these Terms or the Service will be resolved
            in the state or federal courts located in Florida, and you consent to their jurisdiction.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we will notify you by
            email or through the Service. Continuing to use the Service after changes take effect constitutes
            acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:info@influanto.com" className="link">info@influanto.com</a>.
          </p>
        </Section>
      </div>
    </main>
  );
};

export default TOS;

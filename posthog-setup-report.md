<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Influanto Next.js App Router project. The following changes were made:

- **`app/providers.tsx`** (new): PostHog client-side provider, initializes `posthog-js` with a reverse-proxy ingestion path (`/ingest`), error tracking, and debug mode in development.
- **`app/layout.tsx`**: Wrapped the app with `<PostHogProvider>` so all pages are covered. The PostHog provider sits outside `<SessionProvider>` so it initializes before any session-dependent code.
- **`next.config.js`**: Added three reverse-proxy rewrites (`/ingest/static/*`, `/ingest/array/*`, `/ingest/*`) routing PostHog traffic through the Next.js server to improve ad-blocker resistance. Also added `skipTrailingSlashRedirect: true`.
- **`libs/posthog-server.ts`** (new): Server-side PostHog client factory using `posthog-node`, configured for immediate flushing (`flushAt: 1`, `flushInterval: 0`).
- **`components/LayoutClient.tsx`**: Added `posthog.identify()` call whenever a NextAuth session is available, linking all events to the known user.
- **`components/ButtonSignin.tsx`**: Captures `sign_in_clicked` when an unauthenticated user presses sign in.
- **`components/ButtonCheckout.tsx`**: Captures `checkout_started` with `price_id` and `mode` properties before redirecting to Stripe. Captures exceptions on failure.
- **`components/ButtonLead.tsx`**: Captures `lead_captured` with `email` on successful waitlist signup. Captures exceptions on failure.
- **`app/dashboard/page.tsx`**: Captures `dashboard_tab_switched` with the `tab` name on every sidebar navigation.
- **`app/dashboard/LinkInBio.tsx`**: Captures `link_in_bio_saved` with `links_count` on successful save. Captures exceptions on failure.
- **`app/dashboard/ReleasePage.tsx`**: Captures `release_page_created` (new pages) and `release_page_saved` (updates) with page name/ID. Captures exceptions on failure.
- **`app/dashboard/Profile.tsx`**: Captures `profile_updated` in the finally block after save. Captures exceptions on failure.
- **`app/api/webhook/stripe/route.ts`**: Server-side capture of `subscription_completed` (on `checkout.session.completed`) and `subscription_cancelled` (on `customer.subscription.deleted`) using `posthog-node`, with plan and customer properties.
- **`app/dashboard/QRCodeGenerator.tsx`**: Captures `qr_code_created` (with name, dot_style, and is_premium properties), `qr_code_downloaded` (with name and format), and `qr_code_deleted` (with qr_code_id). Captures exceptions on failure.
- **`app/dashboard/CuratorSearch.tsx`**: Captures `curator_searched` with genre and results_count after each successful fetch. Captures exceptions on failure.

## Events tracked

| Event | Description | File |
|-------|-------------|------|
| `sign_in_clicked` | User clicked the sign in button on any page | `components/ButtonSignin.tsx` |
| `checkout_started` | User clicked checkout to start a Stripe payment/subscription | `components/ButtonCheckout.tsx` |
| `lead_captured` | User submitted their email to join the waitlist | `components/ButtonLead.tsx` |
| `dashboard_tab_switched` | User switched to a different tab in the dashboard sidebar | `app/dashboard/page.tsx` |
| `link_in_bio_saved` | User saved their Link in Bio page settings | `app/dashboard/LinkInBio.tsx` |
| `release_page_created` | User created a new release page | `app/dashboard/ReleasePage.tsx` |
| `release_page_saved` | User saved/updated an existing release page | `app/dashboard/ReleasePage.tsx` |
| `profile_updated` | User saved changes to their profile | `app/dashboard/Profile.tsx` |
| `subscription_completed` | Server-side: Stripe checkout completed — user subscribed | `app/api/webhook/stripe/route.ts` |
| `subscription_cancelled` | Server-side: Stripe subscription deleted — churn event | `app/api/webhook/stripe/route.ts` |
| `qr_code_created` | User created a new QR code | `app/dashboard/QRCodeGenerator.tsx` |
| `qr_code_downloaded` | User downloaded a QR code as PNG or SVG | `app/dashboard/QRCodeGenerator.tsx` |
| `qr_code_deleted` | User deleted a QR code | `app/dashboard/QRCodeGenerator.tsx` |
| `curator_searched` | User searched for Spotify playlist curators by genre | `app/dashboard/CuratorSearch.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1610690)
- [QR Code Activity](/insights/reRfvNhc) — QR codes created, downloaded, and deleted over time
- [Curator Searches Over Time](/insights/faKfIoVa) — how often users search for playlist curators by genre
- [Checkout to Subscription Funnel](/insights/d9p4z2iB) — conversion rate from checkout intent to paid subscriber
- [Dashboard Feature Engagement](/insights/yRfNIFho) — which dashboard tabs users use most
- [Subscription Churn](/insights/Z2UJ6DBs) — weekly cancellation trend

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

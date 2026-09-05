import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import { Analytics } from "@vercel/analytics/next"
import { PostHogWrapper } from "@/app/providers";
import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config as fontawesomeConfig } from "@fortawesome/fontawesome-svg-core";

// Load the icon-sizing CSS as a normal stylesheet instead of letting the
// library inject it client-side on mount — the injected version can lose
// the race on a fresh page load, leaving icons briefly (or, on a slow
// hydration, indefinitely) rendered at their raw un-styled SVG size.
fontawesomeConfig.autoAddCss = false;


const font = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className={font.className} style={{ backgroundColor: "var(--bg-color)" }}>
      {config.domainName && (
        
        <head>
          <PlausibleProvider domain={config.domainName} />
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y8YZX4PWTB" />
          <script

          dangerouslySetInnerHTML={{
          __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-Y8YZX4PWTB');
          `,
        }}/>
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="V99pP2dI1JT1hXRZGzOaIQ" async></script>
        <meta name="facebook-domain-verification" content="wlmap6a9b74lr7qzry02c1y7qo9bq7" />
        </head>
      )}
      <body>
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <PostHogWrapper>
          <ClientLayout>
            {children}
            <Analytics />
          </ClientLayout>
        </PostHogWrapper>
      </body>
    </html>
  );
}

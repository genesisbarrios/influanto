import themes from "daisyui/src/theming/themes";
import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "influanto",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The all in one marketing platform for artists and musicians.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "influanto.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (mailgun.supportEmail) otherwise customer support won't work.
    id: "04e1381d-3c21-45f4-8205-81bca626cc91",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? ""
            : "",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Starter",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for small projects",
        // The price you want to display, the one user will be charged on Stripe.
        price: 0,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 4.99,
        features: [
          {
            name: "Link In Bio Page",
          },
          { name: "Release Pages (10)" },
          { name: "QR Code Generator" },
          { name: "Create Split Sheets (up to 5)" },
          { name: "Outreach (up to 50 contacts, 5 newsletters)" },
          { name: "Playlist Curator Search / Contact Tool" },
          { name: "Display your Merch with Printify" },
        ],
      },
      {
        priceId:
          process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ||
          "price_1Rxb4IHYk9DUtBP3UrdhTmAl",
        mode: "subscription",
        // In development, set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID to the test-mode price.
        // In production, set it to the live-mode price.
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        name: "Influanto Pro",
        description: "You need more power",
        price: "7.99",
        priceAnchor: 14.99,
        features: [
          {
            name: "Link in Bio Page",
          },
          { name: "Release Pages (50)" },
          { name: "Unlimited Outreach Contacts & Newsletters" },
          { name: "Create Unlimited Split Sheets" },
          { name: "Analytics" },
          { name: "Advanced QR Code Generator" },
        ],
      },
      {
        priceId:
          process.env.NEXT_PUBLIC_STRIPE_FOREVER_PRICE_ID ||
          "price_1TdjLpHYk9DUtBP36C1IRYhC",
        mode: "payment",
        // In development, set NEXT_PUBLIC_STRIPE_FOREVER_PRICE_ID to the test-mode price.
        // In production, set it to the live-mode price.
        isFeatured: true,
        name: "Influanto Forever",
        description: "Influanto Pro but for life, one payment, no subscription",
        price: "69.99",
        priceAnchor: 99.99,
        features: [
          {
            name: "Link in Bio Page",
          },
          { name: "Release Pages (50)" },
          { name: "Unlimited Outreach Contacts & Newsletters" },
          { name: "Create Unlimited Split Sheets" },
          { name: "Analytics" },
          { name: "Advanced QR Code Generator" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  mailgun: {
    // subdomain to use when sending emails, if you don't have a subdomain, just remove it. Highly recommended to have one (i.e. mg.yourdomain.com or mail.yourdomain.com)
    subdomain: "",
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `influanto <noreply@influanto.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `info at influanto <info@influanto.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "info@influanto.com",
    // When someone replies to supportEmail sent by the app, forward it to the email below (otherwise it's lost). If you set supportEmail to empty, this will be ignored.
    forwardRepliesTo: "info@influanto.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "aqua",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: themes["aqua"]["pastel"]
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;

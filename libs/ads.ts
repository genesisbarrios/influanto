// Google AdSense publisher ID. It's public (it appears in every page that shows
// ads); NEXT_PUBLIC_ADSENSE_CLIENT can override it.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-5160839714052637";

// Responsive display unit for the tool pages; NEXT_PUBLIC_ADSENSE_TOOLS_SLOT can override it.
// Empty until an ad unit exists in this AdSense account: AdSlot then loads the
// script alone so Auto ads can place ads.
export const ADSENSE_TOOLS_SLOT = process.env.NEXT_PUBLIC_ADSENSE_TOOLS_SLOT || "";

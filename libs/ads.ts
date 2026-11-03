// Google AdSense publisher ID. It's public (it appears in every page that shows
// ads); NEXT_PUBLIC_ADSENSE_CLIENT can override it.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-5160839714052637";

// Responsive display unit "Influanto footer" (sized by CSS in AdSlot);
// NEXT_PUBLIC_ADSENSE_TOOLS_SLOT can override it. AdSlot shows nothing (and
// loads no AdSense script) when this is empty.
export const ADSENSE_TOOLS_SLOT = process.env.NEXT_PUBLIC_ADSENSE_TOOLS_SLOT || "6679065667";

// Extracts a preview image + title from a web page's HTML (og:image, twitter:image,
// JSON-LD Product image, <link rel="image_src">). Used by /api/link-preview.

function decodeEntities(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2F;/gi, "/").trim();
}

function attr(tag: string, name: string) {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? decodeEntities(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function jsonLdImage(html: string): string | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1].trim());
      const nodes: any[] = [];
      const walk = (n: any) => {
        if (!n || typeof n !== "object") return;
        if (Array.isArray(n)) return n.forEach(walk);
        nodes.push(n);
        if (n["@graph"]) walk(n["@graph"]);
      };
      walk(data);
      const product = nodes.find((n) => [].concat(n["@type"] || []).some((t: string) => /product/i.test(t))) || nodes.find((n) => n.image);
      let img = product?.image;
      if (Array.isArray(img)) img = img[0];
      if (img && typeof img === "object") img = img.url || img.contentUrl;
      if (typeof img === "string" && img) return img;
    } catch { /* malformed JSON-LD */ }
  }
  return null;
}

export function extractPreview(html: string, baseUrl: string) {
  const metas: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = (attr(tag, "property") || attr(tag, "name") || attr(tag, "itemprop") || "").toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !(key in metas)) metas[key] = content;
  }
  const linkImage = /<link\b[^>]*rel=["']image_src["'][^>]*>/i.exec(html);
  const candidates = [
    metas["og:image:secure_url"], metas["og:image"], metas["og:image:url"],
    metas["twitter:image"], metas["twitter:image:src"],
    jsonLdImage(html),
    linkImage ? attr(linkImage[0], "href") : null,
    metas["image"],
  ];
  let image: string | null = null;
  for (const c of candidates) {
    if (!c || c.startsWith("data:")) continue;
    try {
      const abs = new URL(c.startsWith("//") ? "https:" + c : c, baseUrl);
      if (abs.protocol === "http:" || abs.protocol === "https:") { image = abs.toString(); break; }
    } catch { /* bad url */ }
  }
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = metas["og:title"] || metas["twitter:title"] || (titleTag ? decodeEntities(titleTag[1].replace(/\s+/g, " ")) : null);
  return { image, title: title ? title.slice(0, 120) : null };
}

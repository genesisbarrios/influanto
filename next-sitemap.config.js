module.exports = {
  // The apex domain (no www) 308-redirects to www — the site's canonical
  // tags all resolve to https://www.influanto.com, so the sitemap needs to
  // match or every URL in it round-trips through a redirect.
  siteUrl: process.env.SITE_URL || "https://www.influanto.com",
  generateRobotsTxt: true,
  // use this to exclude routes from the sitemap (i.e. a user dashboard). By default, NextJS app router metadata files are excluded (https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
  exclude: ["/twitter-image.*", "/opengraph-image.*", "/icon.*", "/apple-icon.*", "/favicon.*", "/blocked"],
};

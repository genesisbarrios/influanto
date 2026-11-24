// Music-industry roles a user can tag their profile with. Shown in small
// text on the dashboard Profile preview and the Community tab — never on
// the public Link in Bio page.
export const MUSIC_CATEGORIES = [
  "Artist",
  "Producer",
  "Songwriter",
  "Composer",
  "Recording Engineer",
  "Mixing Engineer",
  "Mastering Engineer",
  "Instrumentalist",
  "DJ",
  "Vocalist",
  "A&R",
  "Manager",
  "Tour Manager",
  "Booking Agent",
  "Publicist",
  "Marketing",
  "Label Executive",
  "Music Supervisor",
  "Distributor",
  "Photographer",
  "Videographer",
  "Graphic Designer",
  "Stylist",
  "Choreographer",
  "Lawyer",
  "Podcaster",
  "Content Creator",
  "Writer",
] as const;

export type MusicCategory = (typeof MUSIC_CATEGORIES)[number];

// Jobs outside music. People who only picked these don't get split sheets
// (song ownership), just Documents (any PDF sent out for signature).
export const NON_MUSIC_CATEGORIES: readonly string[] = [
  "Writer",
  "Photographer",
  "Videographer",
  "Graphic Designer",
  "Stylist",
  "Choreographer",
  "Podcaster",
  "Content Creator",
];

/** Split sheets are for music people: anyone with a music role, or no roles picked yet. */
export function usesSplitSheets(categories: unknown): boolean {
  const list = Array.isArray(categories) ? categories.map(String) : [];
  if (!list.length) return true;
  return list.some((c) => !NON_MUSIC_CATEGORIES.includes(c));
}

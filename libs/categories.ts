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
] as const;

export type MusicCategory = (typeof MUSIC_CATEGORIES)[number];

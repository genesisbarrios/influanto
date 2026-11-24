import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import posthog from "posthog-js";
import apiClient from "@/libs/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEnvelopeOpen, faXmark, faCheck, faCopy, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

const LINK_PLACEHOLDER = '[ paste your track link here ]';

type SentPitch = {
  id: string;
  curator_email: string;
  curator_name: string;
  playlist_name: string;
  playlist_url: string;
  track_link: string;
  subject: string;
  body: string;
  created_at: string;
};

/** Where `token` appears in `text`, choosing the occurrence nearest `near` (-1 if absent). */
function locate(text: string, token: string, near: number) {
  if (!token) return -1;
  let best = -1;
  for (let i = text.indexOf(token); i !== -1; i = text.indexOf(token, i + 1)) {
    if (best === -1 || Math.abs(i - near) < Math.abs(best - near)) best = i;
  }
  return best;
}

const PitchToSpotify: React.FC = () => {
  useEffect(() => {
    document.title = "Playlist Curator Search | Influanto";

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Playlist Curator Search Tool');

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Playlist Curator Search');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Playlist Curator Search | Influanto');

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', 'Playlist Curator Search | Influanto');

    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', 'Playlist Curator Search | Influanto');
  }, []);

  interface Playlist {
    id?: string;
    playlistCoverImage?: string;
    name: string;
    url: string;
    owner: string;
    ownerProfileUrl: string;
    description?: string;
    externalUrl?: string;
    email?: string;
  }

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Latin');
  const [searchTerm, setSearchTerm] = useState('');
  // The last thing typed and searched (shown in the "no results" message)
  const [searchedTerm, setSearchedTerm] = useState('');
  const { data, status } = useSession();
  const [user, setUser] = useState<any>();

  // ── Curator email popup ──
  const [emailModal, setEmailModal] = useState<Playlist | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailAlert, setEmailAlertRaw] = useState('');
  const [emailAlertOk, setEmailAlertOk] = useState(false);
  const setEmailAlert = (msg: string, ok = false) => { setEmailAlertRaw(msg); setEmailAlertOk(ok); };

  // ── Track link (release page dropdown or a pasted link) ──
  const [releasePages, setReleasePages] = useState<{ id?: string; name: string; slug?: string; image?: string }[]>([]);
  const [selectedReleasePageName, setSelectedReleasePageName] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [trackLink, setTrackLink] = useState('');

  useEffect(() => {
    if (!data?.user?.id) return;
    apiClient.get('/get-release-pages')
      .then((res: any) => setReleasePages(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setReleasePages([]));
  }, [data?.user?.id]);

  // Where the link sits in the message. Tracked by position (not by searching
  // for the old text) so a half-typed link like "h" can't match some other
  // word earlier in the message.
  const linkSpot = useRef({ text: LINK_PLACEHOLDER, at: -1 });

  const applyLink = (newLink: string) => {
    const shown = newLink || LINK_PLACEHOLDER;
    const body = emailForm.body;
    const spot = linkSpot.current;
    const at = locate(body, spot.text, spot.at);
    let next: string, nextAt: number;
    if (at !== -1) {
      next = body.slice(0, at) + shown + body.slice(at + spot.text.length);
      nextAt = at;
    } else {
      // the link was removed from the message: add it back at the end
      const trimmed = body.replace(/\s+$/, '');
      next = `${trimmed}${trimmed ? '\n\n' : ''}${shown}`;
      nextAt = next.length - shown.length;
    }
    linkSpot.current = { text: shown, at: nextAt };
    setEmailForm((p) => ({ ...p, body: next }));
    setTrackLink(newLink);
  };

  const handleBodyChange = (value: string) => {
    // follow the link as text is added or removed before it
    const spot = linkSpot.current;
    linkSpot.current = { ...spot, at: locate(value, spot.text, spot.at) };
    setEmailForm((p) => ({ ...p, body: value }));
  };

  // ── Sent pitches (history + daily limit) ──
  const [sent, setSent] = useState<SentPitch[]>([]);
  const [sentLoaded, setSentLoaded] = useState(false);
  const [usage, setUsage] = useState<{ sentToday: number; limit: number | null }>({ sentToday: 0, limit: null });
  const [openSent, setOpenSent] = useState<string | null>(null);

  // latest pitch per curator email, for the "Pitched" button in the results
  const lastPitch = React.useMemo(() => {
    const m = new Map<string, SentPitch>();
    for (const p of sent) if (!m.has(p.curator_email)) m.set(p.curator_email, p);
    return m;
  }, [sent]);
  const pitchFor = (email?: string) => (email ? lastPitch.get(email.trim().toLowerCase()) : undefined);
  const showPitch = (p: SentPitch) => {
    setOpenSent(p.id);
    setTimeout(() => document.getElementById(`pitch-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  useEffect(() => {
    if (!data?.user?.id) return;
    fetch('/api/curator-email')
      .then((r) => r.json())
      .then((d) => {
        setSent(Array.isArray(d?.data) ? d.data : []);
        if (typeof d?.sentToday === 'number') setUsage({ sentToday: d.sentToday, limit: d.limit ?? null });
      })
      .catch(() => {})
      .finally(() => setSentLoaded(true));
  }, [data?.user?.id]);

  const handleSelectReleasePage = (pageSlug: string) => {
    setSelectedReleasePageName(pageSlug);
    setCustomLink('');
    applyLink(pageSlug ? `${window.location.origin}/release/${pageSlug}` : '');
  };

  const handleCustomLinkChange = (value: string) => {
    setCustomLink(value);
    setSelectedReleasePageName('');
    applyLink(value);
  };

  const buildTemplate = (pl: Playlist) => {
    const artist = (data?.user?.name as string) || 'an independent artist';
    return {
      subject: `Song submission for "${pl.name}"`,
      body:
`Hi ${pl.owner || 'there'},

I came across your playlist "${pl.name}" and think my music would be a great fit for it.

I'm ${artist} and I'd love for you to consider my latest release:
${LINK_PLACEHOLDER}

Thanks so much for your time and for supporting independent artists — it means a lot.

Best,
${(data?.user?.name as string) || ''}`,
    };
  };

  const openEmail = (pl: Playlist) => {
    const tpl = buildTemplate(pl);
    linkSpot.current = { text: LINK_PLACEHOLDER, at: tpl.body.indexOf(LINK_PLACEHOLDER) };
    setEmailModal(pl);
    setEmailForm(tpl);
    setCopied(false);
    setEmailAlert('');
    setSelectedReleasePageName('');
    setCustomLink('');
    setTrackLink('');
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${emailForm.subject}\n\n${emailForm.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setEmailAlert('Could not copy — select and copy manually.');
    }
  };

  const sendCuratorEmail = async () => {
    if (!emailModal?.email) return;
    setSending(true);
    setEmailAlert('');
    try {
      const res = await fetch('/api/curator-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailModal.email,
          subject: emailForm.subject,
          body: emailForm.body,
          playlistName: emailModal.name,
          playlistUrl: emailModal.url,
          curatorName: emailModal.owner,
          trackLink,
        }),
      });
      const d = await res.json();
      if (typeof d?.sentToday === 'number') setUsage({ sentToday: d.sentToday, limit: d.limit ?? null });
      if (!res.ok) throw new Error(d.error || 'Failed to send');
      if (d.sent) setSent((list) => [d.sent, ...list]);
      posthog.capture('curator_email_sent', { playlist: emailModal.name });
      setEmailAlert('Email sent!', true);
      setTimeout(() => setEmailModal(null), 1200);
    } catch (e: any) {
      setEmailAlert(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const genres = [
    "Latin", "Latin Indie", "Reggaeton", "Latin Trap",
    "Hip Hop", "RnB", "Trap", "Drill", "EDM", "House",
    "DnB", "Dubstep", "Techno", "Rock", "Post Punk", "Jazz",
  ];

  /**
   * fetchPlaylists
   * - Always calls /api/fetch-curators?genre=...
   * - If you pass a search term (from the "Other" flow), that search term becomes the `genre` value.
   */
  const fetchPlaylists = async (genreValue: string) => {
    setLoading(true);
    moreCursor.current = 0;
    setMoreNote('');

    try {
      const trimmed = genreValue?.trim();
      if (!trimmed) {
        // nothing to search for: clear results and return
        setPlaylists([]);
        setLoading(false);
        return;
      }

      const url = `/api/fetch-curators?genre=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`fetch error ${res.status}`);
      }
      const data = await res.json();
      setPlaylists(data.playlists || []);
      posthog.capture("curator_searched", {
        genre: trimmed,
        results_count: (data.playlists || []).length,
      });
    } catch (err) {
      console.error('fetchPlaylists error', err);
      posthog.captureException(err);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when a normal (non-"Other") genre is selected
  useEffect(() => {
    setSearchedTerm('');
    if (selectedGenre && selectedGenre !== "Other") {
      fetchPlaylists(selectedGenre);
    } else {
      // clear results when selecting "Other" or clearing selection
      setPlaylists([]);
    }
  }, [selectedGenre]);

  // Search bar (always shown) — uses searchTerm AS the genre param
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      // nothing entered — do nothing (or you can show an error/toast)
      return;
    }
    // IMPORTANT: pass the search term as the "genre" query param
    setSearchedTerm(q);
    fetchPlaylists(q);
  };

  // ── Refresh: keep the curators with email, look for more (deeper, then adjacent genres) ──
  const moreCursor = useRef(0);
  const [findingMore, setFindingMore] = useState(false);
  const [moreNote, setMoreNote] = useState('');

  const findMore = async () => {
    const genre = (searchedTerm || (selectedGenre !== 'Other' ? selectedGenre : '')).trim();
    if (!genre || findingMore) return;
    setFindingMore(true);
    setMoreNote('');
    const keep = playlists.filter((p) => p.email);
    try {
      const res = await fetch('/api/fetch-curators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, cursor: moreCursor.current, exclude: playlists.map((p) => p.id).filter(Boolean) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to find more');
      moreCursor.current = d.cursor ?? moreCursor.current;
      const seen = new Set(keep.map((p) => p.id));
      const added: Playlist[] = (d.playlists || []).filter((p: Playlist) => !seen.has(p.id));
      setPlaylists([...keep, ...added]);
      const from = (d.searched || []).filter((g: string) => g !== genre.toLowerCase());
      if (added.length) {
        setMoreNote(`Found ${added.length} more${from.length ? ` from ${from.join(', ')}` : ''}.`);
      } else if (d.done) {
        setMoreNote(`No more curators found for "${genre}"${from.length ? ` or ${from.join(', ')}` : ''}.`);
      } else {
        setMoreNote(`Nothing new yet. Tap refresh again to look in ${d.next || 'more results'}.`);
      }
      posthog.capture('curator_find_more', { genre, added: added.length, searched: d.searched });
    } catch (e: any) {
      setMoreNote(e?.message || 'Failed to find more');
    } finally {
      setFindingMore(false);
    }
  };

  // Determine what label to show in "no results" message
  const queryLabel = searchedTerm || selectedGenre;

  const hasQuery = !!searchedTerm || (selectedGenre && selectedGenre !== "Other");

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg text-black">
      <h2 className="text-xl md:text-2xl font-semibold mb-1">Spotify Playlist Curator Search</h2>
      <p className="text-sm text-gray-500 mb-6">Select a genre to find Spotify playlist curators through the Spotify API.</p>

      {/* Genre Dropdown */}
      <div className="mb-4">
        <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Select Genre</label>
        <select
          id="genre"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="mt-1 bg-white block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Genre</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Search Field (always visible) */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          id="search"
          placeholder="Type to search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 mt-1 bg-white block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <button
          type="submit"
          className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Search
        </button>
        <button
          type="button"
          onClick={findMore}
          disabled={findingMore || loading || !(searchedTerm || (selectedGenre && selectedGenre !== 'Other'))}
          aria-label="Find more curators"
          title="Find more curators (keeps the ones with email)"
          className="mt-1 px-3 py-2 border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faArrowsRotate} spin={findingMore} />
        </button>
      </form>
      {moreNote && <p className="-mt-4 mb-4 text-xs text-gray-500">{moreNote}</p>}

      {/* Results */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : hasQuery && playlists.length === 0 ? (
        <p className="text-center text-gray-500">
          No curators found for &quot;{queryLabel}&quot;. Try a different genre or search.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {playlists.map((playlist, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <div className="flex items-center mb-4">
                {playlist.playlistCoverImage && (
                  <img
                    src={playlist.playlistCoverImage}
                    alt={`Cover for ${playlist.name}`}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                )}
                <div>
                  <a
                    href={playlist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm sm:text-md font-semibold text-blue-500 hover:underline"
                  >
                    {playlist.name}
                  </a>
                  <a
                    href={playlist.ownerProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm sm:text-md text-gray-500 hover:underline"
                  >
                    by {playlist.owner}
                  </a>
                </div>
              </div>

              <p className="text-sm text-gray-700">{playlist.description || "No description available"}</p>

              <div className="text-xs text-gray-700 space-x-2">
                {playlist.externalUrl && (
                  <a
                    href={playlist.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 text-white bg-blue-500 rounded-lg text-sm hover:bg-blue-600"
                  >
                    Social Media
                  </a>
                )}
                {playlist.email && (
                  <button
                    onClick={() => openEmail(playlist)}
                    className="inline-block mt-2 px-4 py-2 text-white bg-green-500 rounded-lg text-sm hover:bg-green-600"
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="mr-1.5" /> Email
                  </button>
                )}
                {(() => {
                  const p = pitchFor(playlist.email);
                  return p ? (
                    <button
                      onClick={() => showPitch(p)}
                      title={`You emailed this curator on ${new Date(p.created_at).toLocaleDateString()}`}
                      className="inline-block mt-2 px-4 py-2 text-green-700 bg-green-50 border border-green-300 rounded-lg text-sm hover:bg-green-100"
                    >
                      <FontAwesomeIcon icon={faEnvelopeOpen} className="mr-1.5" /> Pitched
                    </button>
                  ) : null;
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pitches you've sent */}
      {data?.user?.id && (
        <div className="mt-10 border-t pt-6">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
            <h3 className="text-lg font-semibold">Sent pitches</h3>
            <p className="text-xs text-gray-500">
              {sent.length} sent
              {usage.limit !== null && <> · {usage.sentToday}/{usage.limit} today</>}
            </p>
          </div>
          {!sentLoaded ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : sent.length === 0 ? (
            <p className="text-sm text-gray-500">Emails you send to curators show up here, with the track you pitched and a copy of the message.</p>
          ) : (
            <ul className="divide-y border rounded-lg">
              {sent.map((p) => (
                <li key={p.id} id={`pitch-${p.id}`} className="p-3 text-sm">
                  <button className="w-full text-left flex items-start justify-between gap-3" onClick={() => setOpenSent(openSent === p.id ? null : p.id)}>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.playlist_name || p.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{p.curator_name ? `${p.curator_name} · ` : ''}{p.curator_email}</p>
                      {p.track_link && <p className="text-xs text-indigo-600 truncate">{p.track_link}</p>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</span>
                  </button>
                  {openSent === p.id && (
                    <div className="mt-2 rounded-md bg-gray-50 p-3">
                      {p.playlist_url && (
                        <a href={p.playlist_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Open playlist</a>
                      )}
                      <p className="text-xs font-semibold mt-1">{p.subject}</p>
                      <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-gray-700">{p.body}</pre>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Curator email popup */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg text-black">
            <div className="px-5 py-4 border-b flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Email curator</h3>
                <p className="text-sm text-gray-500 mt-0.5">{emailModal.owner} · {emailModal.email}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setEmailModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Track link</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  value={selectedReleasePageName}
                  onChange={(e) => handleSelectReleasePage(e.target.value)}
                >
                  <option value="">Select a release page…</option>
                  {releasePages.map((page) => (
                    <option key={page.id ?? page.slug} value={page.slug}>{page.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1 mb-1">Or paste the link you want to use:</p>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  value={customLink}
                  onChange={(e) => handleCustomLinkChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Subject</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Message</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-white text-black"
                  rows={11}
                  value={emailForm.body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-400">Replies go straight to your account email. Edit the template before sending.</p>
              {usage.limit !== null && (
                <p className="text-xs text-gray-500">{Math.max(0, usage.limit - usage.sentToday)} of {usage.limit} free emails left today. Pro is unlimited.</p>
              )}
              {emailAlert && <p className={`text-sm ${emailAlertOk ? 'text-green-600' : 'text-red-500'}`}>{emailAlert}</p>}
            </div>

            <div className="px-5 pb-5 flex justify-end gap-2 flex-wrap">
              <button className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => setEmailModal(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50" onClick={copyTemplate}>
                {copied ? <><FontAwesomeIcon icon={faCheck} className="mr-1" /> Copied</> : <><FontAwesomeIcon icon={faCopy} className="mr-1" /> Copy template</>}
              </button>
              <button className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400" disabled={sending} onClick={sendCuratorEmail}>
                {sending ? 'Sending…' : <><FontAwesomeIcon icon={faEnvelope} className="mr-1" /> Send email</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchToSpotify;

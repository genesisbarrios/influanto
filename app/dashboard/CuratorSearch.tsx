import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import posthog from "posthog-js";
import apiClient from "@/libs/api";

const LINK_PLACEHOLDER = '[ paste your track link here ]';

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
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data, status } = useSession();
  const [user, setUser] = useState<any>();

  // ── Curator email popup ──
  const [emailModal, setEmailModal] = useState<Playlist | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailAlert, setEmailAlert] = useState('');

  // ── Track link (release page dropdown or a pasted link) ──
  const [releasePages, setReleasePages] = useState<{ name: string; image?: string }[]>([]);
  const [selectedReleasePageName, setSelectedReleasePageName] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [trackLink, setTrackLink] = useState('');

  useEffect(() => {
    if (!data?.user?.id) return;
    apiClient.get('/get-release-pages')
      .then((res: any) => setReleasePages(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setReleasePages([]));
  }, [data?.user?.id]);

  const applyLink = (newLink: string) => {
    setEmailForm((p) => ({
      ...p,
      body: p.body.replace(trackLink || LINK_PLACEHOLDER, newLink || LINK_PLACEHOLDER),
    }));
    setTrackLink(newLink);
  };

  const handleSelectReleasePage = (pageName: string) => {
    setSelectedReleasePageName(pageName);
    setCustomLink('');
    applyLink(pageName ? `${window.location.origin}/release/${pageName}` : '');
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
    setEmailModal(pl);
    setEmailForm(buildTemplate(pl));
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
        body: JSON.stringify({ to: emailModal.email, subject: emailForm.subject, body: emailForm.body }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to send');
      posthog.capture('curator_email_sent', { playlist: emailModal.name });
      setEmailAlert('✅ Email sent!');
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
    if (selectedGenre && selectedGenre !== "Other") {
      fetchPlaylists(selectedGenre);
    } else {
      // clear results when selecting "Other" or clearing selection
      setPlaylists([]);
    }
  }, [selectedGenre]);

  // Submit handler for the "Other" search — uses searchTerm AS the genre param
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      // nothing entered — do nothing (or you can show an error/toast)
      return;
    }
    // IMPORTANT: pass the search term as the "genre" query param
    fetchPlaylists(q);
  };

  // Determine what label to show in "no results" message
  const queryLabel =
    selectedGenre === "Other" && searchTerm.trim()
      ? searchTerm.trim()
      : selectedGenre;

  const hasQuery =
    (selectedGenre && selectedGenre !== "Other") ||
    (selectedGenre === "Other" && searchTerm.trim());

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg text-black">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Spotify Playlist Curator Search</h2>

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

      {/* Search Field (only if "Other" selected) */}
      {selectedGenre === "Other" && (
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
        </form>
      )}

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
                    ✉️ Email
                  </button>
                )}
              </div>
            </div>
          ))}
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
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setEmailModal(null)}>✕</button>
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
                    <option key={page.name} value={page.name}>{page.name}</option>
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
                  onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
                />
              </div>
              <p className="text-xs text-gray-400">Replies go straight to your account email. Edit the template before sending.</p>
              {emailAlert && <p className={`text-sm ${emailAlert.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{emailAlert}</p>}
            </div>

            <div className="px-5 pb-5 flex justify-end gap-2 flex-wrap">
              <button className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => setEmailModal(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50" onClick={copyTemplate}>
                {copied ? '✓ Copied' : '📋 Copy template'}
              </button>
              <button className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400" disabled={sending} onClick={sendCuratorEmail}>
                {sending ? 'Sending…' : '✉️ Send email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchToSpotify;

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

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
    } catch (err) {
      console.error('fetchPlaylists error', err);
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
                  <a
                    href={`mailto:${playlist.email}`}
                    className="inline-block mt-2 px-4 py-2 text-white bg-green-500 rounded-lg text-sm hover:bg-green-600"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PitchToSpotify;

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const PitchToSpotify = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const { data, status } = useSession();
  const [user, setUser] = useState<any>();

  // Predefined list of genres
  const genres = [
    "Pop",
    "Reggaeton",
    "Hip Hop",
    "Rock",
    "Jazz",
    "Electronic",
    "Latin",
    "Reggaeton",
    "Latin Trap",
    "Indie",
    "DnB",
    "R&B",
    "Trap",
    "Drill",
    "Post Punk",
    "House",
    "Latin House",
    "Techno"
  ];

  // Fetch playlists based on selected genre
  const fetchPlaylists = async (genre: string) => {
    setLoading(true);
    const response = await fetch(`/api/fetch-curators?genre=${genre}`);
    const data = await response.json();
    setPlaylists(data.playlists || []);
    setLoading(false);
  };

  // Fetch playlists whenever the selected genre changes
  useEffect(() => {
    if (selectedGenre) {
      fetchPlaylists(selectedGenre);
    }
  }, [selectedGenre]);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg text-black">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Spotify Curator Search</h2>
      
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
        </select>
      </div>

      {/* Display Loading or Playlists */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              {/* Flex container for image and title */}
              <div className="flex items-center mb-4">
                {/* Playlist Image */}
                {playlist.playlistCoverImage && (
                  <img
                    src={playlist.playlistCoverImage}
                    alt={`Cover for ${playlist.name}`}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                )}

                {/* Playlist Title and Owner */}
                <div>
                  <a
                    href={playlist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-md font-semibold text-blue-500 hover:underline"
                  >
                    {playlist.name}
                  </a>
                  <p className="text-xs sm:text-sm text-gray-700">by {playlist.owner}</p>
                </div>
              </div>

              {/* Playlist Description */}
              <p className="text-sm text-gray-700">{playlist.description || "No description available"}</p>

              {/* Playlist URL */}
              <p className="text-xs text-gray-700">
                {playlist.url ? (
                  <a 
                    href={playlist.url} target="_blank"
                    className="inline-block mt-2 px-4 py-2 text-white bg-blue-500 rounded-lg text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Playlist
                  </a>
                ) : (<></>)}
              </p>

              {/* Owner Profile URL */}
              <p className="text-xs text-gray-700">
                {playlist.ownerProfileUrl ? (
                  <a 
                    href={playlist.ownerProfileUrl} target="_blank"
                    className="inline-block mt-2 px-4 py-2 text-white bg-blue-500 rounded-lg text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Owner Profile
                  </a>
                ) : (<></>)}
              </p>

              {/* External Social URL */}
              <p className="text-xs text-gray-700">
                {playlist.externalUrl ? (
                  <a 
                    href={playlist.externalUrl} target="_blank"
                    className="inline-block mt-2 px-4 py-2 text-white bg-blue-500 rounded-lg text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Socials
                  </a>
                ) : (<></>)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PitchToSpotify;

import React from 'react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string; // Assuming there's an avatar URL you want to display
}


const PitchToSpotify = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const {data, status} = useSession();
  const [user, setUser] = useState<any>();

  // const fetchPlaylists = async () => {
  //   setLoading(true);
  //   const response = await fetch('/api/fetch-curators');
  //   const data = await response.json();
  //   setPlaylists(data.playlists || []);
  //   setLoading(false);
  // };


  // useEffect(() => {
  //   fetchPlaylists();
  // }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg text-black">
      <h2 className="text-2xl font-semibold mb-6">Playlist Pitch</h2>
      <h6 className="mb-4">Coming Soon</h6>
  
      {/* {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <a
                href={playlist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xl font-semibold text-blue-500 hover:underline mb-2"
              >
                {playlist.name} by {playlist.owner}
              </a>
              <p className="text-sm text-gray-700">{playlist.description || "No description available"}</p>
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
  
};

export default PitchToSpotify;
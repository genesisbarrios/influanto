import React from 'react';
// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string; // Assuming there's an avatar URL you want to display
}

const PitchToSpotify = () => {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-2">Pitch To Spotify</h2>
      <p>Coming soon..</p>
    </div>
  );
};

export default PitchToSpotify;
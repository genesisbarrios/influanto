import React from 'react';
// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string; // Assuming there's an avatar URL you want to display
}

const QRCodeGenerator = () => {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-2">QR Code Generator</h2>
      <p>Coming soon..</p>
    </div>
  );
};

export default QRCodeGenerator;
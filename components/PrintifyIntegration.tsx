// components/PrintifyIntegration.tsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping } from '@fortawesome/free-solid-svg-icons';

const PrintifyIntegration = ({ user }: { user: any }) => {
  const [storeUrl, setStoreUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // If already connected, return null (Profile.tsx will handle the display)
  if (user?.printifyShopId) {
    return null;
  }

  const connectPrintify = async () => {
    if (!storeUrl.trim()) {
      alert('❌ Please enter your Printify store URL');
      return;
    }

    setIsConnecting(true);

    try {
      // Update the URL to match our API endpoint
      const response = await fetch('/api/printify-connect/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          storeUrl: storeUrl.trim()
        })
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Connected to ${data.shopName} successfully!`);
        // Refresh page to show updated connection status
        window.location.reload();
      } else {
        alert(`❌ Connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Printify connection error:', error);
      alert(`❌ Failed to connect Printify: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Show connection form only if not connected
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
      <div className="text-sm font-medium text-green-800 mb-3">
        <FontAwesomeIcon icon={faBagShopping} className="mr-1.5" /> Connect Your Printify Store
      </div>
      
      <div className="space-y-3">
        <input
          type="text"
          placeholder="https://yourstore.printify.me"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        
        <button
          onClick={connectPrintify}
          disabled={!storeUrl.trim() || isConnecting}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting...' : 'Connect Store'}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-green-600">
        Enter your Printify store URL (e.g., yourstore.printify.me)
      </div>
    </div>
  );
};

export default PrintifyIntegration;
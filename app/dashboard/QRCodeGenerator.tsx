import React, { useRef } from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from "@/libs/api";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
import posthog from "posthog-js";

// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string;
}

const QRCodeGenerator = () => {
  const [qrCodes, setQRCodes] = useState<any[]>([]);
  const [newLink, setNewLink] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [newBgColor, setNewBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  // Premium color options
  const [dotsColor, setDotsColor] = useState('#000000');
  const [cornerDotColor, setCornerDotColor] = useState('#000000');
  const [cornerSquareColor, setCornerSquareColor] = useState('#000000');
  const [newSize, setNewSize] = useState(300);
  const [dotStyle, setDotStyle] = useState('square');
  const [cornerSquareStyle, setCornerSquareStyle] = useState('square');
  const [cornerDotStyle, setCornerDotStyle] = useState('square');
  const [showCreateView, setShowCreateView] = useState(false);
  const {data, status} = useSession();
  const [user, setUser] = useState<any>();
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [QRCodeStyling, setQRCodeStyling] = useState<any>(null);
  const [previewQR, setPreviewQR] = useState<any>(null);

  // Refs for QR code containers
  const previewRef = useRef<HTMLDivElement>(null);
  const qrRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get the maximum allowed pages based on user status
  const getMaxCodes = () => {
    return user?.hasAccess ? 50 : 10;
  };

// Add these validation functions after your state declarations:

const validateURL = (value: string) => {
  if (!value.trim()) {
    setAlert("URL is required.");
    return false;
  }
  
  // Basic URL validation
  try {
    new URL(value);
  } catch {
    setAlert("Please enter a valid URL (must include http:// or https://).");
    return false;
  }
  
  if (value.length > 500) {
    setAlert("URL is too long (max 500 characters).");
    return false;
  }
  
  setAlert("");
  return true;
};

const validateName = (value: string) => {
  if (!value.trim()) {
    setAlert("QR Code name is required.");
    return false;
  }
  
  if (value.length < 2) {
    setAlert("QR Code name must be at least 2 characters long.");
    return false;
  }
  
  if (value.length > 50) {
    setAlert("QR Code name cannot be longer than 50 characters.");
    return false;
  }
  
  if (value.includes("@") || value.includes("http")) {
    setAlert("QR Code name cannot contain @ symbols or URLs.");
    return false;
  }
  
  setAlert("");
  return true;
};

const validateSize = (value: number) => {
  if (value < 200 || value > 500) {
    setAlert("QR Code size must be between 200px and 500px.");
    return false;
  }
  
  setAlert("");
  return true;
};

// Add these handler functions with validation:

const handleLinkChange = (value: string) => {
  // Always update state so user can type
  setNewLink(value);
  
  // Validate only if there's a value
  if (value && !validateURL(value)) {
    // Error already set in validateURL function
  } else {
    setAlert("");
  }
};

const handleNameChange = (value: string) => {
  // Always update state so user can type
  setNewName(value);
  
  // Validate only if there's a value
  if (value && !validateName(value)) {
    // Error already set in validateName function
  } else {
    setAlert("");
  }
};

const handleSizeChange = (value: number) => {
  // Always update state
  setNewSize(value);
  
  // Validate the size
  if (!validateSize(value)) {
    // Error already set in validateSize function
  } else {
    setAlert("");
  }
};

// Update your addQRCode function to include comprehensive validation:
const addQRCode = async () => {
  try {
    // Validate all fields before saving
    if (!validateURL(newLink)) {
      return;
    }
    
    if (!validateName(newName)) {
      return;
    }
    
    if (!validateSize(newSize)) {
      return;
    }
    
    // Check if name is unique
    if (qrCodes.some((code: any) => code.name?.toLowerCase() === newName.toLowerCase())) {
      setAlert("A QR code with this name already exists. Please choose a different name.");
      return;
    }
    
    const maxCodes = getMaxCodes();
    
    if (qrCodes.length >= maxCodes) {
      const userType = user?.hasAccess ? "premium" : "free";
      setAlert(`You can only create up to ${maxCodes} QR codes on the ${userType} plan.`);
      return;
    }

    setIsLoading(true);

    const { data } = await apiClient.post("/codes", {
      link: newLink,
      name: newName,
      bgColor: newBgColor,
      transparentBg: transparentBg,
      color: user?.hasAccess ? dotsColor : newColor,
      cornerDotColor: user?.hasAccess ? cornerDotColor : undefined,
      cornerSquareColor: user?.hasAccess ? cornerSquareColor : undefined,
      size: newSize,
      dotStyle: dotStyle,
      cornerSquareStyle: cornerSquareStyle,
      cornerDotStyle: cornerDotStyle
    });

    console.log(data);
    posthog.capture("qr_code_created", {
      name: newName,
      dot_style: dotStyle,
      is_premium: !!user?.hasAccess,
    });
    setAlert("✅ QR Code saved successfully");
    setShowCreateView(false);
    
    // Reset form fields
    setNewLink('');
    setNewName('');
    setNewColor('#000000');
    setNewBgColor('#ffffff');
    setTransparentBg(false);
    setDotsColor('#000000');
    setCornerDotColor('#000000');
    setCornerSquareColor('#000000');
    setNewSize(300);
    setDotStyle('square');
    setCornerDotStyle('square');
    setCornerSquareStyle('square');
    
    getQrCodes();
  } catch (e: any) {
    console.error('Create QR error:', e);
    posthog.captureException(e);
    const errorMessage = e?.response?.data?.message || e?.message || "Failed to create QR code.";
    setAlert(`❌ ${errorMessage}`);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
    document.title = "QR Code Generator | Influanto";
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'QR Code Generator - Create professional QR codes with custom designs powered by Influanto.');

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Split Sheet Generator | Influanto');
    
    // Update og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Fill out and save your QR Codes easily. Free musician tools by Influanto.');

    // Update twitter:title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', 'QR Code Generator | Influanto');

    // Update twitter:description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', 'Generate and share your QR Codes easily. Free musician tools by Influanto.');
  }, []);

  // Load QR Code Styling library dynamically
  useEffect(() => {
    const loadQRCodeStyling = async () => {
      try {
        const QRCodeStylingModule = await import('qr-code-styling');
        const QRCodeStylingClass = QRCodeStylingModule.default || QRCodeStylingModule;
        setQRCodeStyling(() => QRCodeStylingClass);
        console.log('✅ QR Code Styling loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load qr-code-styling:', error);
        setAlert('Failed to load QR code library');
      }
    };
    
    loadQRCodeStyling();
  }, []);

  // Create preview QR code
  useEffect(() => {
    if (QRCodeStyling && newLink && previewRef.current) {
      createPreviewQR();
    }
  }, [QRCodeStyling, newLink, newColor, newBgColor, newSize, dotStyle, cornerSquareStyle, cornerDotStyle, transparentBg, dotsColor, cornerDotColor, cornerSquareColor]);

  // Create QR codes for existing codes when library loads
  useEffect(() => {
    if (QRCodeStyling && qrCodes) {
      qrCodes.forEach((code: any) => {
        createQRCodeForDisplay(code);
        console.log(code);
      });
    }
  }, [QRCodeStyling, qrCodes]);

  const createPreviewQR = () => {
    if (!QRCodeStyling || !newLink || !previewRef.current) return;

    try {
      // Clear previous preview
      previewRef.current.innerHTML = '';

      const qrCodeOptions = {
        width: Math.min(newSize, 200), // Limit preview size
        height: Math.min(newSize, 200),
        type: "svg" as const,
        data: newLink,
        dotsOptions: {
          color: user?.hasAccess ? dotsColor : newColor, // Use individual color for premium
          type: dotStyle as any
        },
        backgroundOptions: {
          color: transparentBg ? "transparent" : newBgColor,
        },
        cornersSquareOptions: {
          type: cornerSquareStyle as any,
          color: user?.hasAccess ? cornerSquareColor : newColor // Use individual color for premium
        },
        cornersDotOptions: {
          type: cornerDotStyle as any,
          color: user?.hasAccess ? cornerDotColor : newColor // Use individual color for premium
        }
      };

      const qr = new QRCodeStyling(qrCodeOptions);
      qr.append(previewRef.current);
      setPreviewQR(qr);
    } catch (error) {
      console.error('Error creating preview QR:', error);
    }
  };

  const createQRCodeForDisplay = (code: any) => {
    if (!QRCodeStyling) return;

    const codeKey = code.id ?? code._id;
    const container = qrRefs.current[codeKey];
    if (!container) return;

    try {
      // Clear previous QR code
      container.innerHTML = '';

      const qrCodeOptions = {
        width: 128,
        height: 128,
        type: "svg" as const,
        data: code.url,
        dotsOptions: {
          color: code.color || "#000000", // Use individual colors if available
          type: (code.dotStyle || "rounded") as any
        },
        backgroundOptions: {
          color: code.transparentBg ? "transparent" : (code.bgColor || "#ffffff"),
        },
        cornersSquareOptions: {
          type: (code.cornerSquareStyle || "square") as any,
          color: code.cornerSquareColor || code.color || "#000000" // Use individual colors if available
        },
        cornersDotOptions: {
          type: (code.cornerDotStyle || "square") as any,
          color: code.cornerDotColor || code.color || "#000000" // Use individual colors if available
        }
      };

      const qr = new QRCodeStyling(qrCodeOptions);
      qr.append(container);
    } catch (error) {
      console.error('Error creating QR code for display:', error);
    }
  };

  const handleDownload = (code: any, format: 'png' | 'svg' = 'png') => {
    if (!QRCodeStyling || !code.url) {
      setAlert('Cannot download QR code');
      return;
    }

    try {
      const qrCodeOptions = {
        width: 512, // High resolution for download
        height: 512,
        type: "svg" as const,
        data: code.url,
        dotsOptions: {
          color: code.color || "#000000", // Use individual colors if available
          type: (code.dotStyle || "rounded") as any
        },
        backgroundOptions: {
          color: code.transparentBg ? "transparent" : (code.bgColor || "#ffffff"),
        },
        cornersSquareOptions: {
          type: (code.cornerSquareStyle || "extra-rounded") as any,
          color: code.cornerSquareColor || code.color || "#000000" // Use individual colors if available
        },
        cornersDotOptions: {
          type:  (code.cornerDotStyle || "dot") as any,
          color: code.cornerDotColor || code.color || "#000000" // Use individual colors if available
        }
      };

      const qr = new QRCodeStyling(qrCodeOptions);
      qr.download({
        name: `${code.name}_${user?.name || 'Influanto'}`,
        extension: format
      });

      posthog.capture("qr_code_downloaded", { name: code.name, format });
      setAlert(`✅ QR code downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      setAlert(`❌ Download failed: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/delete-code`, {
        data: { id }
      });

      posthog.capture("qr_code_deleted", { qr_code_id: id });
      setQRCodes(qrCodes.filter((code: any) => (code.id ?? code._id) !== id));
      setAlert("QR Code deleted successfully.");

    } catch (e: any) {
      console.error('Delete error:', e);
      posthog.captureException(e);
      const errorMessage = e?.response?.data?.error || e?.response?.data?.message || "An error occurred while deleting the QR Code.";
      setAlert(errorMessage);
    }
  };

  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      setUser(data);
    } catch (e) {
      setAlert(e?.message);
    } 
  }

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    getQrCodes();
  }, []);

  const getQrCodes = async () => {
    try {
      const { data } = await apiClient.get("/get-codes");
      setQRCodes(data[0]?.codes ?? []);
    } catch (e: any) {
      // Silently ignore "no codes yet" — don't show an error alert
      setQRCodes([]);
    }
  }

  return (
    <>
   
    <div className="p-4 bg-white shadow rounded-md text-black">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-2">QR Codes</h2>
        {!showCreateView && qrCodes.length < getMaxCodes() && (
          <button
            onClick={() => setShowCreateView(true)}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create QR
          </button>
        )}
      </div>

      {/* QR Code Usage */}
      <div className="mb-4 text-sm text-gray-600">
        {qrCodes?.length || 0} of {getMaxCodes()} QR codes used
        {!user?.hasAccess && (
          <span className="ml-2 text-blue-600">
            (Upgrade to Premium for up to 50 QR codes)
          </span>
        )}
      </div>

      {/* Library Status */}
      {!QRCodeStyling && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-yellow-800">⏳ Loading QR Code Generator...</div>
        </div>
      )}

      {showCreateView && (
        <div className="mb-4 border border-gray-300 p-4 rounded">
          <h4 className="mb-3 text-lg font-semibold">
            Create QR Code
            {user?.hasAccess && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                ✨ Premium
              </span>
            )}
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Controls */}
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block mb-2 font-medium">Link/URL</label>
                <input
                  placeholder="Enter link for QR code"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Name</label>
                <input
                  placeholder="Name for your QR code"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Size under name */}
              <div>
                <label className="block mb-2 font-medium">Size: {newSize}px</label>
                <input
                  type="range"
                  min="200"
                  max="500"
                  value={newSize}
                  onChange={(e) => setNewSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Basic Colors for Free Users Only */}
              {!user?.hasAccess && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block mb-2 font-medium">Foreground Color</label>
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div>
              <label className="block mb-2 font-medium">Live Preview</label>
              <div 
                className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded p-4 min-h-[250px]"
                style={{ 
                  backgroundColor: transparentBg ? '#f8f9fa' : '#ffffff',
                  backgroundImage: transparentBg ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                  backgroundSize: transparentBg ? '10px 10px' : 'auto',
                  backgroundPosition: transparentBg ? '0 0, 0 5px, 5px -5px, -5px 0px' : 'auto'
                }}
              >
                {newLink && QRCodeStyling ? (
                  <div 
                    ref={previewRef}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    {!QRCodeStyling ? (
                      <div>⏳ Loading QR library...</div>
                    ) : (
                      <div>Enter a link to see preview</div>
                    )}
                  </div>
                )}
              </div>
              {transparentBg && (
                <div className="mt-2 text-sm text-gray-600 text-center">
                  📝 Checkered pattern shows transparent background
                </div>
              )}
            </div>
          </div>


          {/* Transparent Background Option */}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Background Color</label>
                <input
                type="color"
                value={newBgColor}
                onChange={(e) => setNewBgColor(e.target.value)}
                disabled={transparentBg}
                className={`w-full h-12 border border-gray-300 rounded cursor-pointer ${transparentBg ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

            <div className="flex items-center mt-6">
              <input
              type="checkbox"
              id="transparentBg"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="transparentBg" className="font-medium text-gray-700">
              Transparent Background
              </label>
            </div>
            </div>
          

          {/* Premium Styling Options - Full Width Row */}
          {user?.hasAccess && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-4 flex items-center">
                ✨ Premium Styling & Color Options
              </div>
              
              {/* Color Controls for Premium Users */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Individual Color Controls</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                     🌐 Dots Color
                    </label>
                    <input
                      type="color"
                      value={dotsColor}
                      onChange={(e) => setDotsColor(e.target.value)}
                      className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                     💠 Square Color
                    </label>
                    <input
                      type="color"
                      value={cornerSquareColor}
                      onChange={(e) => setCornerSquareColor(e.target.value)}
                      className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      ⚫ Corner Dot Color
                    </label>
                    <input
                      type="color"
                      value={cornerDotColor}
                      onChange={(e) => setCornerDotColor(e.target.value)}
                      className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Style Controls */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Style Options</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Dot Style</label>
                    <select
                      value={dotStyle}
                      onChange={(e) => setDotStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="square">Square</option>
                      <option value="rounded">Rounded</option>
                      <option value="classy">Classy</option>
                      <option value="classy-rounded">Classy Rounded</option>
                      <option value="extra-rounded">Extra Rounded</option>
                      <option value="dots">Dots</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium">Corner Square Style</label>
                    <select
                      value={cornerSquareStyle}
                      onChange={(e) => setCornerSquareStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="square">Square</option>
                      <option value="extra-rounded">Extra Rounded</option>
                      <option value="dot">Dot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">Corner Dot Style</label>
                    <select
                      value={cornerDotStyle}
                      onChange={(e) => setCornerDotStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="square">Square</option>
                      <option value="dot">Dot</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade prompt for free users */}
          {!user?.hasAccess && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                🚀 Unlock Premium Features
              </div>
              <div className="text-xs text-blue-600 mb-3">
                • Individual color controls for dots, corners, and squares (🌐💠⚫)<br/>
                • Advanced styling options (6 dot styles, 3 corner styles)<br/>
                • 50 QR codes limit<br/>
              </div>
             <ButtonCheckout
                mode="subscription"
                priceId={config.stripe.plans[1].priceId} 
              />
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={addQRCode}
              disabled={!newLink || !newName || !QRCodeStyling}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create QR Code
            </button>

            <button
              onClick={() => {
                setShowCreateView(false);
                setNewLink('');
                setNewName('');
                setNewColor('#000000');
                setNewBgColor('#ffffff');
                setTransparentBg(false);
                setDotsColor('#000000');
                setCornerDotColor('#000000');
                setCornerSquareColor('#000000');
                setNewSize(300);
                setDotStyle('square');
                setCornerDotStyle('square');
                setCornerSquareStyle('square');
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* QR Codes Grid */}
      {qrCodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((code: any) => {
            const codeKey = code.id ?? code._id;
            return (
            <div key={codeKey} className="border border-gray-300 p-4 rounded-lg shadow-sm">
              <h3 className="mb-3 text-lg font-bold">{code.name}</h3>
              
              {/* QR Code Display with proper background */}
              <div className="mb-3 flex justify-center">
                <div 
                  className="border border-gray-200 rounded p-2"
                  style={{
                    backgroundColor: code.transparentBg ? '#f8f9fa' : '#ffffff',
                    backgroundImage: code.transparentBg ? 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)' : 'none',
                    backgroundSize: code.transparentBg ? '8px 8px' : 'auto',
                    backgroundPosition: code.transparentBg ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                  }}
                >
                  <div
                    ref={el => {
                      qrRefs.current[codeKey] = el;
                      if (el && QRCodeStyling) {
                        setTimeout(() => createQRCodeForDisplay(code), 100);
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      minHeight: '128px',
                      minWidth: '128px'
                    }}
                  >
                    {!QRCodeStyling && (
                      <div className="text-gray-400 text-sm">Loading QR...</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Show if transparent */}
              {code.transparentBg && (
                <div className="text-xs text-gray-500 text-center mb-2">
                  📝 Transparent Background
                </div>
              )}
              
              <p className="mb-3 text-sm break-words text-gray-600">{code.url}</p>

              {/* Style Info - Enhanced for premium */}
              <div className="mb-3 text-xs text-gray-500 space-y-1">
                <div>Style: {code.dotType || 'square'} dots, {code.cornerType || 'square'} corners</div>
                {code.dotsColor || code.cornerDotColor || code.cornerSquareColor ? (
                  <div>
                    Colors: 
                    <span className="ml-1">🌐 {code.color}</span> <br></br>
                    <span className="ml-1">💠 {code.cornerSquareColor || code.color}</span>
                    <span className="ml-1">⚫ {code.cornerDotColor || code.color}</span>
                  </div>
                ) : (
                  <div>Colors: {code.color || '#000000'} / {code.transparentBg ? 'transparent' : (code.bgColor || '#ffffff')}</div>
                )}
              </div>

              {/* Download Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleDownload(code, 'png')}
                  disabled={!QRCodeStyling}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  PNG
                </button>
                
                <button
                  onClick={() => handleDownload(code, 'svg')}
                  disabled={!QRCodeStyling}
                  className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  SVG
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(codeKey)}
                className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          );
          })}
        </div>
      )}

      {/* Empty state — only shown when not in create view */}
      {!showCreateView && qrCodes.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-3">📱</div>
          <div className="text-sm">No QR codes yet. Hit <strong>Create QR</strong> to get started!</div>
        </div>
      )}
      
      {alert && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-center">
          {alert}
        </div>
      )}
    </div>
    </>
  );
};

export default QRCodeGenerator;
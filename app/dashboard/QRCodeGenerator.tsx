import React, { useRef } from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import QRCode from 'react-qr-code';
import apiClient from "@/libs/api";
import Head from 'next/head';
import ReactDOM from 'react-dom/client';

// Dynamic import for qr-code-styling to avoid SSR issues
let QRCodeStyling: any = null;

// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string;
}

const QRCodeGenerator = () => {
  const [qrCodes, setQRCodes] = useState<any>();
  const [newLink, setNewLink] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [showCreateView, setShowCreateView] = useState(false);
  const [testQRCode, setTestQRCode] = useState<any>(null); // For testing new library
  const [showTestView, setShowTestView] = useState(false); // Toggle test view
  const {data, status} = useSession();
  const [user, setUser] = useState<any>();
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Refs for testing new library
  const testQRRef = useRef<HTMLDivElement>(null);

  // Get the maximum allowed pages based on user status
  const getMaxCodes = () => {
    return user?.hasAccess ? 30 : 10;
  };

  // Load QR Code Styling library dynamically
  useEffect(() => {
    const loadQRCodeStyling = async () => {
      try {
        const module = await import('qr-code-styling');
        QRCodeStyling = module.default;
      } catch (error) {
        console.warn('qr-code-styling not available:', error);
      }
    };
    loadQRCodeStyling();
  }, []);

  // TEST FUNCTION - Create QR Code with new library
 const createTestQRCode = async () => {
    if (!testQRRef.current || !newLink) {
      console.error('Missing testQRRef or newLink');
      setAlert('Please enter a link first');
      return;
    }

    if (!QRCodeStyling) {
      console.error('QR Code Styling not loaded');
      setAlert('QR Code Styling library not loaded yet. Please wait a moment and try again.');
      return;
    }

    try {
      // Clear previous QR code
      testQRRef.current.innerHTML = '';

      const qrCode = new QRCodeStyling({
        width: 300,
        height: 300,
        type: "svg",
        data: newLink,
        dotsOptions: {
          color: newColor,
          type: "rounded"
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 20
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: newColor
        },
        cornersDotOptions: {
          type: "dot",
          color: newColor
        }
      });

      console.log('QR Code created:', qrCode);
      setTestQRCode(qrCode);
      
      // Append to the ref
      qrCode.append(testQRRef.current);
      
      setAlert("Test QR Code generated with qr-code-styling!");
    } catch (error) {
      console.error('Error creating test QR code:', error);
      setAlert(`Error creating test QR code: ${error.message}`);
    }
  };

  // TEST FUNCTION - Download QR Code from new library
  const downloadTestQRCode = (format: 'png' | 'svg' = 'png') => {
    if (!testQRCode) {
      console.error('No test QR code to download');
      return;
    }

    testQRCode.download({
      name: `test_qr_code_${newName || 'influanto'}`,
      extension: format
    });
  };

  // Ref to capture the canvas element
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle QR Code download using Canvas
  const handleDownload = (url: string) => {
    if (!url) {
      console.error("No QR Code to download.");
      return;
    }
  
    // Create a hidden div to render the QRCode component
    const qrCodeContainer = document.createElement("div");
    qrCodeContainer.style.display = "none";
    document.body.appendChild(qrCodeContainer);
  
    // Render QRCode component to the hidden div using createRoot
    const root = ReactDOM.createRoot(qrCodeContainer);
    root.render(<QRCode value={url} size={128} />);
  
    // Use a small delay to ensure rendering is complete before querying the SVG
    setTimeout(() => {
      const svg = qrCodeContainer.querySelector("svg");
  
      if (!svg) {
        console.error("SVG not found.");
        // Clean up even if SVG not found
        if (qrCodeContainer.parentNode === document.body) {
          document.body.removeChild(qrCodeContainer);
        }
        return;
      }
  
      // Create an image link and set the data URL for download
      const link = document.createElement("a");
      link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`;
      link.download = `Influanto_QRCode_${user?.name || 'User'}.svg`; // Set the file name for download
  
      // Trigger the download
      link.click();
  
      // Clean up by removing the hidden container after the download - FIXED
      try {
        if (qrCodeContainer.parentNode === document.body) {
          root.unmount(); // Properly unmount React component
          document.body.removeChild(qrCodeContainer);
        }
      } catch (error) {
        console.warn("Error cleaning up QR code container:", error);
      }
    }, 100); // Increased delay to ensure rendering is complete
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/delete-code`, {
        data: { id }
      });
      
      setQRCodes(qrCodes.filter((code: any) => code._id !== id));
      setAlert("QR Code deleted successfully.");
      
    } catch (e: any) {
      console.error('Delete error:', e);
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
      console.log(data[0].codes);
      setQRCodes(data[0].codes);
    } catch (e) {
      setAlert(e?.message);
    } 
  }

  const addQRCode = async () => {
    try {
      const maxCodes = getMaxCodes();
      
      if (qrCodes && qrCodes.length >= maxCodes) {
        const userType = user?.hasAccess ? "premium" : "free";
        setAlert(`You can only create up to ${maxCodes} QR codes on the ${userType} plan.`);
        return;
      }

      const { data } = await apiClient.post("/codes", {
        link: newLink,
        name: newName,
        color: newColor
      });

      console.log(data);
      setAlert("QR Code saved successfully");
      setShowCreateView(false);
      
      setNewLink('');
      setNewName('');
      setNewColor('#000000');
      
      getQrCodes();
    } catch (e) {
      setAlert(e?.message);
    } finally {
      setIsLoading(false);
      setEditing(false);
    }
  };

  return (
    <>
    <Head>
      <title>Influanto | FREE QR Code Generator</title>
      <meta name="description" content="Generate and manage your QR codes easily. FREE QR Code Generator." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content="FREE QR Code Generator" />
      <meta property="og:description" content="Generate and manage your QR codes easily." />
      <meta name="twitter:title" content="FREE QR Code Generator" />
      <meta name="twitter:description" content="Generate and manage your QR codes easily." />
    </Head>
    <div className="p-4 bg-white shadow rounded-md text-black">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-2">QR Codes</h2>
        <div className="flex gap-2">
          {/* TEST BUTTON - New Library */}
          <button
            onClick={() => setShowTestView(!showTestView)}
            className="mb-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            {showTestView ? 'Hide Test' : 'Test New Library'}
          </button>
          
          {!showCreateView && qrCodes?.length < getMaxCodes() && (
            <button
              onClick={() => setShowCreateView(true)}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
          )}
        </div>
      </div>

    {/* TEST SECTION - New Library */}
      {showTestView && (
        <div className="mb-6 border-2 border-purple-300 p-4 rounded bg-purple-50">
          <h3 className="text-lg font-bold mb-3 text-purple-800">🧪 Testing qr-code-styling Library</h3>
          
          {/* Debug info */}
          <div className="mb-2 text-sm text-gray-600">
            QRCodeStyling loaded: {QRCodeStyling ? '✅ Yes' : '❌ No'}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold">Test Link</label>
              <input
                placeholder="Enter link to test new library"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="mb-3 px-3 py-2 bg-white border border-gray-300 rounded w-full"
              />
              
              <label className="block mb-2 font-semibold">Test Name</label>
              <input
                placeholder="Name for test QR code"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mb-3 px-3 py-2 bg-white border border-gray-300 rounded w-full"
              />
              
              <label className="block mb-2 font-semibold">Color</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full h-12 border border-gray-300 rounded cursor-pointer mb-3"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={createTestQRCode}
                  disabled={!newLink}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Generate Test QR
                </button>
                
                {testQRCode && (
                  <>
                    <button
                      onClick={() => downloadTestQRCode('png')}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => downloadTestQRCode('svg')}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      SVG
                    </button>
                  </>
                )}
              </div>
              
              {/* Debug section */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong><br/>
                Link: {newLink || 'Not set'}<br/>
                Color: {newColor}<br/>
                TestQRCode: {testQRCode ? 'Created' : 'Not created'}
              </div>
            </div>
            
            <div>
              <label className="block mb-2 font-semibold">Test Preview (qr-code-styling)</label>
              <div className="border-2 border-dashed border-purple-300 rounded p-4 min-h-[320px] flex items-center justify-center bg-white">
                <div ref={testQRRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {!testQRCode && (
                    <div className="text-gray-400 text-center">
                      {!QRCodeStyling ? 'Loading qr-code-styling...' : 'Enter link and click Generate Test QR'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        {qrCodes?.length || 0} of {getMaxCodes()} QR codes used
        {!user?.hasAccess && (
          <span className="ml-2 text-blue-600">
            (Upgrade to Premium for up to 30 QR codes)
          </span>
        )}
      </div>

      {showCreateView &&  (
        <div className="mb-4 border border-gray-300 p-4 rounded">
          <h4>Your New QR Code (Original Library)</h4>
          <input
            placeholder="Enter link for QR code"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            className="mb-2 px-3 py-2 bg-white border border-gray-300 rounded w-full"
          />
          <label>Name</label>
          <input
            placeholder="Name for your link"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mb-2 px-3 py-2 bg-white border border-gray-300 rounded w-full"
          />
          <label className="mr-2">Color</label>
          <div className="flex items-center">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 h-12 mr-4 border-1 border-gray-300 rounded-lg cursor-pointer"
            />
            {newLink && (
              <div>
                <QRCode value={newLink} size={128} fgColor={newColor} />
              </div>
            )}
          </div>
          
          <button
            onClick={addQRCode}
            className="px-4 py-2 mt-4 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add QR Code
          </button>

          <button
              onClick={() => {
                setShowCreateView(false);
                setNewLink('');
                setNewName('');
                setNewColor('#000000');
              }}
              className="mb-4 ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Cancel
            </button>
        </div>
      )} 

      {qrCodes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {qrCodes.map((code: any) => (
            <div key={code._id} className="border border-gray-300 p-4 rounded">
              <p className="mb-1 text-lg font-bold">{code.name}</p>
              <div className="mb-2">
                <QRCode value={code.url} size={128} fgColor={code.color || "#000000"} />
              </div>
              <p className="mb-2 break-words">{code.url}</p>

              <button
                onClick={() => handleDownload(code.url)}
                className="btn-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Download
              </button>

              <button
                onClick={() => handleDelete(code._id)}
                className="btn-xs ml-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
    </div>
    </>
  );
};

export default QRCodeGenerator;
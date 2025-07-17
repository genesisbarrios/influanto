import React, { useRef } from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import QRCode from 'react-qr-code';
import QRCodeProps from 'react-qr-code';
import apiClient from "@/libs/api";
import Head from 'next/head';
import ReactDOM from 'react-dom/client';

// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string; // Assuming there's an avatar URL you want to display
}


const QRCodeGenerator = () => {
  const [qrCodes, setQRCodes] = useState<any>();
  const [newLink, setNewLink] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [showCreateView, setShowCreateView] = useState(false);
  const {data, status} = useSession();
  const [user, setUser] = useState<any>();
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null); //state for user data

  // Get the maximum allowed pages based on user status
  const getMaxCodes = () => {
    return user?.hasAccess ? 30 : 10;  // Premium users get 30, free users get 10
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
        return;
      }
  
      // Create an image link and set the data URL for download
      const link = document.createElement("a");
      link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`;
      link.download = "Influanto QRCode " + user.name + ".svg"; // Set the file name for download
  
      // Trigger the download
      link.click();
  
      // Clean up by removing the hidden container after the download
      document.body.removeChild(qrCodeContainer);
    }, 50); // A smaller delay to give time for rendering
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/delete-code`, {
        data: { id }  // The 'id' is sent in the request body
      });
      
      // If we get here, the deletion was successful
      setQRCodes(qrCodes.filter((code: any) => code._id !== id));
      setAlert("QR Code deleted successfully.");
      
    } catch (e: any) {
      console.error('Delete error:', e);
      // Handle error response from backend
      const errorMessage = e?.response?.data?.error || e?.response?.data?.message || "An error occurred while deleting the QR Code.";
      setAlert(errorMessage);
    }
  };

  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      setUser(data);
  
    } catch (e) {
      //console.error(e?.message);
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
      
      // Check if user has reached the limit
      if (qrCodes && qrCodes.length >= maxCodes) {
        const userType = user?.hasAccess ? "premium" : "free";
        setAlert(`You can only create up to ${maxCodes} QR codes on the ${userType} plan.`);
        return;
      }

      const { data } = await apiClient.post("/codes", {
        link: newLink,
        name: newName,
        color: newColor // Ensure the color is sent to the backend
      });

      console.log(data);
      setAlert("QR Code saved successfully");
      setShowCreateView(false);
      
      // Reset form fields after successful save
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
      {!showCreateView && qrCodes?.length < getMaxCodes() && (
          <button
            onClick={() => setShowCreateView(true)}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create
          </button>
        )}
      </div>

      {/* Optional: Show current usage */}
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
        <h4>Your New QR Code</h4>
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
              <QRCode value={newLink} size={128} fgColor={newColor} bgColor="transparent"/>
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
              // Reset form fields when canceling
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
              <QRCode value={code.url} size={128} bgColor="transparent" fgColor={code.color || "#000000"} />
            </div>
            <p className="mb-2 break-words">{code.url}</p>

            {/* Download Button */}
            <button
              onClick={() => handleDownload(code.url)}
              className="btn-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Download
            </button>

            {/* Delete Button */}
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
"use client";
import React, { useRef, useState, Suspense } from "react";
import Header from "@/components/Header"; // Assuming you have a Header component
import Footer from "@/components/Footer"; // Assuming you have a Footer component
// import type {} from "lamejs"; // No longer needed for server-side conversion

export default function MP3Converter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [converting, setConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null); // State to store the download URL
  const [error, setError] = useState<string | null>(null); // State to store error messages
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to store the selected file


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Accept both .wav and .wave extensions and fallback on type check
      if (
        file.type === "audio/wav" ||
        file.type === "audio/x-wav" ||
        file.name.toLowerCase().endsWith(".wav") ||
        file.name.toLowerCase().endsWith(".wave")
      ) {
        setSelectedFile(file); // Store the selected file in state
        setDownloadUrl(null); // Clear previous download URL
        setError(null); // Clear previous errors
      } else {
        alert("Please upload a .wav file.");
      }
    }
  };

  const handleConvert = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) return;

    setConverting(true);
    setDownloadUrl(null);
    setError(null);

    const formData = new FormData();
    formData.append("audioFile", selectedFile);

    try {
      // Use the correct API route for Next.js App Router (should be /api/convert, and you must have /app/api/convert/route.ts)
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      // If you get a 404 or 405, your API route is missing or misconfigured.
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        let errorMsg = "Conversion failed.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch {
          // fallback to status text if not JSON
          errorMsg = response.statusText || errorMsg;
        }
        setError(errorMsg);
        console.error("Conversion failed:", errorMsg);
      }
    } catch (error: any) {
      setError("An error occurred during conversion.");
      console.error("Error during conversion:", error);
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = "converted.mp3"; // Desired filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl); // Clean up
      document.body.removeChild(a); // Remove the temporary anchor tag
      setDownloadUrl(null); // Reset download URL
      setSelectedFile(null); // Clear the selected file after download
      if (fileInputRef.current) { // Reset file input
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div
        id="bpm-bg"
        style={{
          display: "flex",
          minHeight: "80vh",
          width: "100%",
          textAlign: "center"
        }}
      >
        {/* Left: Converter */}
        <div
          style={{
            width: "70%",
            padding: "2rem",
            background: "lightblue",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <h1 className="text-3xl font-bold mb-4" style={{ color: "#181b20" }}>
            WAV to MP3 Converter
          </h1>
          <p style={{ color: "#181b20" }}>
            Upload your WAV file below to convert it to MP3 format.
          </p>

          <form onSubmit={handleConvert} style={{color:"black"}}> {/* Wrap the form and attach submit handler */}
            <input
              type="file"
              ref={fileInputRef} // Assign ref to file input
              accept="audio/wav"
              onChange={handleFileChange}
            />
            <button className="btn btn-primary"style={{color:"black"}} type="submit" disabled={!selectedFile || converting}> {/* Disable button when converting or no file selected */}
              {converting ? "Converting..." : "Convert to MP3"}
            </button>
          </form>

          {error && <p style={{ color: "red" }}>Error: {error}</p>} {/* Display error messages */}

          {downloadUrl && (
            <div>
              <p>Conversion complete!</p>
              <button onClick={handleDownload}>Download MP3</button>
            </div>
          )}
        </div>
      <div
        style={{
          width: "30%",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#181b20"
        }}
      >
        <h3 className="text-xl font-bold mb-4" style={{color: "#181b20"}}>Join Influanto</h3>
        <button
          className="btn btn-primary"
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        onClick={() => window.location.href = "api/auth/signin?callbackUrl=/dashboard"}
        >
          Sign Up
        </button>
        <div style={{ color: "#181b20", textAlign: "center" }}>
          <p>
            Get access to more tools, save your settings, and connect with other musicians and producers.
          </p>
        </div>
      </div>
      </div>
      <Suspense>
        <Footer />
      </Suspense>
    </>
  );
}
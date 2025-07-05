"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";


export default function BPMCalculator() {
  const [bpm, setBpm] = useState<number>(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Calculate BPM from tap times
  const handleTap = () => {
    const now = Date.now();
    setTapTimes(prev => {
      const newTaps = [...prev, now];
      // Only keep the last 8 taps for smoothing
      if (newTaps.length > 8) newTaps.shift();
      if (newTaps.length > 1) {
        const intervals = newTaps.slice(1).map((t, i) => t - newTaps[i]);
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.round(60000 / avgMs));
      }
      return newTaps;
    });
  };

  // Listen for keyboard and screen taps
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only count spacebar or any key
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar" || e.key.length === 1) {
        if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault(); // Prevent page scroll on spacebar
        }
        handleTap();
      }
    };
    const handleClick = () => {
      handleTap();
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("touchstart", handleClick);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("touchstart", handleClick);
      window.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // Reset BPM and tap times
  const resetBPM = () => {
    setBpm(0);
    setTapTimes([]);
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
        {/* Left: Calculator */}
        <div
          style={{
            width: "70%",
            padding: "2rem",
            background: "#f9fafb",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column"
          }}
        >
            <h1 className="text-3xl font-bold mb-4" style={{color: "#181b20"}}>Tap Tempo - BPM Calculator</h1>
            <p style={{color: "#181b20"}}>
            Tap or click anywhere or any key for the BPM.
            </p>
        
            <h1
              className="font-bold mb-4"
              style={{
                fontSize: "15rem",
                lineHeight: 1,
                margin: "0.5em 0",
                color: "#181b20"
              }}
            >
              {bpm}
            </h1>
            <button
            className="btn btn-primary w-1/2 m-auto"
            style={{
                padding: "0.75rem 2rem",
                fontSize: "1.1rem",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                cursor: "pointer",
            }}
            onClick={resetBPM}
            >
            Reset BPM
            </button>
        </div>
        {/* Right: Sign up and info */}
        <div
          style={{
            width: "30%",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff"
          }}
        >
          <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
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
          <div style={{ textAlign: "center" }}>
            <p>
              Get access to more tools, save your settings, and connect with other musicians and producers.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        #bpm-bg {
          background: #638bcf !important;
        }
      `}</style>
      <Footer />
    </>
  );
}

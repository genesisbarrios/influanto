"use client";
import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import ToolJoinSidebar, { useShowJoinSidebar, toolPaneClass } from "@/components/ToolJoinSidebar";
import { getSEOTags } from "@/libs/seo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

// Estimate tempo from an audio buffer via an onset-energy autocorrelation.
function detectBPM(data: Float32Array, sampleRate: number): number {
  const frame = 1024, hop = 512;
  const env: number[] = [];
  for (let i = 0; i + frame <= data.length; i += hop) {
    let e = 0;
    for (let j = 0; j < frame; j++) { const s = data[i + j]; e += s * s; }
    env.push(e);
  }
  const flux: number[] = [];
  for (let i = 1; i < env.length; i++) { const d = env[i] - env[i - 1]; flux.push(d > 0 ? d : 0); }
  const envRate = sampleRate / hop;
  const minLag = Math.floor((envRate * 60) / 180);
  const maxLag = Math.ceil((envRate * 60) / 60);
  let bestLag = -1, best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < flux.length; i++) sum += flux[i] * flux[i - lag];
    if (sum > best) { best = sum; bestLag = lag; }
  }
  if (bestLag <= 0) return 0;
  let bpm = (60 * envRate) / bestLag;
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  return Math.round(bpm);
}

export default function BPMCalculator() {
  const showSidebar = useShowJoinSidebar();
  const [bpm, setBpm] = useState<number>(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const buf = await file.arrayBuffer();
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const audio = await ctx.decodeAudioData(buf);
      ctx.close().catch(() => {});
      setBpm(detectBPM(audio.getChannelData(0), audio.sampleRate));
    } catch {
      /* ignore decode errors */
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate BPM from tap times
  const handleTap = useCallback(() => {
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
  }, []);

  // Listen for keyboard and screen taps
  useEffect(() => {
    let touchStartTime: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only count spacebar or any key
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar" || e.key.length === 1) {
        if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault(); // Prevent page scroll on spacebar
        }
        handleTap();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default touch behaviors
      touchStartTime = Date.now();
      handleTap();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault(); // Prevent ghost clicks
      touchStartTime = null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle mouse events if it's not a touch device
      if (!('ontouchstart' in window)) {
        handleTap();
      }
    };

    // Add event listeners with proper options
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleTap]);

  // Reset BPM and tap times
  const resetBPM = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent the reset button from triggering a tap
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
          flexDirection: "column",
          minHeight: "80vh",
          width: "100%",
          textAlign: "center",
          touchAction: "manipulation" // Improve touch responsiveness
        }}
      >
        {/* Left: Calculator */}
        <div
          style={{
            background: "#f9fafb",
            touchAction: "manipulation" // Prevent zoom and other touch gestures
          }}
          className={toolPaneClass(showSidebar, "p-8")}
        >
            <h1 className="text-3xl font-bold mb-4" style={{color: "#181b20"}}>Tap Tempo - BPM Calculator</h1>
            <p style={{color: "#181b20"}}>
            Tap or click anywhere or any key for the BPM.
            </p>
        
          <h1
            className="font-bold mb-4"
            style={{
              fontSize: "clamp(8rem, 12vw, 14rem)", // Responsive font size
              lineHeight: 1,
              margin: "0.5em 0",
              color: "#181b20",
              userSelect: "none" // Prevent text selection on taps
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
                touchAction: "manipulation" // Prevent double-tap zoom
            }}
            onClick={resetBPM}
            onTouchStart={(e) => e.stopPropagation()} // Prevent tap counting when touching reset button
            >
            Reset BPM
            </button>

            <div style={{ marginTop: "1.25rem" }}>
              <button
                className="btn"
                style={{ padding: "0.6rem 1.5rem", fontSize: "1rem", borderRadius: 8, background: "#181b20", color: "#fff", border: "none", cursor: "pointer" }}
                disabled={analyzing}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              >
                {analyzing ? "Analyzing…" : <><FontAwesomeIcon icon={faArrowUpFromBracket} className="mr-2" /> Upload a song to detect BPM</>}
              </button>
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files?.[0])} />
              <p style={{ color: "#181b20", fontSize: "0.8rem", marginTop: "0.5rem", opacity: 0.7 }}>Estimate — works best on beat-driven tracks.</p>
            </div>
        </div>
        <ToolJoinSidebar show={showSidebar} />
      </div>
      <style>{`
        #bpm-bg {
          background: #638bcf !important;
        }
        
        @media (min-width: 640px) {
          #bpm-bg {
            flex-direction: row !important;
          }
        }

        /* Prevent text selection and improve touch responsiveness */
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
      <Footer />
    </>
  );
}
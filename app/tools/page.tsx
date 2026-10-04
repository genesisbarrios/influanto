"use client";
import React from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faMusic,
  faDrum,
  faStopwatch,
  faGuitar,
  faEarListen,
  faKeyboard,
  faTag,
  faShieldHalved,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const calcDelayMs = (bpm: number, note: number) => {
  if (!bpm || !note) return "";
  return ((60000 / bpm) * note).toFixed(2);
};

// No metronome icon in Font Awesome's free set, so it's drawn here in the same format
const faMetronome = {
  prefix: "fas",
  iconName: "metronome",
  icon: [512, 512, [], "", "M200 32H312L448 448H64Z M224 80L148 400H364L288 80Z M244 368L318 112L342 119L268 375Z M290 190L338 204L326 246L278 232Z M40 448H472V480H40Z"],
} as unknown as IconDefinition;

// Desktop shows 4 per row, so rows are: tools 1-4, 5-8 (synth, ear training, tuner, metronome), 9+
const tools: { title: string; description: string; href: string; icon: IconDefinition; color: string }[] = [
  {
    title: "Split Sheet Generator",
    description: "Create and export split sheets for your music collaborations.",
    href: "/Split-Sheet-Generator",
    icon: faFileLines,
    color: "#1e40af",
  },
  {
    title: "Song Key Finder",
    description: "Upload a song or use your mic to detect its musical key.",
    href: "/Key-Finder",
    icon: faMusic,
    color: "#2563eb",
  },
  {
    title: "BPM Calculator",
    description: "Tap/click on beat or upload the audio to find the tempo of your track.",
    href: "/BPM-Calculator",
    icon: faDrum,
    color: "#0284c7",
  },
  {
    title: "Delay & Reverb Time Calculator",
    description: "Calculate delay and reverb times for your song.",
    href: "/Reverb-and-Delay-Calculator",
    icon: faStopwatch,
    color: "#3b82f6",
  },
  {
    title: "Synthfluanto",
    description: "Create and share your own melodies with our synth.",
    href: "/Synthfluanto",
    icon: faKeyboard,
    color: "#1d4ed8",
  },
  {
    title: "Ear Training",
    description: "Pitch matching, interval recognition, and chord recognition for musicians, producers, and singers.",
    href: "/Ear-Training",
    icon: faEarListen,
    color: "#0ea5e9",
  },
  {
    title: "Chromatic Tuner",
    description: "Tune guitar, bass, violin, or any instrument with your mic.",
    href: "/Tuner",
    icon: faGuitar,
    color: "#1e3a8a",
  },
  {
    title: "Metronome",
    description: "Free online metronome with tap tempo, time signatures, and subdivisions.",
    href: "/Metronome",
    icon: faMetronome,
    color: "#0369a1",
  },
  {
    title: "Music Metadata Editor",
    description: "Edit MP3 & WAV tags — artist, composer, cover art, copyright — and download.",
    href: "/Metadata-Editor",
    icon: faTag,
    color: "#60a5fa",
  },
  {
    title: "Image Privacy Cleaner",
    description: "Strip GPS location & camera data (EXIF) from your photos.",
    href: "/Image-Privacy",
    icon: faShieldHalved,
    color: "#3a6fd8",
  },
  {
    title: "More Tools",
    description: "Sign Up to get access to more tools.",
    href: "api/auth/signin?callbackUrl=/dashboard",
    icon: faScrewdriverWrench,
    color: "#0c4a6e",
  },
];

export default function Tools() {
  const { data: session } = useSession();

  return (
    <>  
    <Suspense>
        <Header />
    </Suspense> 
    <div 
      id="tools-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: "80vh",
        width: "100%"
      }}
    >
      {/* Left: Free Tools Grid */}
      <div
        style={{
          padding: "2rem",
          background: "#f9fafb"
        }}
        className={`w-full p-8 ${session ? "" : "sm:w-3/4 sm:border-r sm:border-gray-300"}`}
      >
        <h1 className="text-2xl font-bold ml-8 mb-8 mt-4" style={{color: "#181b20"}}>Free Music Tools for Artists &amp; Producers</h1>
        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            width: "100%",
            margin: "0 auto",
          }}
          className={`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${session ? "tools-grid-loggedin" : ""}`}
        >
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                padding: "2rem 1.5rem",
                textAlign: "center",
                textDecoration: "none",
                color: "#222",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "220px",
                transition: "box-shadow 0.2s",
              }}
              className="tool-card"
            >
              <span style={{ fontSize: "2.5rem", marginBottom: "1rem", color: tool.color }}><FontAwesomeIcon icon={tool.icon} /></span>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                {tool.title}
              </span>
              <span style={{ color: "#666", fontSize: "0.98rem" }}>{tool.description}</span>
            </Link>
          ))}
        </div>
      </div>
      {/* Right: Sign up and info */}
      {!session && (
        <div style={{ background: "#fff" }} className="w-full sm:w-1/4">
          <div
            style={{
              position: "sticky",
              top: 0,
              minHeight: "100vh",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
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
            <div style={{ color: "#444", textAlign: "center" }}>
              <p>
                Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    <style>{`
      #tools-bg {
        background: #638bcf !important;
      }
      
      @media (min-width: 640px) {
        .tools-grid-loggedin {
          grid-template-columns: repeat(4, 1fr) !important;
          max-width: none !important;
        }

        #tools-bg {
          flex-direction: row !important;
        }
      }
    `}</style>
    <Footer></Footer>
    </>
  );
}

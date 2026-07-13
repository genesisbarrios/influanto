"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useSession } from "next-auth/react";

const calcDelayMs = (bpm: number, note: number) => {
  if (!bpm || !note) return "";
  return ((60000 / bpm) * note).toFixed(2);
};

const tools = [
   {
    title: "Split Sheet Generator",
    description: "Create and export split sheets for your music collaborations.",
    href: "/Split-Sheet-Generator",   
    icon: "📄",
  },
   {
    title: "Song Key Finder",
    description: "Upload a song or use your mic to detect its musical key.",
    href: "/Key-Finder",
    icon: "🎼",
  },
  {
    title: "BPM Calculator",
    description: "Tap/click on beat or upload the audio to find the tempo of your track.",
    href: "/BPM-Calculator",
    icon: "🎵",
  },
  {
    title: "Delay & Reverb Time Calculator",
    description: "Calculate delay and reverb times for your song.",
    href: "/Reverb-and-Delay-Calculator",
    icon: "⏱️",
  },
  {
    title: "Music Metadata Editor",
    description: "Edit MP3 & WAV tags — artist, composer, cover art, copyright — and download.",
    href: "/Metadata-Editor",
    icon: "🏷️",
  },
  {
    title: "Chromatic Tuner",
    description: "Tune guitar, bass, violin, or any instrument with your mic.",
    href: "/Tuner",
    icon: "🎻",
  },
  {
    title: "Ear Training",
    description: "Pitch matching, interval recognition, and chord recognition for musicians, producers, and singers.",
    href: "/Ear-Training",
    icon: "👂",
  },
  {
    title: "Synthfluanto",
    description: "Create and share your own melodies with our synth.",
    href: "/Synthfluanto",
    icon: "🎹",
  },
  {
    title: "Image Privacy Cleaner",
    description: "Strip GPS location & camera data (EXIF) from your photos.",
    href: "/Image-Privacy",
    icon: "🛡️",
  },
  
//   {
//     title: "WAV to MP3 Converter",
//     description: "Convert WAV files to MP3 format easily.",
//     href: "/MP3Converter",
//     icon: "🎛️",
//   },
  {
    title: "More Tools",
    description: "Sign Up to get access to more tools.",
    href: "api/auth/signin?callbackUrl=/dashboard",
    icon: "🛠️",
  },
  
];

export default function Tools() {
  const { data: session } = useSession();

useEffect(() => {
    document.title = "Music Tools | Influanto";
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Key Finder, Chromatic Tuner, Split Sheet Generator + more');

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Musician Tools | Influanto');

    // Update og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Key Finder, Chromatic Tuner,Split Sheet Generator + more');

    // Update twitter:title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', 'Musician Tools | Influanto');

    // Update twitter:description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', 'Delay & Reverb Calculator, BPM Calculator, Key Finder, Chromatic Tuner, Split Sheet Generator + more');
  }, []);


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
        alignItems: "flex-start",
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
        <h2 className="text-2xl font-bold ml-8 mb-8 mt-4" style={{color: "#181b20"}}>Music Tools</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
          }}
          className={session ? "tools-grid-loggedin" : ""}
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
                aspectRatio: "1 / 1",
                transition: "box-shadow 0.2s",
              }}
              className="tool-card"
            >
              <span style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{tool.icon}</span>
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
        <div
          style={{
            padding: "2rem",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "sticky",
            top: 0,
            alignSelf: "flex-start",
          }}
          className="w-full sm:w-1/4 p-8"
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

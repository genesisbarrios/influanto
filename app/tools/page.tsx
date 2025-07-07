"use client";
import React, { useState } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";

const calcDelayMs = (bpm: number, note: number) => {
  if (!bpm || !note) return "";
  return ((60000 / bpm) * note).toFixed(2);
};

const tools = [
  {
    title: "Delay & Reverb Time Calculator",
    description: "Calculate musical delay and reverb times for your BPM.",
    href: "/Reverb-and-Delay-Calculator",
    icon: "⏱️",
  },
  {
    title: "BPM Calculator",
    description: "Tap or click on beat to find the tempo of your track.",
    href: "/BPM-Calculator",
    icon: "🎵",
  },
//   {
//     title: "WAV to MP3 Converter",
//     description: "Convert WAV files to MP3 format easily.",
//     href: "/MP3Converter",
//     icon: "🎛️",
//   },
//   {
//     title: "Synthfluanto",
//     description: "Create and share your own melodies in our app.",
//     href: "/Synthfluanto",
//     icon: "🎹",
//   },
  {
    title: "Split Sheet Generator",
    description: "Create and export split sheets for your music collaborations.",
    href: "/Split-Sheet-Generator",
    icon: "📄",
  },
  {
    title: "More Tools",
    description: "Sign Up to get access to more tools.",
    href: "api/auth/signin?callbackUrl=/dashboard",
    icon: "🛠️",
  },
  
];

export default function Tools() {
  return (
    <>  
    <Suspense>
        <Header />
    </Suspense>
    <div style={{ display: "flex", minHeight: "80vh", width: "100%" }}>
      {/* Left: Free Tools Grid */}
      <div
        style={{
          width: "70%",
          padding: "2rem",
          background: "#f9fafb",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        <h2 className="text-2xl font-bold ml-8 mb-8 mt-4" style={{color: "#181b20"}}>Free Tools</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
          }}
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
      <div
        style={{
          width: "30%",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
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
            Get access to more tools, save your settings, and connect with other musicians and producers.
          </p>
        </div>
      </div>
    </div>
    <Footer></Footer>
    </>
  );
}

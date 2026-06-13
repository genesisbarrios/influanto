"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";
import apiClient from "@/libs/api";

interface ChainCollectible {
  tokenId: number;
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  artist: string;
  genres: string;
  priceMatic: string;
  minted: number;
  maxEditions: number;
  available: number;
}

export default function Collectibles() {
  const [collectibles, setCollectibles] = useState<ChainCollectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFromChain() {
      try {
        setLoading(true);
        const result: any = await apiClient.get("/collectibles/chain");
        setCollectibles(result.collectibles ?? []);
      } catch (err: any) {
        console.error("Failed to load collectibles from chain:", err);
        setError("Could not load collectibles from the contract.");
      } finally {
        setLoading(false);
      }
    }
    fetchFromChain();
  }, []);

  useEffect(() => {
    document.title = "Music Collectibles | Influanto";
  }, []);

  const fmtAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>

      <div
        id="collectibles-bg"
        style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}
      >
        <div style={{ padding: "2rem", background: "#f9fafb" }} className="w-full p-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto mb-8 mt-4">
            <h2 className="text-2xl font-bold" style={{ color: "#181b20" }}>
              Music Collectibles
            </h2>
            <span className="text-xs text-gray-400 font-mono">Polygon Amoy · ERC-1155</span>
          </div>

          {loading && (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            </div>
          )}

          {error && (
            <p className="text-center text-red-500 mt-12">{error}</p>
          )}

          {!loading && !error && collectibles.length === 0 && (
            <p className="text-center text-gray-400 mt-12">No collectibles minted yet.</p>
          )}

          {!loading && !error && collectibles.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "2rem",
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
              {collectibles.map((c) => (
                <div
                  key={c.tokenId}
                  style={{
                    background: c.imageUrl
                      ? `url(${c.imageUrl}) center center/cover no-repeat`
                      : "#1e1e2e",
                    borderRadius: "16px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                    aspectRatio: "1 / 1.3",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "220px",
                    maxWidth: "220px",
                    width: "100%",
                    transition: "box-shadow 0.2s",
                  }}
                  className="tool-card"
                >
                  {/* Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.2) 100%)",
                      borderRadius: "16px",
                      zIndex: 1,
                    }}
                  />

                  {/* Full-card link */}
                  <Link
                    href={`/collectible/${c.creator}/${encodeURIComponent(c.title)}`}
                    style={{ position: "absolute", inset: 0, zIndex: 2 }}
                    aria-label={c.title}
                  />

                  {/* Content */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 3,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "0.9rem",
                      pointerEvents: "none",
                    }}
                  >
                    {/* Token ID badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: "0.7rem",
                        right: "0.7rem",
                        background: "rgba(255,255,255,0.12)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: "99px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      #{c.tokenId}
                    </span>

                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "#fff",
                        textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title}
                    </span>

                    {c.artist && (
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                        {c.artist}
                      </span>
                    )}

                    {/* Price + editions row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a78bfa" }}>
                        {parseFloat(c.priceMatic).toFixed(4)} MATIC
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>
                        {c.minted}/{c.maxEditions} minted
                      </span>
                    </div>

                    {/* Creator */}
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "rgba(255,255,255,0.4)",
                        marginTop: "0.3rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtAddress(c.creator)}
                    </span>

                    {/* Audio preview */}
                    {c.audioUrl && (
                      <audio
                        controls
                        style={{
                          width: "100%",
                          marginTop: "0.6rem",
                          borderRadius: "8px",
                          pointerEvents: "auto",
                        }}
                      >
                        <source src={c.audioUrl} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        #collectibles-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #collectibles-bg { flex-direction: row !important; } }
        .tool-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.28) !important; transform: translateY(-2px); }
      `}</style>

      <Footer />
    </>
  );
}

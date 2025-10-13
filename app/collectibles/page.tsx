"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";
import apiClient from "@/libs/api";

export default function Collectibles() {
  // ✅ All hooks and state INSIDE the component
  const [collectibles, setCollectibles] = useState<
    { title: string; imageUrl: string; audioUrl:string; userId: string; description: string }[]
  >([]);

  // ✅ Move fetchNFTs function INSIDE the component
  const fetchNFTs = async () => {
    try {
      const response = await apiClient.get('/collectibles/fetch-all', {
        params: {
          limit: 10,
          page: 1,
        }
      });
      
      console.log('Full response:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.collectibles) {
        setCollectibles(response.data.data.collectibles);
      } else if (response.data.collectibles) {
        setCollectibles(response.data.collectibles);
      } else if (Array.isArray(response.data)) {
        setCollectibles(response.data);
      } else {
        console.log('No collectibles found, setting empty array');
        setCollectibles([]);
      }
    } catch (error) {
      console.error('Error fetching collectibles:', error);
      setCollectibles([]);
    }
  };

  // ✅ First useEffect for fetching data
  useEffect(() => {
    async function fetchCollectibles() {
      await fetchNFTs();
    }
    fetchCollectibles();
  }, []);

  // ✅ Second useEffect for meta tags
  useEffect(() => {
    document.title = "Music Collectibles | Influanto";
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Split Sheet Generator + more');

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
    ogDescription.setAttribute('content', 'Free Musician Tools: Delay & Reverb Calculator, BPM Calculator, Split Sheet Generator + more');

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
    twitterDescription.setAttribute('content', 'Delay & Reverb Calculator, BPM Calculator, Split Sheet Generator + more');
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
          minHeight: "80vh", 
          width: "100%" 
        }}
      >
        <div
          style={{
            padding: "2rem",
            background: "#f9fafb"
          }}
          className="w-full p-8 sm:border-r sm:border-gray-300"
        >
          <h2 className="text-2xl font-bold ml-8 mb-8 mt-4" style={{color: "#181b20"}}>Music Collectibles</h2>
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
            {collectibles.map((collectible, index) => (
            <div
                key={`${collectible.title}-${index}`}
                style={{
                    background: `url(${collectible.imageUrl}) center center/cover no-repeat`,
                    borderRadius: "16px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    padding: "1.5rem 1rem",
                    textAlign: "center",
                    color: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    aspectRatio: "1 / 1.15",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "200px",
                    maxWidth: "220px",
                    width: "100%",
                    margin: "0",
                    transition: "box-shadow 0.2s",
                }}
                className="tool-card"
            >
                <Link
                    href={collectible.userId ? `/${collectible.userId}/${collectible.title}` : '/'}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        borderRadius: "16px",
                        textDecoration: "none",
                        color: "inherit",
                    }}
                    tabIndex={-1}
                    aria-label={collectible.title}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        borderRadius: "16px",
                        zIndex: 1,
                    }}
                />
                <div
                    style={{
                        position: "relative",
                        zIndex: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%",
                        pointerEvents: "none",
                    }}
                >
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            marginBottom: "0.4rem",
                            textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 2px #000",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "95%",
                        }}
                        title={collectible.title}
                    >
                        {collectible.title}
                    </span>
                    <span
                        style={{
                            color: "#fff",
                            fontSize: "0.92rem",
                            textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 2px #000",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "95%",
                        }}
                        title={collectible.description}
                    >
                        {collectible.description}
                    </span>
                </div>
                <audio
                    controls
                    style={{
                        width: "95%",
                        marginTop: "0.7rem",
                        borderRadius: "8px",
                        zIndex: 4,
                        background: "#222",
                        pointerEvents: "auto",
                    }}
                >
                    <source src={collectible.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        #tools-bg {
          background: #638bcf !important;
        }
        
        @media (min-width: 640px) {
          #tools-bg {
            flex-direction: row !important;
          }
        }
      `}</style>
      <Footer />
    </>
  );
}
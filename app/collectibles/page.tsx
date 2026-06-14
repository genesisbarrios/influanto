"use client";
import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";
import dynamic from "next/dynamic";
import apiClient from "@/libs/api";
import { useSession } from "next-auth/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const WalletManagerModal = dynamic(() => import("@/components/WalletManagerModal"), { ssr: false });

interface ChainCollectible {
  tokenId: number;
  creator: string;
  creatorEns: string | null;
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

type View = "browse" | "mine";

export default function Collectibles() {
  const { data: session, status: authStatus } = useSession();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [view, setView] = useState<View>("browse");

  const [browseItems, setBrowseItems]     = useState<ChainCollectible[]>([]);
  const [myItems, setMyItems]             = useState<ChainCollectible[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [myLoading, setMyLoading]         = useState(false);
  const [browseError, setBrowseError]     = useState<string | null>(null);
  const [myError, setMyError]             = useState<string | null>(null);
  const [myFetched, setMyFetched]         = useState(false);
  const [noWallet, setNoWallet]           = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [ensName, setEnsName]             = useState<string | null>(null);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [polBalance, setPolBalance]       = useState<string | null>(null);

  const fetchBrowse = useCallback(async () => {
    try {
      setBrowseLoading(true);
      setBrowseError(null);
      const result: any = await apiClient.get("/collectibles/chain");
      setBrowseItems(result.collectibles ?? []);
    } catch {
      setBrowseError("Could not load collectibles from the contract.");
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  const fetchMine = useCallback(async () => {
    if (myFetched) return;
    try {
      setMyLoading(true);
      setMyError(null);
      setNoWallet(false);
      const result: any = await apiClient.get("/collectibles/mine");
      if (result.noWallet) {
        setNoWallet(true);
        setMyFetched(true);
        return;
      }
      setMyItems(result.collectibles ?? []);
      setMyFetched(true);
    } catch {
      setMyError("Could not load your collectibles.");
    } finally {
      setMyLoading(false);
    }
  }, [myFetched]);

  useEffect(() => { fetchBrowse(); }, [fetchBrowse]);

  useEffect(() => { document.title = "Music Collectibles | Influanto"; }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    apiClient.get("/wallet/info").then((result: any) => {
      setWalletAddresses(result.walletAddresses ?? []);
      setEnsName(result.ensName ?? null);
    }).catch(() => {});
  }, [authStatus]);

  useEffect(() => {
    if (view === "mine" && session && !myFetched) fetchMine();
  }, [view, session, myFetched, fetchMine]);

  useEffect(() => {
    const primary = walletAddresses[0];
    if (!primary) { setPolBalance(null); return; }
    fetch("https://rpc-amoy.polygon.technology", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [primary, "latest"], id: 1 }),
    })
      .then((r) => r.json())
      .then((data) => setPolBalance((Number(BigInt(data.result)) / 1e18).toFixed(4)))
      .catch(() => setPolBalance(null));
  }, [walletAddresses]);

  const fmtAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

  const isLoggedIn = authStatus === "authenticated";
  const loading    = view === "browse" ? browseLoading : myLoading;
  const error      = view === "browse" ? browseError  : myError;
  const items      = view === "browse" ? browseItems  : myItems;

  const emptyMessage =
    view === "mine"
      ? isLoggedIn
        ? "You haven't minted any collectibles yet."
        : "Sign in to see your collection."
      : "No collectibles minted yet.";

  const tabStyle = (active: boolean) => ({
    padding: "8px 22px",
    borderRadius: "99px",
    fontWeight: 600,
    fontSize: "0.9rem",
    border: "2px solid",
    cursor: "pointer" as const,
    transition: "all 0.15s",
    borderColor: active ? "#7c3aed" : "#d1d5db",
    backgroundColor: active ? "#7c3aed" : "#ffffff",
    color: active ? "#ffffff" : "#6b7280",
  });

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
          {/* Header */}
          <div className="flex items-center justify-between max-w-5xl mx-auto mb-6 mt-4 flex-wrap gap-4">
            <h2 className="text-2xl font-bold" style={{ color: "#181b20" }}>
              Music Collectibles
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex justify-between items-center max-w-5xl mx-auto mb-8">
          <div className="flex gap-2">
            <button onClick={() => setView("browse")} style={tabStyle(view === "browse")}>
              🌐 Browse
            </button>

            <button onClick={() => setView("mine")} style={tabStyle(view === "mine")}>
              🎵 My Collection
            </button>
          </div>

          {isLoggedIn && walletAddresses.length > 0 && (() => {
            const primary = walletAddresses[0];
            const live =
              authenticated &&
              wallets.some((w) => w.address?.toLowerCase() === primary.toLowerCase());

            return (
              <button
                onClick={() => setShowWalletManager(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                  live
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-700"
                }`}
              >
                <span className={`text-xs ${live ? "text-green-500" : "text-amber-400"}`}>
                  ●
                </span>

                {ensName ?? `${primary.slice(0, 6)}…${primary.slice(-4)}`}

                {polBalance !== null && (
                  <span className="text-[11px] font-normal opacity-70">
                    {polBalance} POL
                  </span>
                )}

                {!live && ready && (
                  <span className="text-[10px] font-normal opacity-75">
                    · Reconnect
                  </span>
                )}
              </button>
            );
          })()}
        </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <p className="text-center text-red-500 mt-12">{error}</p>
          )}

          {/* Not signed in on My Collection */}
          {!loading && !error && view === "mine" && !isLoggedIn && (
            <p className="text-center text-gray-400 mt-12">{emptyMessage}</p>
          )}

          {/* No wallet saved in DB — prompt to connect via proper flow */}
          {!loading && !error && view === "mine" && isLoggedIn && noWallet && (
            <div className="flex flex-col items-center mt-16 gap-3">
              <p className="text-gray-500 font-medium">No wallet connected to your account.</p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                To view your collection, go to your profile and connect a wallet by selecting <strong>Create</strong> and choosing Privy or an EVM wallet.
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && !noWallet && items.length === 0 && (view === "browse" || isLoggedIn) && (
            <p className="text-center text-gray-400 mt-12">{emptyMessage}</p>
          )}

          {/* Grid */}
          {!loading && !error && !noWallet && items.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "2rem",
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
              {items.map((c) => (
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
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.2) 100%)",
                      borderRadius: "16px",
                      zIndex: 1,
                    }}
                  />

                  <Link
                    href={`/collectible/${c.creator}/${encodeURIComponent(c.title)}`}
                    style={{ position: "absolute", inset: 0, zIndex: 2 }}
                    aria-label={c.title}
                  />

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

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a78bfa" }}>
                        {parseFloat(c.priceMatic).toFixed(4)} POL
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>
                        {c.minted}/{c.maxEditions} minted
                      </span>
                    </div>

                    {c.creator && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "rgba(255,255,255,0.4)",
                          marginTop: "0.3rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {c.creatorEns ?? fmtAddress(c.creator)}
                      </span>
                    )}

                    {c.audioUrl && (
                      <audio
                        controls
                        style={{ width: "100%", marginTop: "0.6rem", borderRadius: "8px", pointerEvents: "auto" }}
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

      {showWalletManager && (
        <WalletManagerModal
          walletAddresses={walletAddresses}
          ensName={ensName}
          onClose={() => setShowWalletManager(false)}
          onUpdate={(addresses, ens) => {
            setWalletAddresses(addresses);
            setEnsName(ens);
            if (addresses.length === 0) setShowWalletManager(false);
          }}
        />
      )}

      <Footer />
    </>
  );
}

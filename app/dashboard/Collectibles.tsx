"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faLock } from "@fortawesome/free-solid-svg-icons";
import { usePrivy, useWallets, useLogin } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import apiClient from "@/libs/api";

const NFTCreationModal = dynamic(() => import("../../components/NFTCreationModal"), {
  ssr: false,
  loading: () => <div>Loading modal...</div>,
});

const WalletManagerModal = dynamic(() => import("../../components/WalletManagerModal"), {
  ssr: false,
});

interface Collectible {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  audioUrl: string;
  artist: string;
  genres: string[];
  bpm?: number;
  lyrics?: string;
  editionSize: number;
  priceUsd?: number;
  type: "single" | "album";
  status: string;
  trackCount?: number;
  tracks?: any[];
}

interface UserProfile {
  name?: string;
  email?: string;
  id?: string;
}

const Collectibles = () => {
  const [mounted, setMounted] = useState(false);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletInfoLoaded, setWalletInfoLoaded] = useState(false);
  // track addresses we've already attempted to save this session to prevent duplicate calls
  const attemptedSavesRef = useRef<Set<string>>(new Set());

  const { ready, authenticated, user: privyUser } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin({
    onError: () => setWalletConnecting(false),
  });

  // Is Privy actively connected to the user's primary saved wallet?
  const privyHasPrimary =
    ready &&
    authenticated &&
    walletAddresses.length > 0 &&
    wallets.some(
      (w) => w.address?.toLowerCase() === walletAddresses[0]?.toLowerCase()
    );

  // Whenever Privy has a wallet that isn't saved in our DB yet, save it.
  // walletInfoLoaded guard ensures we don't race against fetchWalletInfo —
  // without it, Privy wallets can populate before the DB fetch returns,
  // causing a false "unsaved" detection for wallets that are already stored.
  useEffect(() => {
    if (!mounted || !authenticated || wallets.length === 0 || !walletInfoLoaded) return;

    const unsaved = wallets.find(
      (w) =>
        w.address &&
        !walletAddresses.includes(w.address) &&
        !attemptedSavesRef.current.has(w.address)
    );
    if (!unsaved) return;

    attemptedSavesRef.current.add(unsaved.address);
    setWalletConnecting(true);
    setWalletError(null);
    const isFirstWallet = walletAddresses.length === 0;

    apiClient
      .post("/wallet/save", { address: unsaved.address, privyUserId: privyUser?.id ?? null })
      .then(({ data }) => {
        const newAddresses: string[] = data.walletAddresses ?? [];
        setWalletAddresses(newAddresses);
        setEnsName(data.ensName ?? null);
        setWalletConnecting(false);
        if (newAddresses.length > 0) {
          fetchNFTs();
          if (isFirstWallet) setModalOpen(true);
        }
      })
      .catch((err) => {
        console.error("Wallet save failed:", err);
        // Allow retry by removing from attempted set
        attemptedSavesRef.current.delete(unsaved.address);
        setWalletConnecting(false);
        setWalletError("Failed to save wallet. Please try again.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, walletAddresses, authenticated, mounted, walletInfoLoaded]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchUserProfile();
    fetchWalletInfo();
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading collectibles...</p>
          </div>
        </div>
      </div>
    );
  }

  const fetchUserProfile = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      setUserProfile(data);
      fetchNFTs();
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const { data } = await apiClient.get("/wallet/info");
      setWalletAddresses(data.walletAddresses ?? []);
      setEnsName(data.ensName ?? null);
      if ((data.walletAddresses ?? []).length > 0) fetchNFTs();
    } catch {
      // not signed in or no wallet yet
    } finally {
      setWalletInfoLoaded(true);
    }
  };

  const fetchNFTs = async () => {
    try {
      const response = await apiClient.get("/musiccollectibles/get", {
        params: { limit: 10, page: 1 },
      });
      if (response.data.success && response.data.data?.collectibles) {
        setCollectibles(response.data.data.collectibles);
      } else if (response.data.collectibles) {
        setCollectibles(response.data.collectibles);
      } else if (Array.isArray(response.data)) {
        setCollectibles(response.data);
      } else {
        setCollectibles([]);
      }
    } catch {
      setCollectibles([]);
    }
  };

  const handleCreateNFT = () => {
    if (walletAddresses.length === 0) {
      setWalletError(null);
      setWalletConnecting(true);
      login();
      return;
    }
    setModalOpen(true);
  };

  const primaryAddress = walletAddresses[0] ?? null;
  const hasWallet = walletAddresses.length > 0;

  return (
    <div className="p-6">
      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Collectibles</h1>

        {!walletInfoLoaded ? (
          // Skeleton while DB wallet info loads
          <div className="w-36 h-8 bg-gray-100 rounded-full animate-pulse" />
        ) : hasWallet ? (
          // ENS/wallet pill — green when Privy is live, amber when session needs reconnect
          <button
            onClick={() => setShowWalletManager(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
              privyHasPrimary
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                : "bg-amber-50 hover:bg-amber-100 text-amber-700"
            }`}
          >
            <span className={`text-xs ${privyHasPrimary ? "text-green-500" : "text-amber-400"}`}>
              ●
            </span>
            {ensName ?? `${primaryAddress!.slice(0, 6)}…${primaryAddress!.slice(-4)}`}
            {!privyHasPrimary && ready && (
              <span className="text-[10px] font-normal opacity-75">· Reconnect</span>
            )}
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => { setWalletError(null); setWalletConnecting(true); login(); }}
              disabled={walletConnecting}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {walletConnecting && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {walletConnecting ? "Connecting…" : "Create"}
            </button>
            {walletError && (
              <p className="text-xs text-red-500">{walletError}</p>
            )}
          </div>
        )}
      </div>

      {/* Collectibles grid */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {collectibles.map((collectible) => (
            <a
              key={collectible._id}
              href={`/collectible/${userProfile?.id || userProfile?.name}/${encodeURIComponent(collectible.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden block"
            >
              <img
                src={collectible.imageUrl || "/placeholder.png"}
                alt={collectible.title}
                className="w-full h-48 object-cover"
              />
              <h3 className="p-2 text-center font-semibold">{collectible.title}</h3>
            </a>
          ))}

          {/* Create collectible card */}
          <div
            onClick={handleCreateNFT}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-48 transition
              ${collectibles.length === 0 ? "col-span-3" : ""}
              ${hasWallet
                ? "cursor-pointer hover:bg-gray-100 border-gray-300"
                : "cursor-pointer border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
          >
            <FontAwesomeIcon
              icon={hasWallet ? faPlus : faLock}
              className={`text-5xl ${hasWallet ? "text-gray-400" : "text-gray-300"}`}
            />
            <p className={`mt-2 font-semibold text-center ${hasWallet ? "text-gray-500" : "text-gray-400"}`}>
              {hasWallet ? "Create New Collectible" : "Create to Get Started"}
            </p>
            {!hasWallet && (
              <p className="text-xs text-gray-400 mt-1 text-center px-4">
                Set up your wallet to create collectibles
              </p>
            )}
          </div>
        </div>
      </div>

      <NFTCreationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(newNFT) =>
          setCollectibles([
            ...collectibles,
            {
              ...newNFT,
              id: Date.now().toString(),
              audioUrl: newNFT.audio ?? "",
              editionSize: typeof newNFT.editionSize === "number" ? newNFT.editionSize : 1,
              genres: Array.isArray(newNFT.genre) ? newNFT.genre : newNFT.genre ? [newNFT.genre] : [],
              status: "created",
            } as Collectible,
          ])
        }
      />

      {showWalletManager && (
        <WalletManagerModal
          walletAddresses={walletAddresses}
          ensName={ensName}
          onClose={() => setShowWalletManager(false)}
          onUpdate={(addresses, ens) => {
            setWalletAddresses(addresses);
            setEnsName(ens);
            if (addresses.length === 0) {
              setShowWalletManager(false);
              setCollectibles([]);
            }
          }}
        />
      )}
    </div>
  );
};

export default Collectibles;

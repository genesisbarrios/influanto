"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faLock, faTrash } from "@fortawesome/free-solid-svg-icons";
import { usePrivy, useWallets, useLogin, useFundWallet } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import apiClient from "@/libs/api";

const NFTCreationModal = dynamic(() => import("../../components/NFTCreationModal"), {
  ssr: false,
  loading: () => <div>Loading modal...</div>,
});

const WalletManagerModal = dynamic(() => import("../../components/WalletManagerModal"), {
  ssr: false,
});

interface ChainCollectible {
  tokenId: number;
  creator: string;
  title: string;
  description?: string;
  imageUrl?: string;
  audioUrl: string;
  artist: string;
  genres: string | string[];
  priceMatic: string;
  minted: number;
  maxEditions: number;
}

const Collectibles = () => {
  const [mounted, setMounted] = useState(false);
  const [collectibles, setCollectibles] = useState<ChainCollectible[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletInfoLoaded, setWalletInfoLoaded] = useState(false);
  const [walletInfoFetchOk, setWalletInfoFetchOk] = useState(false);
  const [deletingTokenId, setDeletingTokenId] = useState<number | null>(null);
  const [polBalance, setPolBalance] = useState<string | null>(null);
  const attemptedSavesRef = useRef<Set<string>>(new Set());
  const userTriggeredRef = useRef(false);
  const ensLookupAttemptedRef = useRef(false);

  const { ready, authenticated, user: privyUser, logout } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin({
    onComplete: () => {
      // walletConnecting stays true until the auto-save effect completes;
      // this is just a safety fallback if the save never fires
    },
    onError: () => setWalletConnecting(false),
  });

  const privyHasPrimary =
    ready && authenticated && walletAddresses.length > 0 &&
    wallets.some((w) => w.address?.toLowerCase() === walletAddresses[0]?.toLowerCase());

  useEffect(() => {
    if (!mounted || !authenticated || wallets.length === 0 || !walletInfoLoaded) return;
    if (!walletInfoFetchOk) return;
    // For first-time users (no wallet in DB yet), only save if the user explicitly clicked
    if (walletAddresses.length === 0 && !userTriggeredRef.current) return;

    // If the session has a Privy embedded wallet (Google / email login), never
    // auto-save external EVM wallets detected from the browser. The user chose
    // Privy — don't silently add their MetaMask or any injected wallet.
    const hasEmbedded = wallets.some((w) => w.walletClientType === "privy" && w.address);
    const unsaved = wallets.find(
      (w) =>
        w.address &&
        !walletAddresses.includes(w.address) &&
        !attemptedSavesRef.current.has(w.address) &&
        (!hasEmbedded || w.walletClientType === "privy")
    );
    if (!unsaved) return;

    attemptedSavesRef.current.add(unsaved.address);
    setWalletError(null);
    const isFirstWallet = walletAddresses.length === 0;

    apiClient
      .post("/wallet/save", { address: unsaved.address, privyUserId: privyUser?.id ?? null, walletClientType: unsaved.walletClientType })
      .then((result: any) => {
        const newAddresses: string[] = result.walletAddresses ?? [];
        setWalletAddresses(newAddresses);
        setEnsName(result.ensName ?? null);
        setWalletConnecting(false);
        if (newAddresses.length > 0) {
          fetchNFTs(newAddresses[0]);
          if (isFirstWallet) setModalOpen(true);
        }
      })
      .catch((err:any) => {
        const msg: string = err?.response?.data?.error ?? err?.message ?? "Unknown error";
        attemptedSavesRef.current.delete(unsaved.address);
        userTriggeredRef.current = false;
        setWalletConnecting(false);
        setWalletError(`Failed to save wallet: ${msg}`);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, walletAddresses, authenticated, mounted, walletInfoLoaded, walletInfoFetchOk]);

  useEffect(() => {
    setMounted(true);
    // If the user was mid-OAuth redirect (Google login), the page reloaded and
    // userTriggeredRef reset to false. Restore the intent from localStorage so
    // the auto-save effect can fire when Privy's session comes back.
    if (localStorage.getItem("privy_pending_wallet_save") === "1") {
      userTriggeredRef.current = true;
      localStorage.removeItem("privy_pending_wallet_save");
    }
  }, []);
  useEffect(() => { if (mounted) fetchWalletInfo(); }, [mounted]);

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

  // After wallet loads: if ENS name is missing or is only an influanto subname,
  // attempt a reverse lookup on Ethereum mainnet and save the personal .eth name.
  useEffect(() => {
    console.log("Running ENS lookup effect", { walletInfoLoaded, walletInfoFetchOk, walletAddresses, ensName, attempted: ensLookupAttemptedRef.current });
    if (!walletInfoLoaded || !walletInfoFetchOk || walletAddresses.length === 0) return;
    if (ensName && !ensName.endsWith(".influanto.eth")) return;
    if (ensLookupAttemptedRef.current) return;
    ensLookupAttemptedRef.current = true;
    apiClient.get(`/wallet/ens-sync?address=${walletAddresses[0]}`)
      .then((result: any) => {
        console.log("ens-sync response:", result);
        if (result.ensName) setEnsName(result.ensName);
      })
      .catch((err: any) => {
        console.error("ens-sync failed:", err?.response?.status, err?.response?.data ?? err?.message);
      });
    console.log("Result ENS lookup effect", { walletInfoLoaded, walletInfoFetchOk, walletAddresses, ensName, attempted: ensLookupAttemptedRef.current });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletInfoLoaded, walletInfoFetchOk, walletAddresses.length, ensName]);

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading collectibles...</p>
        </div>
      </div>
    );
  }

  const fetchWalletInfo = async () => {
    try {
      const result: any = await apiClient.get("/wallet/info");
      const addrs: string[] = result.walletAddresses ?? [];
      setWalletAddresses(addrs);
      setEnsName(result.ensName || null);
      setWalletInfoFetchOk(true);
      if (addrs.length > 0) fetchNFTs(addrs[0]);
    } catch (err: any) {
      console.error("fetchWalletInfo failed:", err?.message);
    } finally {
      setWalletInfoLoaded(true);
    }
  };

  const fetchNFTs = async (primaryWallet?: string) => {
    try {
      const result: any = await apiClient.get("/collectibles/chain");
      const all: ChainCollectible[] = result.collectibles ?? [];
      const wallet = (primaryWallet ?? walletAddresses[0])?.toLowerCase();
      setCollectibles(wallet ? all.filter((c) => c.creator?.toLowerCase() === wallet) : all);
    } catch {
      setCollectibles([]);
    }
  };

  const handleDelete = async (tokenId: number) => {
    if (!confirm("Remove this collectible from your dashboard? It stays on-chain permanently.")) return;
    setDeletingTokenId(tokenId);
    try {
      await apiClient.delete(`/collectibles/${tokenId}`);
      setCollectibles((prev) => prev.filter((c) => c.tokenId !== tokenId));
    } catch (err: any) {
      alert("Delete failed: " + (err?.message ?? "Unknown error"));
    } finally {
      setDeletingTokenId(null);
    }
  };

  const handleCreateNFT = async () => {
    if (walletAddresses.length === 0) {
      setWalletError(null);
      userTriggeredRef.current = true;

      if (ready && authenticated && wallets.length > 0) {
        // Privy embedded wallet (created via Google / email login) — save it directly.
        // No page redirect needed; the wallet is already available in this session.
        const embedded = wallets.find(
          (w) => w.walletClientType === "privy" && w.address && !attemptedSavesRef.current.has(w.address)
        );
        if (embedded) {
          setWalletConnecting(true);
          attemptedSavesRef.current.add(embedded.address);
          try {
            const result: any = await apiClient.post("/wallet/save", {
              address: embedded.address,
              privyUserId: privyUser?.id ?? null,
              walletClientType: "privy",
            });
            const newAddresses: string[] = result.walletAddresses ?? [];
            setWalletAddresses(newAddresses);
            setEnsName(result.ensName ?? null);
            setWalletConnecting(false);
            if (newAddresses.length > 0) {
              fetchNFTs(newAddresses[0]);
              setModalOpen(true);
            }
          } catch (err: any) {
            const msg = err?.response?.data?.error ?? err?.message ?? "Unknown error";
            attemptedSavesRef.current.delete(embedded.address);
            userTriggeredRef.current = false;
            setWalletConnecting(false);
            setWalletError(`Failed to save wallet: ${msg}`);
          }
          return;
        }

        // Only external wallets in the session (stale EVM connection from a different
        // account). Clear the session so the picker shows fresh for the user to choose.
        await logout();
      }

      setWalletConnecting(true);
      // Persist intent across the Google OAuth page redirect so auto-save fires on return.
      localStorage.setItem("privy_pending_wallet_save", "1");
      // Keep the collectibles tab active after the redirect.
      window.history.replaceState(null, "", "/dashboard?tab=collectibles");

      login();
      return;
    }
    setModalOpen(true);
  };

  const primaryAddress = walletAddresses[0] ?? null;
  const hasWallet = walletAddresses.length > 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Collectibles</h1>

        {!walletInfoLoaded ? (
          <div className="w-36 h-8 bg-gray-100 rounded-full animate-pulse" />
        ) : hasWallet ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
            >
              + Create
            </button>
            <button
              onClick={() => setShowWalletManager(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                privyHasPrimary ? "bg-blue-50 hover:bg-blue-100 text-blue-700" : "bg-amber-50 hover:bg-amber-100 text-amber-700"
              }`}
            >
              <span className={`text-xs ${privyHasPrimary ? "text-green-500" : "text-amber-400"}`}>●</span>
              {ensName ?? `${primaryAddress!.slice(0, 6)}…${primaryAddress!.slice(-4)}`}
              {polBalance !== null && (
                <span className="text-[11px] font-normal opacity-70">{polBalance} POL</span>
              )}
              {!privyHasPrimary && ready && <span className="text-[10px] font-normal opacity-75">· Reconnect</span>}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleCreateNFT}
              disabled={walletConnecting}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {walletConnecting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {walletConnecting ? "Connecting…" : "Create"}
            </button>
            {walletError && <p className="text-xs text-red-500">{walletError}</p>}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {collectibles.map((c) => (
          <div key={c.tokenId} className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden group relative">
            {/* Delete button — visible on hover */}
            <button
              onClick={(e) => { e.preventDefault(); handleDelete(c.tokenId); }}
              disabled={deletingTokenId === c.tokenId}
              title="Remove from dashboard"
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>

            <a
              href={`/collectible/${c.creator}/${encodeURIComponent(c.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={c.imageUrl || "/placeholder.png"}
                alt={c.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 truncate">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.artist}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium text-purple-600">{parseFloat(c.priceMatic).toFixed(4)} MATIC</span>
                  <span className="text-xs text-gray-400">{c.minted}/{c.maxEditions} minted</span>
                </div>
              </div>
            </a>
          </div>
        ))}

        {/* Create card */}
        <div
          onClick={handleCreateNFT}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-48 transition
            ${collectibles.length === 0 ? "sm:col-span-2 md:col-span-3" : ""}
            ${hasWallet ? "cursor-pointer hover:bg-gray-100 border-gray-300" : "cursor-pointer border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
        >
          <FontAwesomeIcon icon={hasWallet ? faPlus : faLock} className={`text-5xl ${hasWallet ? "text-gray-400" : "text-gray-300"}`} />
          <p className={`mt-2 font-semibold text-center ${hasWallet ? "text-gray-500" : "text-gray-400"}`}>
            {hasWallet ? "Create New Collectible" : "Create to Get Started"}
          </p>
          {!hasWallet && <p className="text-xs text-gray-400 mt-1 text-center px-4">Set up your wallet to create collectibles</p>}
        </div>
      </div>

      <NFTCreationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        walletAddresses={walletAddresses}
        ensName={ensName}
        onWalletUpdate={(addresses, ens) => { setWalletAddresses(addresses); setEnsName(ens); }}
        onCreate={(newNFT) =>
          setCollectibles((prev) => [
            ...prev,
            {
              tokenId: Date.now(),
              creator: walletAddresses[0] ?? "",
              title: newNFT.title,
              description: newNFT.description,
              imageUrl: newNFT.image,
              audioUrl: newNFT.audio ?? "",
              artist: newNFT.artist,
              genres: newNFT.genre ?? "",
              priceMatic: "0",
              minted: 0,
              maxEditions: newNFT.editionSize ?? 1,
            },
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
            if (addresses.length === 0) { setShowWalletManager(false); setCollectibles([]); }
          }}
        />
      )}
    </div>
  );
};

export default Collectibles;

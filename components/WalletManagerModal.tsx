"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy, useWallets, useLogin, useConnectWallet, useLoginWithOAuth } from "@privy-io/react-auth";
import apiClient from "@/libs/api";

interface WalletManagerModalProps {
  walletAddresses: string[];
  ensName: string | null;
  onClose: () => void;
  onUpdate: (walletAddresses: string[], ensName: string | null) => void;
}

export default function WalletManagerModal({
  walletAddresses,
  ensName,
  onClose,
  onUpdate,
}: WalletManagerModalProps) {
  const [loadingAddress, setLoadingAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingWallet, setAddingWallet] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const prevCountRef = useRef(walletAddresses.length);
  const { ready, authenticated } = usePrivy();
  const { wallets: privyWallets } = useWallets();

  // Reconnect via Google OAuth directly — avoids the "switch to Ethereum mainnet"
  // prompt that appears when the general login() modal shows MetaMask as an option.
  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => setReconnecting(false),
    onError: () => setReconnecting(false),
  });
  const { login } = useLogin({
    onComplete: () => setReconnecting(false),
    onError: () => setReconnecting(false),
  });

  // Add another wallet for already-authenticated users
  const { connectWallet } = useConnectWallet({
    onError: () => setAddingWallet(false),
  });

  // Clear "adding" state when parent confirms the new wallet landed in the DB
  useEffect(() => {
    if (walletAddresses.length > prevCountRef.current) {
      setAddingWallet(false);
    }
    prevCountRef.current = walletAddresses.length;
  }, [walletAddresses]);

  // True when Privy has an active connection to this address
  const isLive = (addr: string) =>
    authenticated &&
    privyWallets.some((w) => w.address?.toLowerCase() === addr.toLowerCase());

  const needsReconnect = ready && !authenticated && walletAddresses.length > 0;

  const handleSetPrimary = async (address: string) => {
    setLoadingAddress(address);
    setError(null);
    try {
      const result: any = await apiClient.post("/wallet/set-primary", { address });
      onUpdate(result.walletAddresses ?? [], result.ensName ?? null);
    } catch {
      setError("Failed to set primary wallet. Please try again.");
    } finally {
      setLoadingAddress(null);
    }
  };

  const handleRemove = async (address: string) => {
    setLoadingAddress(`${address}-remove`);
    setError(null);
    try {
      const result: any = await apiClient.post("/wallet/remove", { address });
      onUpdate(result.walletAddresses ?? [], result.ensName ?? null);
      if ((result.walletAddresses ?? []).length === 0) onClose();
    } catch {
      setError("Failed to remove wallet. Please try again.");
    } finally {
      setLoadingAddress(null);
    }
  };

  const handleAddWallet = () => {
    setAddingWallet(true);
    setError(null);
    connectWallet();
  };

  const handleReconnect = () => {
    setReconnecting(true);
    setError(null);
    // Use direct Google OAuth to avoid Privy showing MetaMask which prompts
    // a "switch to Ethereum mainnet" request.
    initOAuth({ provider: "google" }).catch(() => {
      // Fall back to generic login if OAuth fails (e.g. user wants email)
      login();
    });
  };

  const fmt = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Wallet Management</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {walletAddresses.length} wallet{walletAddresses.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Reconnect banner — shown when Privy session has expired */}
        {needsReconnect && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-amber-500 text-base mt-0.5">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Wallet session expired</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Sign in with Google to restore your embedded wallet
              </p>
            </div>
            <button
              disabled={reconnecting}
              onClick={handleReconnect}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-60 transition font-semibold"
            >
              {reconnecting ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting…
                </span>
              ) : (
                "Sign in with Google"
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Wallet list */}
        <div className="space-y-3 mb-4">
          {walletAddresses.map((address, idx) => {
            const isPrimary = idx === 0;
            const hasPrimaryEns = isPrimary && ensName;
            const live = isLive(address);
            const isSettingPrimary = loadingAddress === address;
            const isRemoving = loadingAddress === `${address}-remove`;
            const isBusy = isSettingPrimary || isRemoving;

            return (
              <div
                key={address}
                className={`rounded-xl border p-4 transition-colors ${
                  isPrimary ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Status + role badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {/* Live / Offline indicator */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      live
                        ? "text-green-700 bg-green-100"
                        : "text-amber-700 bg-amber-100"
                    }`}
                  >
                    <span className="text-xs">●</span>
                    {ready ? (live ? "Connected" : "Offline") : "…"}
                  </span>

                  {isPrimary && (
                    <span className="inline-flex items-center text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      PRIMARY
                    </span>
                  )}

                  {hasPrimaryEns && (
                    <span className="text-sm font-semibold text-blue-700">{ensName}</span>
                  )}
                </div>

                {/* Full address */}
                <p className="font-mono text-sm text-gray-700 break-all mb-3">{address}</p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!isPrimary && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleSetPrimary(address)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                    >
                      {isSettingPrimary ? "Updating…" : "Set Primary"}
                    </button>
                  )}
                  <a
                    href={`https://faucet.polygon.technology/?address=${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium"
                  >
                    Get Test POL
                  </a>
                  <button
                    disabled={isBusy || walletAddresses.length === 1}
                    onClick={() => handleRemove(address)}
                    title={walletAddresses.length === 1 ? "Cannot remove your only wallet" : `Remove ${fmt(address)}`}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                  >
                    {isRemoving ? "Removing…" : "Remove"}
                  </button>
                  {/* Transfer ownership — requires on-chain txs, coming soon */}
                  <button
                    disabled
                    title="NFT ownership transfer between wallets — coming soon"
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                  >
                    Transfer Ownership
                    <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-500 rounded px-1 py-0.5">
                      Soon
                    </span>
                  </button>
                </div>

                {/* {hasPrimaryEns && (
                  <p className="text-xs text-gray-400 mt-2">
                    ENS subdomain points to this wallet
                  </p>
                )} */}
              </div>
            );
          })}
        </div>

        {/* Add another wallet */}
        <button
          onClick={handleAddWallet}
          disabled={addingWallet}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          {addingWallet ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Waiting for wallet connection…
            </>
          ) : (
            <>
              <span className="text-base font-bold">+</span>
              Add Another Wallet
            </>
          )}
        </button>
      </div>
    </div>
  );
}

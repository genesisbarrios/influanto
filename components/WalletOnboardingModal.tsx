"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets, useLogin } from "@privy-io/react-auth";
import apiClient from "@/libs/api";

interface WalletOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (walletAddresses: string[], ensName: string | null) => void;
}

type Step = "choose" | "loading" | "success" | "error";
type LoginIntent = "create" | "connect" | null;

export default function WalletOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletOnboardingModalProps) {
  const { authenticated, user: privyUser } = usePrivy();
  const { wallets } = useWallets();

  const [step, setStep] = useState<Step>("choose");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ walletAddresses: string[]; ensName: string | null } | null>(null);
  const [loginIntent, setLoginIntent] = useState<LoginIntent>(null);
  const [waitingForWallet, setWaitingForWallet] = useState(false);

  const saveWallet = async (address: string, privyUserId?: string | null) => {
    const { data } = await apiClient.post("/wallet/save", {
      address,
      privyUserId: privyUserId ?? null,
    });
    return data as { walletAddresses: string[]; ensName: string | null };
  };

  // After Privy login completes, pick up the right wallet based on intent
  useEffect(() => {
    if (!waitingForWallet || wallets.length === 0) return;

    const target =
      loginIntent === "create"
        ? wallets.find((w) => w.walletClientType === "privy")         // embedded
        : wallets.find((w) => w.walletClientType !== "privy");        // external EVM

    if (!target) return;

    setWaitingForWallet(false);
    setLoginIntent(null);

    saveWallet(target.address, privyUser?.id ?? null)
      .then((saved) => {
        setResult(saved);
        setStep("success");
        onSuccess?.(saved.walletAddresses, saved.ensName);
      })
      .catch((err: any) => {
        setErrorMsg(err?.message ?? "Failed to save wallet. Please try again.");
        setStep("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, waitingForWallet]);

  const { login } = useLogin({
    onComplete: () => setWaitingForWallet(true),
    onError: () => {
      setErrorMsg("Cancelled or failed. Please try again.");
      setStep("error");
    },
  });

  if (!isOpen) return null;

  // ── Option 1: Create Influanto embedded wallet ───────────────────────────
  const handleCreatePrivyWallet = () => {
    setStep("loading");
    setErrorMsg("");
    setLoginIntent("create");
    if (authenticated) {
      setWaitingForWallet(true); // already logged in, wallet may already exist
    } else {
      login();
    }
  };

  // ── Option 2: Connect existing EVM wallet (MetaMask, Rainbow, etc.) ──────
  const handleConnectEvmWallet = () => {
    setStep("loading");
    setErrorMsg("");
    setLoginIntent("connect");
    // login() with 'wallet' in loginMethods shows Privy's wallet picker
    // which supports MetaMask, Rainbow (via WalletConnect), Coinbase, etc.
    login();
  };

  const handleClose = () => {
    setStep("choose");
    setErrorMsg("");
    setResult(null);
    setLoginIntent(null);
    setWaitingForWallet(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#1a1d24",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem" }}>
          <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            {step === "success" ? "You're set up!" : "Get started with Web3"}
          </span>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Choose */}
        {step === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#9ca3af", fontSize: "0.92rem", marginBottom: "0.5rem" }}>
              Choose how you want to get your wallet. We&apos;ll handle the rest.
            </p>

            <button
              onClick={handleCreatePrivyWallet}
              style={{
                background: "linear-gradient(135deg, #638bcf 0%, #4a6fa8 100%)",
                border: "none", borderRadius: "12px", padding: "1rem 1.25rem",
                color: "#fff", fontWeight: 600, fontSize: "1rem", cursor: "pointer",
                textAlign: "left", display: "flex", flexDirection: "column", gap: "0.3rem",
              }}
            >
              <span>✨ Create Influanto Wallet</span>
              <span style={{ fontWeight: 400, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)" }}>
                We create a secure wallet for you — no seed phrases needed
              </span>
            </button>

            <button
              onClick={handleConnectEvmWallet}
              style={{
                background: "#23272f", border: "1px solid #3a3f4b", borderRadius: "12px",
                padding: "1rem 1.25rem", color: "#fff", fontWeight: 600, fontSize: "1rem",
                cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.3rem",
              }}
            >
              <span>🦊 Connect EVM Wallet</span>
              <span style={{ fontWeight: 400, fontSize: "0.82rem", color: "#9ca3af" }}>
                Connect MetaMask, Rainbow, or any EVM wallet
              </span>
            </button>
          </div>
        )}

        {/* Loading */}
        {step === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0" }}>
            <div style={{
              width: "42px", height: "42px",
              border: "3px solid #3a3f4b", borderTop: "3px solid #638bcf",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
              {loginIntent === "create" ? "Setting up your wallet…" : "Opening wallet picker…"}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Success */}
        {step === "success" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {result.ensName && (
              <div style={{ background: "#23272f", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                <p style={{ color: "#9ca3af", fontSize: "0.78rem", marginBottom: "0.25rem" }}>Your ENS name</p>
                <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#638bcf" }}>{result.ensName}</p>
              </div>
            )}
            <div style={{ background: "#23272f", borderRadius: "10px", padding: "0.85rem 1rem" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                Linked wallet{result.walletAddresses.length > 1 ? "s" : ""}
              </p>
              {result.walletAddresses.map((addr) => (
                <p key={addr} style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#d1d5db", wordBreak: "break-all", marginBottom: "0.2rem" }}>
                  {addr}
                </p>
              ))}
            </div>
            <button
              onClick={handleClose}
              style={{ background: "#638bcf", border: "none", borderRadius: "10px", padding: "0.85rem", color: "#fff", fontWeight: 600, fontSize: "1rem", cursor: "pointer", marginTop: "0.25rem" }}
            >
              Done
            </button>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#f87171", fontSize: "0.95rem" }}>{errorMsg}</p>
            <button
              onClick={() => { setStep("choose"); setLoginIntent(null); }}
              style={{ background: "#23272f", border: "1px solid #3a3f4b", borderRadius: "10px", padding: "0.85rem", color: "#fff", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

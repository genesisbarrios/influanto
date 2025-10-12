"use client"; // Add this at the top

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faWallet, faExclamationTriangle, faTimes, faExternalLinkAlt, faLock } from "@fortawesome/free-solid-svg-icons";
import { web3Accounts, web3Enable, web3FromSource } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import NFTCreationModal from "../../components/NFTCreationModal";
import apiClient from "@/libs/api";

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
  type: 'single' | 'album';
  status: string;
  trackCount?: number;
  tracks?: any[];
}

interface UserProfile {
  name: string;
  email: string;
  walletAddress?: string;
}

const Collectibles: React.FC = () => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [walletMismatch, setWalletMismatch] = useState<boolean>(false);
  const [newWalletAddress, setNewWalletAddress] = useState<string | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState<boolean>(false);
  const [showWalletDialog, setShowWalletDialog] = useState<boolean>(false);
  const [showInstallDialog, setShowInstallDialog] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Wallet installation options
  const walletOptions = [
    {
      name: "Fearless Wallet",
      icon: "💎",
      description: "Mobile-first wallet for Polkadot & Kusama",
      url: "https://fearlesswallet.io/",
      platforms: ["Mobile", "Desktop"]
    },
    {
      name: "Talisman",
      icon: "🔮",
      description: "Beautiful wallet for Polkadot & Ethereum",
      url: "https://talisman.xyz/",
      platforms: ["Browser Extension"]
    },
    {
      name: "SubWallet",
      icon: "🌐",
      description: "Comprehensive wallet for all Substrate chains",
      url: "https://subwallet.app/",
      platforms: ["Browser Extension", "Mobile"]
    }
  ];

  // Fetch user profile on page load
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await apiClient.get("/get-user");
        setUserProfile(data);

        if (data.walletAddress) {
          setWallet(data.walletAddress);
          fetchNFTs();
          localStorage.setItem("connectedWallet", data.walletAddress);
        } else {
          const savedWallet = localStorage.getItem("connectedWallet");
          if (savedWallet) {
            setWallet(savedWallet);
            fetchNFTs();
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  const detectWallets = async () => {
    try {
      setIsConnecting(true);
      
      // Enable web3 and get available extensions
      const extensions = await web3Enable("Influanto");
      
      if (extensions.length === 0) {
        // Show wallet installation dialog instead of alert
        setShowInstallDialog(true);
        setIsConnecting(false);
        return;
      }

      // Get wallet names
      const walletNames = extensions.map(ext => ext.name);
      setAvailableWallets(walletNames);

      // Get all accounts from all wallets
      const accounts = await web3Accounts();
      setAvailableAccounts(accounts);

      if (accounts.length === 0) {
        alert("No accounts found in your wallet(s). Please create an account first.");
        setIsConnecting(false);
        return;
      }

      setShowWalletDialog(true);
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to detect wallets:", err);
      setShowInstallDialog(true);
      setIsConnecting(false);
    }
  };

  const connectToAccount = async (account: InjectedAccountWithMeta) => {
    try {
      const address = account.address;

      // Check for mismatch with stored wallet
      if (userProfile?.walletAddress && userProfile.walletAddress !== address) {
        setNewWalletAddress(address);
        setWalletMismatch(true);
        setShowWalletDialog(false);
        return;
      }

      setWallet(address);
      localStorage.setItem("connectedWallet", address);
      fetchNFTs();
      setShowWalletDialog(false);

      // Save wallet if not set
      if (userProfile && !userProfile.walletAddress) {
        try {
          const { data } = await apiClient.post("/save-wallet", {
            walletAddress: address,
          });
          setUserProfile({ ...userProfile, walletAddress: address });
          console.log("Wallet address saved:", data);
        } catch (err) {
          console.error("Failed to save wallet address:", err);
        }
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const handleSaveNewWallet = async () => {
    if (!newWalletAddress) return;
    try {
      const { data } = await apiClient.post("/save-wallet", {
        walletAddress: newWalletAddress,
      });
      setUserProfile({ ...userProfile!, walletAddress: newWalletAddress });
      setWallet(newWalletAddress);
      localStorage.setItem("connectedWallet", newWalletAddress);
      setWalletMismatch(false);
      setNewWalletAddress(null);
      console.log("New wallet saved:", data);
    } catch (err) {
      console.error("Failed to save new wallet:", err);
    }
  };

  const handleSwitchWallet = () => {
    setWallet(null);
    localStorage.removeItem("connectedWallet");
    window.location.reload();
  };

  const handleUnlinkWallet = async () => {
    try {
      await apiClient.post("/save-wallet", {
        walletAddress: wallet,
        action: "unlink"
      });
      
      setWallet(null);
      setUserProfile({ ...userProfile!, walletAddress: undefined });
      localStorage.removeItem("connectedWallet");
      setCollectibles([]);
      setShowUnlinkDialog(false);
      
      console.log("Wallet unlinked successfully");
    } catch (err) {
      console.error("Failed to unlink wallet:", err);
    }
  };

  // Get user's collectibles (from frontend)
 // ...existing code...
  const fetchNFTs = async () => {
    try {
      const response = await apiClient.get('/collectibles/get', {
        params: {
          limit: 10,
          page: 1,
        }
      });
      
      console.log('Full response:', response.data);
      
      // Handle different response structures
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
      setCollectibles([]); // Set empty array on error instead of leaving undefined
    }
  };

  // ...rest of your existing code stays the same...

  // Public search (from frontend)
  const searchCollectibles = async (searchParams:any) => {
    try {
      const response = await apiClient.post('/collectibles/get', {
        search: 'rock music',
        genres: ['Rock', 'Alternative'],
        type: 'album',
        priceMin: 10,
        priceMax: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 20,
        page: 1
      });
      return response.data;
    } catch (error) {
      console.error('Error searching collectibles:', error);
    }
  };

  const handleCreateNFT = () => {
    if (!wallet) {
      // Show a message or trigger wallet connection
      alert("Please connect your wallet first to create collectibles.");
      return;
    }
    setModalOpen(true);
  };

  const getWalletIcon = (walletName: string) => {
    switch (walletName.toLowerCase()) {
      case 'polkadot-js':
        return '🟠';
      case 'talisman':
        return '🔮';
      case 'subwallet':
        return '🌐';
      case 'fearless wallet':
        return '💎';
      default:
        return '👛';
    }
  };

  const openWalletLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6">
      {/* Wallet Installation Dialog */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Install a Polkadot Wallet</h2>
              <button
                onClick={() => setShowInstallDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                To connect and manage your collectibles, you&apos;ll need to install a Polkadot-compatible wallet. 
                Choose one of the recommended wallets below:
              </p>
            </div>

            {/* Wallet Options */}
            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <div
                  key={wallet.name}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{wallet.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{wallet.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {wallet.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openWalletLink(wallet.url)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      Install
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">ℹ️</span>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">After installation:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Refresh this page</li>
                    <li>Create or import your wallet account</li>
                    <li>Click &quot;Connect Wallet&quot; again</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowInstallDialog(false);
                  // Retry detection after user potentially installs a wallet
                  setTimeout(() => detectWallets(), 1000);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                I&apos;ve Installed a Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Selection Dialog */}
      {showWalletDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Select Wallet & Account</h2>
              <button
                onClick={() => setShowWalletDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Available Wallets */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Detected Wallets:</h3>
              <div className="flex flex-wrap gap-2">
                {availableWallets.map((wallet) => (
                  <div
                    key={wallet}
                    className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                  >
                    <span className="mr-1">{getWalletIcon(wallet)}</span>
                    {wallet}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Accounts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select Account:</h3>
              <div className="space-y-2">
                {availableAccounts.map((account, index) => (
                  <div
                    key={account.address}
                    onClick={() => connectToAccount(account)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getWalletIcon(account.meta.source || '')}</span>
                          <div>
                            <p className="font-medium text-sm">
                              {account.meta.name || `Account ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {account.address.slice(0, 8)}...{account.address.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {account.meta.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Select an account to connect to Influanto
            </div>
          </div>
        </div>
      )}

      {/* Wallet Mismatch Dialog */}
      {walletMismatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 text-center shadow-xl">
            <div className="mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl mb-2" />
              <h2 className="text-lg font-bold">Wallet Mismatch</h2>
            </div>
            <p className="mb-6 text-gray-600">
              The connected wallet is different from the one stored in your profile.
            </p>
            <div className="flex justify-around gap-3">
              <button
                onClick={handleSwitchWallet}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Switch Wallet (Logout)
              </button>
              <button
                onClick={handleSaveNewWallet}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save New Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Wallet Confirmation Dialog */}
      {showUnlinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 text-center shadow-xl">
            <div className="mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-2" />
              <h2 className="text-lg font-bold text-gray-800">Unlink Wallet</h2>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to unlink your wallet? This will remove access to your collectibles and you&apos;ll need to reconnect to view them again.
            </p>
            <div className="flex justify-around gap-3">
              <button
                onClick={() => setShowUnlinkDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlinkWallet}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Unlink Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Collectibles</h1>
        {wallet ? (
          <div className="flex items-center gap-3">
            {/* Wallet Display */}
            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg font-mono">
              <FontAwesomeIcon icon={faWallet} className="text-gray-600 mr-2" />
              <span>{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
            </div>
            
            {/* Unlink Wallet Button */}
            <button
              onClick={() => setShowUnlinkDialog(true)}
              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
              title="Unlink wallet"
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
          </div>
        ) : (
          <button
            onClick={detectWallets}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faWallet} />
            {isConnecting ? "Detecting..." : "Connect Wallet"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {collectibles.length > 0 &&
          collectibles.map((collectible) => (
            <div
              key={collectible._id}
              className="border rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
            >
              <img
                src={collectible.imageUrl || "/placeholder.png"}
                alt={collectible.title}
                className="w-full h-48 object-cover"
              />
              <h3 className="p-2 text-center font-semibold">{collectible.title}</h3>
            </div>
          ))}

        {/* Create Collectible Button - Disabled when no wallet */}
        <div
          onClick={handleCreateNFT}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-48 transition
            ${collectibles.length === 0 ? "col-span-3 justify-center" : ""}
            ${wallet 
              ? "cursor-pointer hover:bg-gray-100 border-gray-300" 
              : "cursor-not-allowed border-gray-200 bg-gray-50"
            }`}
        >
          <FontAwesomeIcon 
            icon={wallet ? faPlus : faLock} 
            className={`text-5xl ${wallet ? "text-gray-400" : "text-gray-300"}`} 
          />
          <p className={`mt-2 font-semibold ${wallet ? "text-gray-500" : "text-gray-400"}`}>
            {wallet ? "Create New Collectible" : "Connect Wallet to Create"}
          </p>
          {!wallet && (
            <p className="text-xs text-gray-400 mt-1 text-center px-4">
              You need to connect your wallet first
            </p>
          )}
        </div>
      </div>

      <NFTCreationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(newNFT) =>
          setCollectibles([
            ...collectibles,
            {
              id: Date.now().toString(),
              ...newNFT,
              audioUrl: newNFT.audio ?? "",
              editionSize: typeof newNFT.editionSize === "number" ? newNFT.editionSize : 1,
              genres: Array.isArray(newNFT.genre)
                ? newNFT.genre
                : newNFT.genre
                ? [newNFT.genre]
                : [],
              status: "created",
            },
          ])
        }
      />
    </div>
  );
};

export default Collectibles;
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faWallet, faExclamationTriangle, faTimes, faExternalLinkAlt, faLock } from "@fortawesome/free-solid-svg-icons";
import { web3Accounts, web3Enable, web3FromSource } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ethers } from 'ethers';
import dynamic from 'next/dynamic';
// Dynamically import NFTCreationModal to prevent SSR issues
const NFTCreationModal = dynamic(() => import("../../components/NFTCreationModal"), {
  ssr: false,
  loading: () => <div>Loading modal...</div>
});

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
  id?: string;
}

type WalletType = 'polkadot' | 'evm';

interface ConnectedWallet {
  address: string;
  type: WalletType;
  name?: string;
  source?: string;
}

const Collectibles = () => {
  // Add mounted state to prevent SSR issues
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
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
  const [evmAccount, setEvmAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType | null>(null);


   useEffect(() => {
    setMounted(true);
  }, []);


  // useEffect(() => {
  //   if (mounted && typeof window !== 'undefined' && window.ethereum) {
  //     checkMetaMaskConnection();
  //   }
  // }, [mounted]);


  useEffect(() => {
    if (!mounted) return;

    const fetchUserProfile = async () => {
      try {
        const { data } = await apiClient.get("/get-user");
        setUserProfile(data);

        if (data.walletAddress) {
          const walletType = data.walletAddress.startsWith('0x') ? 'evm' : 'polkadot';
          setWallet({
            address: data.walletAddress,
            type: walletType,
            name: walletType === 'evm' ? 'MetaMask' : 'Polkadot Wallet'
          });
          fetchNFTs();
          
          // Safe localStorage access
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem("connectedWallet", JSON.stringify({
              address: data.walletAddress,
              type: walletType
            }));
          }
        } else {
          // Safe localStorage access
          if (typeof window !== 'undefined' && window.localStorage) {
            const savedWallet = localStorage.getItem("connectedWallet");
            if (savedWallet) {
              try {
                const walletData = JSON.parse(savedWallet);
                setWallet(walletData);
                fetchNFTs();
              } catch {
                setWallet({
                  address: savedWallet,
                  type: savedWallet.startsWith('0x') ? 'evm' : 'polkadot'
                });
                fetchNFTs();
              }
            }
          }
        }
        
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    
    fetchUserProfile();
  }, [mounted]);

  // ADD A SEPARATE useEffect FOR METAMASK CHECK - ONLY AFTER MOUNT
  useEffect(() => {
    if (!mounted) return;
    
    // Delay the MetaMask check to ensure it runs only on client
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.ethereum) {
        checkMetaMaskConnection();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collectibles...</p>
        </div>
      </div>
    </div>
  );
}

  // Wallet installation options
  const polkadotWalletOptions = [
    {
      name: "Polkadot{.js}",
      icon: "🟠",
      description: "Official Polkadot extension wallet",
      url: "https://polkadot.js.org/extension/",
      platforms: ["Browser Extension"]
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

  const evmWalletOptions = [
    {
      name: "MetaMask",
      icon: "🦊",
      description: "Popular Ethereum wallet and gateway to blockchain apps",
      url: "https://metamask.io/",
      platforms: ["Browser Extension", "Mobile"]
    },
    {
      name: "WalletConnect",
      icon: "🔗",
      description: "Connect to mobile wallets via QR code",
      url: "https://walletconnect.com/",
      platforms: ["Mobile Bridge"]
    },
    {
      name: "Coinbase Wallet",
      icon: "🔵",
      description: "Self-custody wallet from Coinbase",
      url: "https://wallet.coinbase.com/",
      platforms: ["Browser Extension", "Mobile"]
    }
  ];

  const checkMetaMaskConnection = async () => {
    // Add safety checks for both mounted and window
    if (!mounted || typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        setEvmAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
    }
  };

  const detectWallets = async () => {
    setIsConnecting(true);
    setSelectedWalletType(null);
    setShowWalletDialog(true);
    setIsConnecting(false);
  };

  const connectPolkadotWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Enable web3 and get available extensions
      const extensions = await web3Enable("Influanto");
      
      if (extensions.length === 0) {
        setShowInstallDialog(true);
        setSelectedWalletType('polkadot');
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
        alert("No accounts found in your Polkadot wallet(s). Please create an account first.");
        setIsConnecting(false);
        return;
      }

      setSelectedWalletType('polkadot');
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to detect Polkadot wallets:", err);
      setShowInstallDialog(true);
      setSelectedWalletType('polkadot');
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    try {
      setIsConnecting(true);

      // Check if we're on client side and have ethereum
      if (typeof window === 'undefined' || !window.ethereum) {
        setShowInstallDialog(true);
        setSelectedWalletType('evm');
        setIsConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        alert("No accounts found in MetaMask. Please create an account first.");
        setIsConnecting(false);
        return;
      }

      const account = accounts[0];
      await connectToEvmAccount(account);
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to connect to MetaMask:", err);
      alert("Failed to connect to MetaMask. Please try again.");
      setIsConnecting(false);
    }
  };

const connectToPolkadotAccount = async (account: InjectedAccountWithMeta) => {
    try {
      const address = account.address;

      // Check for mismatch with stored wallet
      if (userProfile?.walletAddress && userProfile.walletAddress !== address) {
        setNewWalletAddress(address);
        setWalletMismatch(true);
        setShowWalletDialog(false);
        return;
      }

      const walletData: ConnectedWallet = {
        address,
        type: 'polkadot',
        name: account.meta.name || 'Polkadot Account',
        source: account.meta.source
      };

      setWallet(walletData);
      
      // Only access localStorage after checking we're on client
      if (typeof window !== 'undefined') {
        localStorage.setItem("connectedWallet", JSON.stringify(walletData));
      }
      
      fetchNFTs();
      setShowWalletDialog(false);

      // Save wallet if not set
      if (userProfile && !userProfile.walletAddress) {
        await saveWalletToProfile(address);
      }
    } catch (err) {
      console.error("Polkadot wallet connection failed:", err);
    }
  };

  const connectToEvmAccount = async (address: string) => {
    try {
      // Check for mismatch with stored wallet
      if (userProfile?.walletAddress && userProfile.walletAddress !== address) {
        setNewWalletAddress(address);
        setWalletMismatch(true);
        setShowWalletDialog(false);
        return;
      }

      const walletData: ConnectedWallet = {
        address,
        type: 'evm',
        name: 'MetaMask',
        source: 'metamask'
      };

      setWallet(walletData);
      
      // Only access localStorage after checking we're on client
      if (typeof window !== 'undefined') {
        localStorage.setItem("connectedWallet", JSON.stringify(walletData));
      }
      
      fetchNFTs();
      setShowWalletDialog(false);

      // Save wallet if not set
      if (userProfile && !userProfile.walletAddress) {
        await saveWalletToProfile(address);
      }
    } catch (err) {
      console.error("EVM wallet connection failed:", err);
    }
  };

  const handleSaveNewWallet = async () => {
    if (!newWalletAddress) return;
    try {
      const { data } = await apiClient.post("/save-wallet", {
        walletAddress: newWalletAddress,
      });
      setUserProfile({ ...userProfile!, walletAddress: newWalletAddress });
      
      const walletType = newWalletAddress.startsWith('0x') ? 'evm' : 'polkadot';
      const walletData: ConnectedWallet = {
        address: newWalletAddress,
        type: walletType,
        name: walletType === 'evm' ? 'MetaMask' : 'Polkadot Wallet'
      };
      
      setWallet(walletData);
      
      // Only access localStorage after checking we're on client
      if (typeof window !== 'undefined') {
        localStorage.setItem("connectedWallet", JSON.stringify(walletData));
      }
      
      setWalletMismatch(false);
      setNewWalletAddress(null);
      console.log("New wallet saved:", data);
    } catch (err) {
      console.error("Failed to save new wallet:", err);
    }
  };

  const handleSwitchWallet = () => {
    setWallet(null);
    
    // Only access localStorage and window after checking we're on client
    if (typeof window !== 'undefined') {
      localStorage.removeItem("connectedWallet");
      window.location.reload();
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      await apiClient.post("/save-wallet", {
        walletAddress: wallet?.address,
        action: "unlink"
      });
      
      setWallet(null);
      setUserProfile({ ...userProfile!, walletAddress: undefined });
      
      // Only access localStorage after checking we're on client
      if (typeof window !== 'undefined') {
        localStorage.removeItem("connectedWallet");
      }
      
      setCollectibles([]);
      setShowUnlinkDialog(false);
      
      console.log("Wallet unlinked successfully");
    } catch (err) {
      console.error("Failed to unlink wallet:", err);
    }
  };

  const openWalletLink = (url: string) => {
    // Only access window after checking we're on client
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const fetchNFTs = async () => {
    try {
      const response = await apiClient.get('/musiccollectibles/get', {
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

  const handleCreateNFT = () => {
    if (!wallet) {
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
      case 'metamask':
        return '🦊';
      default:
        return '👛';
    }
  };


  const saveWalletToProfile = async (address: string) => {
    try {
      const { data } = await apiClient.post("/save-wallet", {
        walletAddress: address,
      });
      setUserProfile({ ...userProfile!, walletAddress: address });
      console.log("Wallet address saved:", data);
    } catch (err) {
      console.error("Failed to save wallet address:", err);
    }
  };

  return (
    <div className="p-6">
      {/* Wallet Installation Dialog */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Install {selectedWalletType === 'evm' ? 'EVM' : 'Polkadot'} Wallet
              </h2>
              <button
                onClick={() => setShowInstallDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                To connect and manage your collectibles, you&apos;ll need to install a compatible wallet. 
                Choose one of the recommended wallets below:
              </p>
            </div>

            {/* Wallet Options */}
            <div className="space-y-3">
              {(selectedWalletType === 'evm' ? evmWalletOptions : polkadotWalletOptions).map((wallet) => (
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
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Connect Wallet</h2>
              <button
                onClick={() => setShowWalletDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {!selectedWalletType && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                  Choose your preferred wallet type to connect:
                </p>

                {/* EVM Wallets */}
                <div 
                  onClick={connectMetaMask}
                  className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🦊</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">EVM Wallets (MetaMask)</h3>
                      <p className="text-sm text-gray-600">Connect with MetaMask, Coinbase Wallet, etc.</p>
                      <div className="flex gap-1 mt-1">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Ethereum
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Moonbeam
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Polkadot Wallets */}
                <div 
                  onClick={connectPolkadotWallet}
                  className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🟠</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">Polkadot Wallets</h3>
                      <p className="text-sm text-gray-600">Connect with Polkadot.js, Talisman, SubWallet</p>
                      <div className="flex gap-1 mt-1">
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                          Polkadot
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Kusama
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Polkadot Account Selection */}
            {selectedWalletType === 'polkadot' && (
              <div>
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
                        onClick={() => connectToPolkadotAccount(account)}
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

                <button
                  onClick={() => setSelectedWalletType(null)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to wallet selection
                </button>
              </div>
            )}
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
            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
              <span className="mr-2">{wallet.type === 'evm' ? '🦊' : '🟠'}</span>
              <span className="font-mono text-sm">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
              <span className="ml-2 text-xs text-gray-500 capitalize">
                ({wallet.type})
              </span>
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
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {collectibles.length > 0 &&
          collectibles.map((collectible) => (
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

        {/* Create Collectible Button */}
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
          <p className={`mt-2 font-semibold text-center ${wallet ? "text-gray-500" : "text-gray-400"}`}>
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
              ...newNFT,
              id: Date.now().toString(),
              audioUrl: newNFT.audio ?? "",
              editionSize: typeof newNFT.editionSize === "number" ? newNFT.editionSize : 1,
              genres: Array.isArray(newNFT.genre)
                ? newNFT.genre
                : newNFT.genre
                ? [newNFT.genre]
                : [],
              status: "created",
            } as Collectible,
          ])
        }
      />
    </div>
  );
};

export default Collectibles;
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import NFTCreationModal from "../../components/NFTCreationModal";
import apiClient from "@/libs/api";

interface NFT {
  id?: string;
  title: string;
  description?: string;
  image?: string;
  audio: string;
  artist: string;
  genre: string;
  bpm?: number;
  lyrics?: string;
  editionSize: number;
  price?: number;
}

interface UserProfile {
  name: string;
  email: string;
  walletAddress?: string;
}

const CollectiblesScreen: React.FC = () => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [walletMismatch, setWalletMismatch] = useState<boolean>(false);
  const [newWalletAddress, setNewWalletAddress] = useState<string | null>(null);

  // Fetch user profile on page load
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await apiClient.get("/get-user");
        setUserProfile(data);

        if (data.walletAddress) {
          setWallet(data.walletAddress);
          fetchNFTs(data.walletAddress);
          localStorage.setItem("connectedWallet", data.walletAddress);
        } else {
          const savedWallet = localStorage.getItem("connectedWallet");
          if (savedWallet) {
            setWallet(savedWallet);
            fetchNFTs(savedWallet);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  const connectWallet = async () => {
    try {
      await web3Enable("Influanto");
      const accounts = await web3Accounts();
      if (accounts.length > 0) {
        const address = accounts[0].address;

        // Check for mismatch with stored wallet
        if (userProfile?.walletAddress && userProfile.walletAddress !== address) {
          setNewWalletAddress(address);
          setWalletMismatch(true);
          return;
        }

        setWallet(address);
        localStorage.setItem("connectedWallet", address);
        fetchNFTs(address);

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
    // log out user
    setWallet(null);
    localStorage.removeItem("connectedWallet");
    window.location.reload();
  };

  const fetchNFTs = async (address: string) => {
    console.log("Fetch NFTs for wallet:", address);
    setNFTs([]);
  };

  const handleCreateNFT = () => {
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      {walletMismatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 text-center">
            <h2 className="text-lg font-bold mb-4">Wallet Mismatch</h2>
            <p className="mb-6">
              The connected wallet is different from the one stored in your profile.
            </p>
            <div className="flex justify-around">
              <button
                onClick={handleSwitchWallet}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Switch Wallet (Logout)
              </button>
              <button
                onClick={handleSaveNewWallet}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save New Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Collectibles</h1>
        {wallet ? (
          <div className="px-4 py-2 bg-gray-100 rounded-lg font-mono">
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.length > 0 &&
          nfts.map((nft) => (
            <div
              key={nft.id}
              className="border rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
            >
              <img
                src={nft.image || "/placeholder.png"}
                alt={nft.title}
                className="w-full h-48 object-cover"
              />
              <h3 className="p-2 text-center font-semibold">{nft.title}</h3>
            </div>
          ))}

        <div
          onClick={handleCreateNFT}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-48 cursor-pointer hover:bg-gray-100 transition
            ${nfts.length === 0 ? "col-span-3 justify-center" : ""}`}
        >
          <FontAwesomeIcon icon={faPlus} className="text-gray-400 text-5xl" />
          <p className="mt-2 text-gray-500 font-semibold">Create New Collectible</p>
        </div>
      </div>

      <NFTCreationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(newNFT) => setNFTs([...nfts, { id: Date.now().toString(), ...newNFT }])}
      />
    </div>
  );
};

export default CollectiblesScreen;

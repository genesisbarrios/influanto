'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faShoppingCart,
  faExternalLinkAlt,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useContract } from '@/hooks/useContract';

import apiClient from '@/libs/api';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { useSession } from 'next-auth/react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import dynamic from 'next/dynamic';

const WalletManagerModal = dynamic(
  () => import('@/components/WalletManagerModal'),
  { ssr: false }
);

interface Collectible {
  _id: string;
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
  userId?: string;
  contractAddress?: string;
  tokenId?: number;
  mintedEditions?: number;
}

interface UserProfile {
  name: string;
  username: string;
  email: string;
  Id?: string;
}

const CollectibleMintPage: React.FC = () => {
  const params = useParams();
  const userId = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;
  const title = Array.isArray(params?.title) ? params.title[0] : params?.title;
  const decodedTitle = title ? decodeURIComponent(title) : '';

  const { status: authStatus } = useSession();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [polBalance, setPolBalance] = useState<string | null>(null);

  const [collectible, setCollectible] = useState<Collectible | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userOwned, setUserOwned] = useState<number | null>(null);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Minting state
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  
  // Contract integration
 const {
  contract,
  isConnected,
  wallet,
  contractStatus,
  buyTrack,
  connectWallet,
  switchToPolygon,
  setKnownAddresses,
} = useContract();

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    apiClient.get('/wallet/info').then((result: any) => {
      const addrs: string[] = result.walletAddresses ?? [];
      setWalletAddresses(addrs);
      setEnsName(result.ensName ?? null);
      // Tell useContract which addresses belong to this user so it ignores
      // stale Privy wallets from other accounts.
      setKnownAddresses(addrs);
    }).catch(() => {});
  }, [authStatus]);

  // Fetch how many editions the logged-in user owns via ERC1155 balanceOf
  useEffect(() => {
    const address = walletAddresses[0];
    const tokenId = collectible?.tokenId;
    const contract = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS;
    if (!address || !tokenId || !contract) return;

    const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0');
    const paddedId = tokenId.toString(16).padStart(64, '0');
    const data = '0x00fdd58e' + paddedAddress + paddedId; // balanceOf(address,uint256)

    fetch('https://rpc-amoy.polygon.technology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', params: [{ to: contract, data }, 'latest'], id: 1 }),
    })
      .then(r => r.json())
      .then(res => {
        const hex = res.result;
        if (hex && hex !== '0x') setUserOwned(parseInt(hex, 16));
      })
      .catch(() => {});
  }, [walletAddresses, collectible?.tokenId]);

  useEffect(() => {
    const primary = walletAddresses[0];
    if (!primary) { setPolBalance(null); return; }
    fetch('https://rpc-amoy.polygon.technology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [primary, 'latest'], id: 1 }),
    })
      .then((r) => r.json())
      .then((data) => setPolBalance((Number(BigInt(data.result)) / 1e18).toFixed(4)))
      .catch(() => setPolBalance(null));
  }, [walletAddresses]);

// Audio player handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !collectible?.audioUrl) {
      console.log('⚠️ No audio element or audio URL:', { 
        hasAudio: !!audio, 
        hasAudioUrl: !!collectible?.audioUrl 
      });
      return;
    }

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('🎵 Audio error:', e);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [collectible]);
  
  useEffect(() => {
  const handleError = (event: ErrorEvent) => {
    if (
      event.message.includes('Extension ID') ||
      event.message.includes('runtime.sendMessage') ||
      event.filename?.includes('inpage.js')
    ) {
      console.log('Ignoring extension error:', event.message);
      event.preventDefault();
      return false;
    }
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (
      event.reason?.message?.includes('Extension ID') ||
      event.reason?.message?.includes('runtime.sendMessage')
    ) {
      console.log('Ignoring extension promise rejection:', event.reason.message);
      event.preventDefault();
      return false;
    }
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}, []);

  // Fetch collectible — tries chain first (wallet-address URL), falls back to Supabase (userId URL)
  useEffect(() => {
    const fetchCollectible = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Try on-chain lookup (creator = wallet address in URL)
        const chainResult: any = await apiClient.get('/collectibles/chain');
        const all: any[] = chainResult.collectibles ?? [];
        const found = all.find((c: any) =>
          c.creator?.toLowerCase() === (userId as string)?.toLowerCase() &&
          c.title?.toLowerCase() === decodedTitle?.toLowerCase()
        );

        if (found) {
          const genreList: string[] =
            typeof found.genres === 'string'
              ? found.genres.split(',').map((g: string) => g.trim()).filter(Boolean)
              : Array.isArray(found.genres) ? found.genres : [];

          setCollectible({
            _id: String(found.tokenId),
            title: found.title,
            description: found.description ?? '',
            imageUrl: found.imageUrl,
            audioUrl: found.audioUrl,
            artist: found.artist ?? '',
            genres: genreList,
            editionSize: found.maxEditions,
            priceUsd: parseFloat(found.priceMatic ?? '0'),
            type: 'single',
            status: 'minted',
            mintedEditions: found.minted,
            tokenId: found.tokenId,
            contractAddress: process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS,
          });
          return;
        }

        // 2. Fall back to Supabase lookup (userId = DB user ID in URL)
        const dbLookup = await fetch(
          `/api/collectibles/by-title?userId=${encodeURIComponent(userId as string)}&title=${encodeURIComponent(decodedTitle)}`
        ).then(r => r.json()).catch(() => null);

        const dbRow = dbLookup?.collectible;
        if (dbRow) {
          const genreList: string[] =
            Array.isArray(dbRow.genres) ? dbRow.genres : [];

          setCollectible({
            _id: dbRow.id,
            title: dbRow.title,
            description: dbRow.description ?? '',
            imageUrl: dbRow.imageUrl ?? '',
            audioUrl: dbRow.audioUrl ?? '',
            artist: dbRow.artist ?? '',
            genres: genreList,
            editionSize: dbRow.editionSize ?? 1,
            priceUsd: dbRow.priceUsd ?? 0,
            type: 'single',
            status: dbRow.status ?? 'uploaded',
            tokenId: dbRow.tokenId ?? undefined,
          });
          return;
        }

        setError('Collectible not found');
      } catch (err: any) {
        console.error('Error fetching collectible:', err);
        setError('Failed to load collectible');
      } finally {
        setLoading(false);
      }
    };

    if (userId && decodedTitle) {
      fetchCollectible();
    } else {
      setLoading(false);
      setError('Invalid collectible URL');
    }
  }, [userId, decodedTitle]);

  // Audio player handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [collectible]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Minting handlers
  const handleMint = async () => {
    if (!collectible) return;
    
    try {
      setIsMinting(true);
      setMintError(null);
      
      if (!isConnected) {
        await connectWallet();
        return;
      }

      if (!collectible.tokenId) throw new Error('Token ID not found. Cannot buy this collectible.');

      // buyTrack fetches the on-chain price itself and calls contract.buy(tokenId, { value })
      const result = await buyTrack(collectible.tokenId, walletAddresses[0]);
      
      setMintSuccess(true);
      
      // Update collectible with new minted count
      setCollectible(prev => prev ? {
        ...prev,
        mintedEditions: (prev.mintedEditions || 0) + mintQuantity
      } : null);
      
    } catch (err: any) {
      console.error('Mint failed:', err);
      setMintError(err.message || 'Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!collectible?.priceUsd) return 0;
    return collectible.priceUsd * mintQuantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading collectible...</p>
        </div>
      </div>
    );
  }

  if (error || !collectible) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Collectible Not Found</h1>
          <p className="text-gray-600">{error || 'The requested collectible could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
<div>
    <Header />
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Wallet pill — top right */}
        {authStatus === 'authenticated' && walletAddresses.length > 0 && (() => {
          const primary = walletAddresses[0];
          const live = authenticated && wallets.some((w) => w.address?.toLowerCase() === primary.toLowerCase());
          return (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowWalletManager(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                  live ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                }`}
              >
                <span className={`text-xs ${live ? 'text-green-500' : 'text-amber-400'}`}>●</span>
                {ensName ?? `${primary.slice(0, 6)}…${primary.slice(-4)}`}
                {polBalance !== null && (
                  <span className="text-[11px] font-normal opacity-70">{polBalance} POL</span>
                )}
                {!live && ready && <span className="text-[10px] font-normal opacity-75">· Reconnect</span>}
              </button>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Image & Audio Player */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={collectible.imageUrl || '/placeholder.png'}
                alt={collectible.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Audio Player */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <audio
                ref={audioRef}
                src={collectible.audioUrl}
                preload="metadata"
              />
              
              <div className="space-y-4">
                {/* Play Controls */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon 
                      icon={isPlaying ? faPause : faPlay} 
                      className="text-xl"
                    />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMute}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Details & Mint */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{collectible.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {collectible.artist}</p>
              
              {collectible.description && (
                <p className="text-gray-700 mb-4">{collectible.description}</p>
              )}

              {/* Genres */}
              {collectible.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {collectible.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {collectible.bpm && (
                  <div>
                    <span className="text-gray-500">BPM:</span>
                    <span className="ml-2 font-medium">{collectible.bpm}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium capitalize">{collectible.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Edition Size:</span>
                  <span className="ml-2 font-medium">{collectible.editionSize}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sold:</span>
                  <span className="ml-2 font-medium">{collectible.mintedEditions || 0} / {collectible.editionSize}</span>
                </div>
                {userOwned !== null && (
                  <div>
                    <span className="text-gray-500">Own:</span>
                    <span className="ml-2 font-medium">{userOwned}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mint Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mint Collectible</h2>

              {/* Wallet Status */}
              {isConnected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                    <span className="text-green-800 font-medium">Wallet Connected</span>
                  </div>
               <p className="text-sm text-green-700 mt-1 font-mono">
                {wallet ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : ''}
              </p>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-center">
                  <p className="text-purple-800 font-medium mb-3">Sign up to mint</p>
                  <a
                    href="/signin"
                    className="inline-block px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Sign Up
                  </a>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    disabled={mintQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={collectible.editionSize - (collectible.mintedEditions || 0)}
                    value={mintQuantity}
                    onChange={(e) => setMintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 text-center border rounded-lg"
                  />
                  <button
                    onClick={() => setMintQuantity(Math.min(
                      collectible.editionSize - (collectible.mintedEditions || 0),
                      mintQuantity + 1
                    ))}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    disabled={mintQuantity >= (collectible.editionSize - (collectible.mintedEditions || 0))}
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Available: {collectible.editionSize - (collectible.mintedEditions || 0)} of {collectible.editionSize}
                </p>
              </div>

              {/* Price Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per NFT:</span>
                  <span className="font-bold">{collectible.priceUsd || 0.01} POL</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">{calculateTotalPrice().toFixed(4)} POL</span>
                </div>
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={!isConnected || isMinting || (collectible.mintedEditions || 0) >= collectible.editionSize}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isMinting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faShoppingCart} />
                    Mint {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''}
                  </>
                )}
              </button>

              {/* Success/Error Messages */}
              {mintSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                    <span className="text-green-800 font-medium">Successfully Minted!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your {mintQuantity} NFT{mintQuantity > 1 ? 's have' : ' has'} been minted successfully.
                  </p>
                </div>
              )}

              {mintError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
                    <span className="text-red-800 font-medium">Mint Failed</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{mintError}</p>
                </div>
              )}

              {/* Artist Profile Link */}
              {userProfile && (
                <div className="mt-6 pt-6 border-t">
                  <a
                    href={`/${userProfile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>View Artist Profile</span>
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
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
    </div>
    </div>
  );
};

export default CollectibleMintPage;
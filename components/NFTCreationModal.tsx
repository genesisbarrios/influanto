import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { useSession } from "next-auth/react";
import apiClient from "@/libs/api";
import { useContract } from '../hooks/useContract';
import { ethers } from 'ethers';

const WalletManagerModal = dynamic(() => import('./WalletManagerModal'), { ssr: false });

interface Track {
  id: string;
  title: string;
  audioFile: File | null;
  imageFile?: File | null;
  artist?: string;
  bpm?: number;
  lyrics?: string;
  duration?: number;
  trackNumber: number;
}

interface MusicNFT {
  id?: number;
  tokenId?: number;
  title: string;
  description?: string;
  image?: string;
  audio?: string;
  artist: string;
  genre: string;
  bpm?: number;
  lyrics?: string;
  editionSize?: number;
  price?: number;
  priceInWei?: string;
  metadataCID?: string;
  metadataHash?: string;
  userId?: string;
  type: 'single' | 'album';
  trackCount?: number;
  tracks?: Track[];
  albumCID?: string;
  releaseDate?: string;
  contractAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  mintingStatus?: 'pending' | 'success' | 'failed';
  creator?: string;
  totalSupply?: number;
  soldCount?: number;
}

interface NFTCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (_nft: MusicNFT) => void;
  walletAddresses: string[];
  ensName: string | null;
  onWalletUpdate: (_addresses: string[], _ensName: string | null) => void;
}

const presetGenres = [
  "Hip Hop", "R&B", "Latin", "Reggaeton", "Afrobeats", "Pop", "Electronic",  
  "Trap", "Rock", "House", "Techno", "Indie", "Dancehall", 
  "Post Punk", "Jazz", "Instrumental", "Spiritual", "Beats",
];

const MusicNFTCreationModal: React.FC<NFTCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  walletAddresses,
  ensName,
  onWalletUpdate,
}) => {
  const { data: session } = useSession();
  const [showWalletManager, setShowWalletManager] = useState(false);

  const {
    contract,
    account,
    isConnected,
    isLoading,
    networkId,
    mintTrack,
    setKnownAddresses,
  } = useContract();

  // Keep useContract filtered to only the current user's wallets so stale
  // Privy wallets from other accounts never appear or sign transactions.
  useEffect(() => {
    if (walletAddresses.length > 0) setKnownAddresses(walletAddresses);
  }, [walletAddresses, setKnownAddresses]);
  
  // Form State
  const [type, setType] = useState<'single' | 'album'>('single');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [editionSize, setEditionSize] = useState<number | undefined>();
  const [priceUsd, setPriceUsd] = useState<number | undefined>();
  const [maticUsdPrice, setMaticUsdPrice] = useState<number>(1.0); // Polygon MATIC price fallback
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [releaseDate, setReleaseDate] = useState("");
  
  // Single track fields
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bpm, setBpm] = useState<number | undefined>();
  const [lyrics, setLyrics] = useState("");
  
  
  // Album fields
  const [_albumCoverImage, setAlbumCoverImage] = useState<File | null>(null);
  const [_tracks, setTracks] = useState<Track[]>([]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setType('single');
    setTitle("");
    setDescription("");
    setArtist("");
    setGenres([]);
    setGenreInput("");
    setEditionSize(undefined);
    setPriceUsd(undefined);
    setAudioFile(null);
    setImageFile(null);
    setBpm(undefined);
    setLyrics("");
    setAlbumCoverImage(null);
    setTracks([]);
    setReleaseDate("");
    setUploadProgress("");
  };


  // Store NFT metadata in localStorage
  const storeNFTMetadata = (tokenId: number, metadata: MusicNFT) => {
    try {
      localStorage.setItem(`nft_metadata_${tokenId}`, JSON.stringify(metadata));
      
      // Also store in user's NFT list
      if (account) {
        const userNFTsKey = `user_nfts_${account}`;
        const existingNFTs = localStorage.getItem(userNFTsKey);
        const nfts = existingNFTs ? JSON.parse(existingNFTs) : [];
        
        // Remove existing entry for this token if it exists
        const filteredNFTs = nfts.filter((nft: MusicNFT) => nft.tokenId !== tokenId);
        filteredNFTs.push(metadata);
        
        localStorage.setItem(userNFTsKey, JSON.stringify(filteredNFTs));
      }
    } catch (error) {
      console.error('Error storing NFT metadata:', error);
    }
  };

  const handlePriceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPriceUsd(value);

    // Fetch MATIC price for Polygon
    try {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd"
      );
      const data = await resp.json();
      const price = data?.["matic-network"]?.usd;
      if (typeof price === "number") {
        setMaticUsdPrice(price);
      }
    } catch (err) {
      console.error("Failed to fetch MATIC price:", err);
    }
  };

  const toggleGenre = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  const handleGenreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && genreInput.trim() !== "") {
      e.preventDefault();
      if (!genres.includes(genreInput.trim())) {
        setGenres([...genres, genreInput.trim()]);
        setGenreInput("");
      }
    }
  };

  const removeGenre = (genre: string) => {
    setGenres(genres.filter((g) => g !== genre));
  };

  // Upload raw bytes directly to Walrus from the browser (no server hop → no 413 limit)
  const walrusUploadRaw = async (body: ArrayBuffer | Uint8Array, epochs = 5): Promise<string> => {
    const publisher =
      process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL ??
      "https://publisher.walrus-testnet.walrus.space";
    const res = await fetch(`${publisher}/v1/blobs?epochs=${epochs}`, {
      method: "PUT",
      body: body as BodyInit,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Walrus upload failed (${res.status}): ${text || "(no body)"}`);
    }
    const json = await res.json();
    const blobId: string | undefined =
      json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;
    if (!blobId) {
      throw new Error(`Walrus returned no blobId: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return blobId;
  };

  const walrusBlobUrl = (blobId: string) => {
    const aggregator =
      process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??
      "https://aggregator.walrus-testnet.walrus.space";
    return `${aggregator}/v1/blobs/${blobId}`;
  };

  // Upload single track directly from the browser — bypasses Vercel's 4.5 MB body limit
  const uploadSingleTrack = async () => {
    try {
      setUploadProgress('Validating files...');

      if (!audioFile) throw new Error('No audio file selected');
      if (audioFile.size > 50 * 1024 * 1024) throw new Error('Audio file too large. Maximum size is 50MB.');
      if (imageFile && imageFile.size > 10 * 1024 * 1024) throw new Error('Image file too large. Maximum size is 10MB.');

      setUploadProgress('Uploading audio to Walrus...');
      const audioBlobId = await walrusUploadRaw(await audioFile.arrayBuffer());
      const audioUrl = walrusBlobUrl(audioBlobId);
      console.log('Audio blob ID:', audioBlobId);

      let imageUrl = '';
      let imageBlobId = '';
      if (imageFile) {
        setUploadProgress('Uploading image to Walrus...');
        imageBlobId = await walrusUploadRaw(await imageFile.arrayBuffer());
        imageUrl = walrusBlobUrl(imageBlobId);
        console.log('Image blob ID:', imageBlobId);
      }

      setUploadProgress('Uploading metadata to Walrus...');
      const attributes: any[] = [
        { trait_type: "Type",         value: "Single" },
        { trait_type: "Artist",       value: artist || 'Unknown' },
        { trait_type: "Genre",        value: genres.join(", ") || 'Uncategorized' },
        { trait_type: "Edition Size", value: editionSize ?? 1 },
        { trait_type: "Price (USD)",  value: priceUsd ?? 0 },
      ];
      if (bpm)         attributes.push({ trait_type: "BPM",          value: bpm });
      if (releaseDate) attributes.push({ trait_type: "Release Date", value: releaseDate });

      const collectibleMetadata = {
        name:          title,
        description:   description ?? '',
        image:         imageUrl,
        animation_url: audioUrl,
        attributes,
        lyrics:        lyrics ?? '',
        artist:        artist ?? '',
        genres:        genres.join(", "),
        bpm,
        edition_size:  editionSize ?? 1,
        price_usd:     priceUsd ?? 0,
        release_date:  releaseDate ?? new Date().toISOString().split('T')[0],
        content_type:  'single',
        created_at:    new Date().toISOString(),
        creator_id:    session?.user?.id,
        storage:       'walrus',
        audio_blob_id: audioBlobId,
        ...(imageBlobId && { image_blob_id: imageBlobId }),
      };

      const metadataBytes = new TextEncoder().encode(JSON.stringify(collectibleMetadata));
      const metadataBlobId = await walrusUploadRaw(metadataBytes);
      const metadataUrl = walrusBlobUrl(metadataBlobId);
      console.log('Metadata blob ID:', metadataBlobId);

      setUploadProgress('Walrus upload completed!');

      return {
        title,
        description,
        artist,
        genre: genres.join(", "),
        bpm,
        lyrics,
        editionSize: editionSize ?? 1,
        price: priceUsd ?? 0,
        audio: audioUrl,
        image: imageUrl,
        releaseDate,
        metadataCID: metadataUrl,
        metadataHash: metadataBlobId,
        audioBlobId,
        ...(imageBlobId && { imageBlobId }),
      };

    } catch (error: any) {
      console.error('❌ Error in uploadSingleTrack:', error);
      setUploadProgress('');
      throw new Error(error.message || 'Upload failed');
    }
  };

  // Mint NFT on blockchain using the contract with proper price conversion
  const mintNFTOnContract = async (ipfsData: any) => {
    try {
      setUploadProgress('Checking wallet connection...');
      
      // Enhanced connection checks
      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      if (!account) {
        throw new Error('No account detected. Please ensure your wallet is connected.');
      }
      
      if (!contract) {
        throw new Error('Smart contract not loaded. Please check your network connection.');
      }

      console.log('🔍 Connection status:', {
        isConnected,
        account,
        contractAddress: contract.target || contract.address,
        network: window.ethereum?.networkVersion
      });

      setUploadProgress('Validating IPFS data...');
      
      // Use the metadata URL or hash from IPFS
      const metadataHash = ipfsData.metadataCID || ipfsData.metadataHash || ipfsData.hash;
      console.log('📋 IPFS Data received:', ipfsData);
      console.log('🔗 Metadata hash:', metadataHash);
      
      if (!metadataHash) {
        console.error('❌ No metadata hash found in IPFS data:', ipfsData);
        throw new Error('No metadata hash from IPFS upload. Check IPFS data structure.');
      }

      setUploadProgress('Calculating price...');
      
      // Convert USD to MATIC for Polygon
      const priceInDev = (priceUsd != null && priceUsd > 0) ? (priceUsd / maticUsdPrice) : 0;
      // toFixed(8) prevents scientific notation and truncates excessive decimal places
      // that ethers.parseEther can't handle (e.g. "3.3333333333333335" → "3.33333333")
      const priceInWei = ethers.parseEther(priceInDev.toFixed(8));
      
      console.log('💰 Price calculation:', {
        priceUsd,
        maticUsdPrice,
        priceInDev,
        priceInWei: priceInWei.toString(),
        editionSize: editionSize || 1
      });

      setUploadProgress('Preparing blockchain transaction...');

      try {
        // Check if we can call the contract
        console.log('🔨 Calling mintTrack with parameters:', {
          metadataHash,
          price: priceInWei.toString(),
          maxEditions: editionSize || 1
        });

        setUploadProgress('Sending transaction to blockchain...');
        
        // Call the mint function - make sure parameters match your contract
        const result = await mintTrack(
          metadataHash,
          priceInWei,  // Use Wei instead of string
          editionSize || 1
        );

        console.log('✅ Mint transaction result:', result);
        setUploadProgress('NFT minted successfully!');
        
        return result;
        
      } catch (contractError: any) {
        console.error('❌ Contract call failed:', contractError);
        console.error('Contract error details:', {
          code: contractError.code,
          message: contractError.message,
          data: contractError.data,
          reason: contractError.reason,
          stack: contractError.stack
        });
        
        // Handle specific contract errors
        if (contractError.code === -32603) {
          throw new Error('Network error: Please check your internet connection and try again.');
        } else if (contractError.code === 4001) {
          throw new Error('Transaction cancelled by user.');
        } else if (contractError.message?.includes('insufficient funds')) {
          throw new Error('Insufficient POL for minting and gas fees. Please add more MATIC to your wallet.');
        } else if (contractError.message?.includes('user rejected')) {
          throw new Error('Transaction cancelled by user.');
        } else if (contractError.message?.includes('chain')) {
          throw new Error('Wrong network. Please switch to Polygon Amoy Testnet.');
        } else if (contractError.reason) {
          throw new Error(`Contract error: ${contractError.reason}`);
        }
        
        throw contractError;
      }
      
    } catch (error: any) {
      console.error('❌ Minting failed:', error);
      
      // Better error messages for users
      let userMessage = error.message || 'Unknown minting error';
      
      if (error.code === -32603) {
        userMessage = 'Network connection error. Please check your internet and wallet connection.';
      } else if (error.code === 4001) {
        userMessage = 'Transaction cancelled by user.';
      } else if (error.message?.includes('chain')) {
        userMessage = 'Wrong network detected. Please switch to Polygon Amoy Testnet in your wallet.';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage = 'Insufficient POL. Please add more MATIC to your wallet for gas fees.';
      }
      
      throw new Error(userMessage);
    }
  };

  const handleSubmit = async () => {
    if (!title || !session?.user?.id || priceUsd === undefined || priceUsd === null) {
      alert("Please fill in all required fields and sign in.");
      return;
    }

    if (type === 'single' && !audioFile) {
      alert("Please upload an audio file for the single.");
      return;
    }

    setUploading(true);

    try {
      const userId = session.user.id;

      if (type === 'single') {
        // Step 1: Upload to IPFS with detailed logging
        console.log('🚀 Starting IPFS upload...');
        const ipfsData = await uploadSingleTrack();
        console.log('✅ IPFS upload result:', ipfsData);
        
        // Step 2: Mint on blockchain with better error handling
        let mintResult = null;
        let tokenId = null;
        
        try {
          console.log('🔨 Starting blockchain mint...');
          console.log('🔍 Contract details:', {
            contract: !!contract,
            contractAddress: contract?.target || contract?.address,
            isConnected,
            account,
            networkId
          });
          
          setUploadProgress('Minting NFT on blockchain...');
          
          mintResult = await mintNFTOnContract(ipfsData);
          console.log('✅ Mint successful:', mintResult);

          // Extract token ID from mint result
          if (mintResult && mintResult.tokenId) {
            tokenId = mintResult.tokenId;
          } else if (contract) {
            try {
              const nextId = await contract.nextId();
              tokenId = Number(nextId) - 1;
            } catch {
              tokenId = Date.now();
            }
          }

          // Save to DB only after confirmed on-chain mint
          setUploadProgress('Saving collectible...');
          try {
            await apiClient.post('/collectibles/save', {
              title:       ipfsData.title || title,
              description: ipfsData.description || description,
              artist:      ipfsData.artist || artist,
              genres,
              bpm,
              lyrics,
              releaseDate,
              priceUsd,
              editionSize: ipfsData.editionSize || editionSize || 1,
              audioUrl:    ipfsData.audio,
              audioBlobId: ipfsData.audioBlobId,
              imageUrl:    ipfsData.image,
              imageBlobId: ipfsData.imageBlobId,
              metadataUri: ipfsData.metadataCID,
              metadataHash: ipfsData.metadataHash,
              tokenId,
              txHash:      mintResult?.transactionHash,
              blockNumber: mintResult?.blockNumber,
              contractAddress: typeof contract?.target === 'string' ? contract.target : contract?.address,
            });
          } catch (saveErr: any) {
            console.warn('DB save failed (non-fatal):', saveErr?.message);
          }

          setUploadProgress('NFT successfully created and minted!');
          
        } catch (mintError: any) {
          console.error('❌ Blockchain minting failed:', mintError);
          console.error('Error details:', {
            message: mintError.message,
            code: mintError.code,
            data: mintError.data,
            name: mintError.name,
            reason: mintError.reason
          });
          
          setUploadProgress(`IPFS upload successful, but minting failed: ${mintError.message}`);
          
          // Show detailed error to user
          alert(`Walrus upload successful!\n\nMinting failed: ${mintError.message}\n\nFiles are uploaded to Walrus. You can retry minting later.`);
        }

        // Create NFT data object
        const nftData: MusicNFT = {
          id: tokenId || Date.now(),
          tokenId: tokenId || undefined,
          title: ipfsData.title || title,
          description: ipfsData.description || description,
          artist: ipfsData.artist || artist,
          genre: genres.join(', '),
          bpm: ipfsData.bpm || bpm,
          lyrics: ipfsData.lyrics || lyrics,
          editionSize: ipfsData.editionSize || editionSize || 1,
          price: priceUsd,
          audio: ipfsData.audio,
          image: ipfsData.image,
          releaseDate: ipfsData.releaseDate || releaseDate,
          metadataCID: ipfsData.metadataCID,
          metadataHash: ipfsData.metadataHash,
          type: 'single',
          userId,
          contractAddress: typeof contract?.target === 'string'
            ? contract.target
            : typeof contract?.address === 'string'
              ? contract.address
              : undefined,
          transactionHash: mintResult?.transactionHash,
          blockNumber: mintResult?.blockNumber,
          mintingStatus: mintResult ? 'success' : 'failed',
          creator: account || undefined
        };

        // Store metadata if we have a token ID
        if (tokenId) {
          storeNFTMetadata(tokenId, nftData);
        }

        // Call the onCreate callback
        onCreate(nftData);
      }

      // Close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("❌ Error creating NFT:", err);
      console.error('Full error object:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to create NFT: ${errorMessage}`);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
  <>
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Music Collectible</h2>
          <div className="flex items-center gap-3">
            {/* Wallet manager pill */}
            {walletAddresses.length > 0 && (
              <button
                onClick={() => setShowWalletManager(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-semibold transition"
              >
                <span className="text-green-500 text-xs">●</span>
                {ensName ?? `${walletAddresses[0].slice(0, 6)}…${walletAddresses[0].slice(-4)}`}
              </button>
            )}
            <button onClick={onClose} disabled={uploading}>
              <FontAwesomeIcon
                icon={faTimes}
                className={`text-xl ${uploading ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              />
            </button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800">{uploadProgress}</div>
                <div className="text-xs text-blue-600 mt-1">
                  Please don&apos;t close this window while processing...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Check */}
        {!session?.user?.id && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              ⚠️ Please sign in to create collectibles
            </div>
          </div>
        )}

        {/* Type Selector */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setType('single')}
              disabled={uploading || isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                type === 'single' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${uploading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Single Track
            </button>
            <button
              onClick={() => setType('album')}
              disabled
              className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              Album (Coming Soon)
            </button>
          </div>
        </div>

        {/* Single Track Upload */}
        {type === 'single' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Audio Upload */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                Audio File (WAV / MP3) <span className="text-red-500">*</span>
              </label>
              <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-3" />
                <input
                  type="file"
                  accept=".wav,.mp3,.m4a"
                  onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="audio-upload"
                  disabled={uploading || isLoading}
                />
                <label htmlFor="audio-upload" className={`cursor-pointer text-blue-600 font-semibold text-sm text-center ${uploading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {audioFile ? (
                    <div>
                      <div className="text-green-600 font-medium">{audioFile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {audioFile.size > 50 * 1024 * 1024 && (
                        <div className="text-red-500 text-xs mt-1">
                          File too large (max 50MB)
                        </div>
                      )}
                    </div>
                  ) : (
                    "Click to upload audio file (max 50MB)"
                  )}
                </label>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Cover Image (optional)</label>
              <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading || isLoading}
                />
                <label htmlFor="image-upload" className={`cursor-pointer text-blue-600 font-semibold text-sm text-center ${uploading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {imageFile ? (
                    <div>
                      <div className="text-green-600 font-medium">{imageFile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {imageFile.size > 10 * 1024 * 1024 && (
                        <div className="text-red-500 text-xs mt-1">
                          File too large (max 10MB)
                        </div>
                      )}
                    </div>
                  ) : (
                    "Click to upload cover image (max 10MB)"
                  )}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Common Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              {type === 'single' ? 'Title' : 'Album Title'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={`Enter ${type} title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading || isLoading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Artist Name</label>
            <input
              type="text"
              placeholder="Enter artist name"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={uploading || isLoading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Edition Size</label>
            <input
              type="number"
              placeholder="e.g. 100"
              min="1"
              value={editionSize || ""}
              onChange={(e) => setEditionSize(Number(e.target.value))}
              disabled={uploading || isLoading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 10.00"
              min="0"
              step="0.01"
              value={priceUsd || ""}
              onChange={handlePriceChange}
              disabled={uploading || isLoading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {priceUsd !== undefined && maticUsdPrice > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                ≈ {(priceUsd / maticUsdPrice).toFixed(4)} POL
              </p>
            )}
          </div>

          {type === 'single' && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">BPM</label>
              <input
                type="number"
                placeholder="e.g. 120"
                min="1"
                max="300"
                value={bpm || ""}
                onChange={(e) => setBpm(Number(e.target.value))}
                disabled={uploading || isLoading}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Release Date</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              disabled={uploading || isLoading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Genres */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">Genres</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                disabled={uploading || isLoading}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  genres.includes(genre)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                } ${uploading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg p-3">
            {genres
              .filter((g) => !presetGenres.includes(g))
              .map((g) => (
                <div
                  key={g}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {g}
                  <button
                    onClick={() => removeGenre(g)}
                    disabled={uploading || isLoading}
                    className="ml-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            <input
              type="text"
              placeholder="Add custom genre..."
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={handleGenreKeyDown}
              disabled={uploading || isLoading}
              className="px-2 py-1 text-sm border-none focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400 disabled:opacity-50 flex-1 min-w-[120px]"
            />
          </div>
        </div>

        {/* Description and Lyrics */}
        <div className="grid grid-cols-1 gap-5 mb-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Description</label>
            <textarea
              placeholder={`Describe your ${type}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading || isLoading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] disabled:bg-gray-100"
            />
          </div>

          {type === 'single' && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Lyrics</label>
              <textarea
                placeholder="Enter lyrics..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                disabled={uploading || isLoading}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] disabled:bg-gray-100"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading || isLoading}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              uploading ||
              !title ||
              !session?.user?.id ||
              priceUsd === undefined ||
              !audioFile ||
              (audioFile && audioFile.size > 50 * 1024 * 1024)
            }
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Creating...' : `Create & Mint ${type === 'single' ? 'Single' : 'Album'}`}
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <span className="text-red-500">*</span> Required fields
        </div>
      </div>
    </div>

  {showWalletManager && (
    <WalletManagerModal
      walletAddresses={walletAddresses}
      ensName={ensName}
      onClose={() => setShowWalletManager(false)}
      onUpdate={(addresses, ens) => {
        onWalletUpdate(addresses, ens);
        if (addresses.length === 0) setShowWalletManager(false);
      }}
    />
  )}
  </>
  );
};

export default MusicNFTCreationModal;
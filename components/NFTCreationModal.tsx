import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useSession } from "next-auth/react";
import apiClient from "@/libs/api";

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
  metadataCID?: string;
  userId?: string;
  type: 'single' | 'album';
  trackCount?: number;
  tracks?: Track[];
  albumCID?: string;
  releaseDate?: string;
}

interface NFTCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (nft: MusicNFT) => void;
}

const presetGenres = [
  "Hip Hop", "Reggaeton", "Afrobeats", "Pop", "Electronic", "R&B", 
  "Trap", "Rock", "House", "Techno", "Indie", "Dancehall", 
  "Post Punk", "Jazz", "Instrumental", "Spiritual", "Beats",
];

const MusicNFTCreationModal: React.FC<NFTCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { data: session } = useSession();
  
  // Common fields
  const [type, setType] = useState<'single' | 'album'>('single');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [editionSize, setEditionSize] = useState<number | undefined>();
  const [priceUsd, setPriceUsd] = useState<number | undefined>();
  const [dotUsdPrice, setDotUsdPrice] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [releaseDate, setReleaseDate] = useState("");
  
  // Single track fields
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bpm, setBpm] = useState<number | undefined>();
  const [lyrics, setLyrics] = useState("");
  
  // Album fields
  const [albumCoverImage, setAlbumCoverImage] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePriceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPriceUsd(value);

    // Fetch DOT price for display purposes only
    try {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd"
      );
      const data = await resp.json();
      const price = data?.polkadot?.usd;
      if (typeof price === "number") setDotUsdPrice(price);
    } catch (err) {
      console.error("Failed to fetch DOT price:", err);
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

  // Album track management
  const addTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString(),
      title: "",
      audioFile: null,
      trackNumber: tracks.length + 1,
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (trackId: string) => {
    const updatedTracks = tracks.filter(t => t.id !== trackId);
    // Renumber tracks
    const renumberedTracks = updatedTracks.map((track, index) => ({
      ...track,
      trackNumber: index + 1
    }));
    setTracks(renumberedTracks);
  };

  const updateTrack = (trackId: string, field: keyof Track, value: any) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, [field]: value } : track
    ));
  };

  // Upload single track using apiClient
  const uploadSingleTrack = async () => {
    try {
      setUploadProgress('Preparing single track upload...');
      
      const formData = new FormData();
      formData.append('audioFile', audioFile!);
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }
      
      // Add metadata as JSON string
      const metadata = {
        title,
        description,
        artist,
        genres,
        bpm,
        lyrics,
        editionSize: editionSize || 1,
        priceUsd,
        releaseDate,
        userId: session!.user!.id
      };
      formData.append('metadata', JSON.stringify(metadata));

      setUploadProgress('Uploading single track to IPFS...');
      
      // Call API route using apiClient
      const response = await apiClient.post('/pinata/upload-single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error uploading single track:', error);
      throw error;
    }
  };

  // Upload album using apiClient
  const uploadAlbumBundle = async () => {
    try {
      setUploadProgress('Preparing album upload...');
      
      const formData = new FormData();
      
      // Add album cover
      if (albumCoverImage) {
        formData.append('albumCover', albumCoverImage);
      }
      
      // Add tracks
      tracks.forEach((track, index) => {
        if (track.audioFile) {
          formData.append(`track_${index}_audio`, track.audioFile);
        }
        if (track.imageFile) {
          formData.append(`track_${index}_image`, track.imageFile);
        }
      });
      
      // Add album metadata
      const albumMetadata = {
        title,
        description,
        artist,
        genres,
        tracks: tracks.map(track => ({
          title: track.title,
          artist: track.artist,
          bpm: track.bpm,
          lyrics: track.lyrics,
          trackNumber: track.trackNumber
        })),
        editionSize: editionSize || 1,
        priceUsd,
        releaseDate,
        userId: session!.user!.id
      };
      formData.append('metadata', JSON.stringify(albumMetadata));

      setUploadProgress('Uploading album bundle to IPFS...');

      // Call API route using apiClient
      const response = await apiClient.post('/pinata/upload-album', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Full response object:', response); // Add this
      console.log('Response status:', response.status); // Add this
      console.log('Response data:', response.data); // Add this
      console.log('Response data type:', typeof response.data); // Add this

      // Check if response.data is already the data we want
      const responseData = response.data;
      
      // Try different response structures
      if (responseData && responseData.success) {
        console.log('Using responseData.data:', responseData.data);
        return responseData.data;
      } else if (responseData && responseData.data) {
        console.log('Using responseData.data directly:', responseData.data);
        return responseData.data;
      } else if (responseData && responseData.albumCID) {
        console.log('Using responseData directly (no success field):', responseData);
        return responseData;
      } else {
        console.error('Unexpected response structure:', responseData);
        throw new Error('Unexpected response structure from server');
      }

    } catch (error) {
      console.error('Error uploading album:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title || !session?.user?.id || !priceUsd) {
      alert("Please fill in all required fields and sign in.");
      return;
    }

    if (type === 'single' && !audioFile) {
      alert("Please upload an audio file for the single.");
      return;
    }

    if (type === 'album' && (tracks.length === 0 || tracks.some(t => !t.audioFile || !t.title))) {
      alert("Please add at least one track with title and audio file for the album.");
      return;
    }

    setUploading(true);

    try {
      const userId = session.user.id;

      if (type === 'single') {
        // Handle single track upload
        const singleData = await uploadSingleTrack();

        const nftData: MusicNFT = {
          title: singleData.title,
          description: singleData.description,
          artist: singleData.artist,
          genre: singleData.genre,
          bpm: singleData.bpm,
          lyrics: singleData.lyrics,
          editionSize: singleData.editionSize,
          price: singleData.price,
          audio: singleData.audio,
          image: singleData.image,
          releaseDate: singleData.releaseDate,
          metadataCID: singleData.metadataCID,
          type: 'single',
          userId
        };

        setUploadProgress('Single track created successfully!');
        onCreate(nftData);
      } else if (type === 'album') {
        // Handle album upload
        const albumData = await uploadAlbumBundle();

        const nftData: MusicNFT = {
          title: albumData.title,
          description: albumData.description,
          artist: albumData.artist,
          genre: albumData.genre,
          editionSize: albumData.editionSize,
          price: albumData.price,
          releaseDate: albumData.releaseDate,
          metadataCID: albumData.albumCID, // Make sure this matches backend response
          albumCID: albumData.albumCID,
          type: 'album',
          trackCount: albumData.trackCount,
          tracks: albumData.tracks,
          userId
        };

        setUploadProgress('Album created successfully!');
        onCreate(nftData);
      }

      // Close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (err) {
      console.error("Error uploading NFT:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to create NFT: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Music Collectible</h2>
          <button onClick={onClose} disabled={uploading}>
            <FontAwesomeIcon 
              icon={faTimes} 
              className={`text-xl ${uploading ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} 
            />
          </button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800">{uploadProgress}</div>
                <div className="text-xs text-blue-600 mt-1">
                  Please don&apos;t close this window while uploading...
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
              disabled={uploading}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                type === 'single' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Single Track
            </button>
            <button
              onClick={() => setType('album')}
              // disabled={uploading}
              disabled
              className={`px-6 py-3 rounded-lg font-medium transition ${
                type === 'album' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Album
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
                  disabled={uploading}
                />
                <label htmlFor="audio-upload" className={`cursor-pointer text-blue-600 font-semibold text-sm text-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {audioFile ? (
                    <div>
                      <div className="text-green-600 font-medium">{audioFile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    "Click to upload audio file"
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
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className={`cursor-pointer text-blue-600 font-semibold text-sm text-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {imageFile ? (
                    <div>
                      <div className="text-green-600 font-medium">{imageFile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    "Click to upload cover image"
                  )}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Album Tracks */}
        {type === 'album' && (
          <div className="mb-6">
            {/* Album Cover */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Album Cover Image</label>
              <div className="w-48 h-48 border-dashed border-2 border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAlbumCoverImage(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="album-cover-upload"
                  disabled={uploading}
                />
                <label htmlFor="album-cover-upload" className={`cursor-pointer text-blue-600 font-semibold text-xs text-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {albumCoverImage ? (
                    <div>
                      <div className="text-green-600 font-medium text-xs">{albumCoverImage.name}</div>
                    </div>
                  ) : (
                    "Click to upload album cover"
                  )}
                </label>
              </div>
            </div>

            {/* Tracks */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tracks</h3>
              <button
                onClick={addTrack}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Track
              </button>
            </div>

            {tracks.map((track) => (
              <div key={track.id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Track {track.trackNumber}</h4>
                  <button
                    onClick={() => removeTrack(track.id)}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Track Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`Track ${track.trackNumber} title`}
                      value={track.title}
                      onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                      disabled={uploading}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audio File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".wav,.mp3,.m4a"
                      onChange={(e) => updateTrack(track.id, 'audioFile', e.target.files?.[0] || null)}
                      disabled={uploading}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Artist (optional)</label>
                    <input
                      type="text"
                      placeholder="Track artist (if different)"
                      value={track.artist || ""}
                      onChange={(e) => updateTrack(track.id, 'artist', e.target.value)}
                      disabled={uploading}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BPM</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      min="1"
                      max="300"
                      value={track.bpm || ""}
                      onChange={(e) => updateTrack(track.id, 'bpm', Number(e.target.value))}
                      disabled={uploading}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lyrics</label>
                  <textarea
                    placeholder="Enter track lyrics..."
                    value={track.lyrics || ""}
                    onChange={(e) => updateTrack(track.id, 'lyrics', e.target.value)}
                    disabled={uploading}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] disabled:bg-gray-100"
                  />
                </div>
              </div>
            ))}
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
              disabled={uploading}
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
              disabled={uploading}
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
              disabled={uploading}
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
              disabled={uploading}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {priceUsd !== undefined && dotUsdPrice > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                ≈ {(priceUsd / dotUsdPrice).toFixed(4)} DOT (display only)
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
                disabled={uploading}
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
              disabled={uploading}
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
                disabled={uploading}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  genres.includes(genre)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    disabled={uploading}
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
              disabled={uploading}
              className="px-2 py-1 text-sm border-none focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400 disabled:opacity-50 flex-1 min-w-[120px]"
            />
          </div>
        </div>

        {/* Description and Lyrics (for singles) */}
        <div className="grid grid-cols-1 gap-5 mb-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Description</label>
            <textarea
              placeholder={`Describe your ${type}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
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
                disabled={uploading}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] disabled:bg-gray-100"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !title || !session?.user?.id || !priceUsd}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Creating...' : `Create ${type === 'single' ? 'Single' : 'Album'}`}
          </button>
        </div>

        {/* Form validation hints */}
        <div className="mt-3 text-xs text-gray-500">
          <span className="text-red-500">*</span> Required fields
        </div>
      </div>
    </div>
  );
};

export default MusicNFTCreationModal;
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { fetchDotUsdPrice } from "../libs/price";
import { uploadToStoracha, uploadMetadata, StoachaClient } from "@/libs/storacha";

interface MusicNFT {
  title: string;
  description?: string;
  image?: string;
  audio: string;
  artist: string;
  genres: string; // comma-separated list
  bpm?: number;
  lyrics?: string;
  editionSize?: number;
  price?: number; // DOT
  metadataCID?: string; // store the CID after uploading
}

interface NFTCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (nft: MusicNFT) => void;
}

const presetGenres = [
  "Hip Hop",
  "Reggaeton",
  "Afrobeats",
  "Pop",
  "Electronic",
  "R&B",
  "Trap",
  "Rock",
  "House",
  "Techno",
  "Indie",
  "Dancehall",
  "Post Punk",
  "Jazz",
  "Instrumental",
  "Spiritual",
  "Beats",
];

const MusicNFTCreationModal: React.FC<NFTCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [bpm, setBpm] = useState<number | undefined>();
  const [lyrics, setLyrics] = useState("");
  const [editionSize, setEditionSize] = useState<number | undefined>();
  const [price, setPrice] = useState<number | undefined>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dotUsdPrice, setDotUsdPrice] = useState<number>(0);
  const [priceUsd, setPriceUsd] = useState<number | undefined>();
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handlePriceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPriceUsd(value);

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

  const handleSubmit = async () => {
    if (!title || !audioFile) {
      alert("Please add a title and upload your audio file.");
      return;
    }

    if (!dotUsdPrice || !priceUsd) {
      alert("Please enter a price in USD.");
      return;
    }

    setUploading(true);

    try {
      // Upload files to Storacha
      const audioCID = await uploadToStoracha(audioFile!);
      const imageCID = imageFile ? await uploadToStoracha(imageFile) : undefined;

      // Convert USD to DOT
      const priceDot = priceUsd / dotUsdPrice;

      // Build metadata
      const metadata = {
        name: title,
        description,
        image: imageCID,
        animation_url: audioCID,
        lyrics,
        artist,
        genre: genres.join(", "),
        bpm,
        edition: editionSize,
        price_usd: priceUsd,
        price_dot: priceDot,
      };

      const metadataCID = await uploadMetadata(metadata);

      const nftData: MusicNFT = {
        title,
        description,
        artist,
        genres: genres.join(", "),
        bpm,
        lyrics,
        editionSize,
        price: priceDot,
        audio: audioCID,
        image: imageCID,
        metadataCID,
      };

      console.log("NFT uploaded successfully:", nftData);

      onCreate(nftData);
      onClose();
    } catch (err) {
      console.error("Error uploading NFT:", err);
      alert("Failed to upload NFT to Storacha.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Music Collectible</h2>
          <button onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} className="text-gray-500 text-xl hover:text-gray-700" />
          </button>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Audio Upload */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Audio File (WAV / MP3) *</label>
            <div className="border-dashed border-2 border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
              <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-2" />
              <input
                type="file"
                accept=".wav,.mp3"
                onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer text-blue-600 font-semibold text-sm">
                {audioFile ? audioFile.name : "Click to upload audio"}
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Cover Image (optional)</label>
            <div className="border-dashed border-2 border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
              <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer text-blue-600 font-semibold text-sm">
                {imageFile ? imageFile.name : "Click to upload image"}
              </label>
            </div>
          </div>
        </div>
        {/* Metadata Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Title *</label>
            <input
              type="text"
              placeholder="Enter collectible title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">Artist Name</label>
            <input
              type="text"
              placeholder="Enter artist name"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">Edition Size</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={editionSize || ""}
              onChange={(e) => setEditionSize(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">Price (USD)</label>
            <input
                type="number"
                placeholder="e.g. 10.00"
                value={priceUsd || ""}
                onChange={handlePriceChange}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {priceUsd !== undefined && dotUsdPrice > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                ≈ {(priceUsd / dotUsdPrice).toFixed(4)} DOT
                </p>
            )}
            </div>



          <div>
            <label className="block text-gray-700 mb-1 font-medium">BPM</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={bpm || ""}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Genres */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-1 font-medium">Genres</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  genres.includes(genre)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border rounded-lg p-2">
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
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
         <input
            type="text"
            placeholder="Add genre"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={handleGenreKeyDown}
            className="px-2 py-1 text-sm border-none focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Lyrics + Description */}
        <div className="grid grid-cols-1 gap-5 mb-6">
            <div>
                <label className="block text-gray-700 mb-1 font-medium">Description</label>
                <textarea
                placeholder="Describe your collectible..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
          </div>
          <div>
                <label className="block text-gray-700 mb-1 font-medium">Lyrics</label>
                <textarea
                placeholder="Enter lyrics..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
          </div>

         
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Create Collectible
        </button>
      </div>
    </div>
  );
};

export default MusicNFTCreationModal;

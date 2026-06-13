import mongoose, { Schema, Document, Types } from 'mongoose';

// Main Collectible Interface
export interface ICollectible extends Document {
  _id: Types.ObjectId;
  
  // Basic Info
  userId: string;
  title: string;
  description?: string;
  artist: string;
  type: 'single' | 'album';
  
  // Blockchain Data (filled after minting)
  contractAddress?: string; // For parachains with EVM compatibility
  tokenId?: string;
  chainId?: number; // Optional - for parachains
  network: 'polkadot' | 'kusama' | 'westend' | 'rococo' | 'polygon';
  parachain?: string; // e.g., 'moonbeam', 'astar', 'acala', etc.
  txHash?: string; // Transaction hash
  blockNumber?: number;
  blockHash?: string; // Polkadot block hash
  extrinsicIndex?: string; // Polkadot extrinsic index
  mintedAt?: Date;
  
  // Storage provider
  storageProvider?: 'ipfs' | 'walrus';

  // Metadata URI (IPFS URL or Walrus aggregator URL)
  metadataUri: string;
  metadataHash: string; // IPFS CID or Walrus blob ID

  // Pinata/IPFS — optional, only set for IPFS uploads
  groupId?: string;
  groupName?: string;

  // Media Files
  audioUrl: string;
  audioHash?: string;   // IPFS CID
  audioBlobId?: string; // Walrus blob ID
  imageUrl?: string;
  imageHash?: string;   // IPFS CID
  imageBlobId?: string; // Walrus blob ID
  
  // Metadata
  genres: string[];
  bpm?: number;
  lyrics?: string;
  releaseDate?: Date;
  
  // Commercial
  priceUsd: number;
  priceDOT?: number; // Price in DOT
  priceKSM?: number; // Price in KSM (for Kusama)
  editionSize: number;
  currentSupply: number; // How many minted so far
  
  // Album specific
  trackCount?: number;
  albumType?: 'EP' | 'LP';
  
  // Status & Timestamps
  status: 'uploaded' | 'minted' | 'listed' | 'sold';
  createdAt: Date;
  updatedAt: Date;
  
  // Engagement (for analytics)
  views: number;
  plays: number;
  likes: number;
}

// Track Interface (for albums)
export interface ITrack extends Document {
  _id: Types.ObjectId;
  collectibleId: Types.ObjectId; // Reference to parent Collectible
  
  // Track Info
  title: string;
  trackNumber: number;
  artist?: string; // If different from album artist
  bpm?: number;
  lyrics?: string;
  duration?: number; // In seconds
  
  // IPFS Data
  audioUrl: string;
  audioHash: string;
  imageUrl?: string;
  imageHash?: string;
  metadataUrl: string;
  metadataHash: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// User Collectible Stats Interface
export interface IUserCollectibleStats extends Document {
  _id: Types.ObjectId;
  userId: string;
  
  // Stats
  totalCollectibles: number;
  totalSingles: number;
  totalAlbums: number;
  totalTracks: number; // Sum of all tracks in albums
  totalSales: number;
  totalRevenue: number;
  totalViews: number;
  totalPlays: number;
  totalLikes: number;
  
  // Collections
  collectibleIds: Types.ObjectId[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Collectible Schema
const CollectibleSchema = new Schema<ICollectible>({
  // Basic Info
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true, index: true },
  description: { type: String },
  artist: { type: String, required: true, index: true },
  type: { type: String, enum: ['single', 'album'], required: true, index: true },
  
  // Blockchain Data
  contractAddress: { type: String, index: true }, // For EVM-compatible parachains
  tokenId: { type: String, index: true },
  chainId: { type: Number, index: true }, // Optional for parachains
  network: {
    type: String,
    enum: ['polkadot', 'kusama', 'westend', 'rococo', 'polygon'],
    default: 'polygon',
    required: true,
    index: true
  },
  parachain: { 
    type: String, 
    index: true 
  }, // e.g., 'moonbeam', 'astar', 'acala'
  txHash: { type: String, index: true },
  blockNumber: { type: Number },
  blockHash: { type: String },
  extrinsicIndex: { type: String },
  mintedAt: { type: Date },
  
  // Storage
  storageProvider: { type: String, enum: ['ipfs', 'walrus'], default: 'walrus' },
  metadataUri:  { type: String, required: true },
  metadataHash: { type: String, required: true, index: true },

  // Pinata/IPFS (optional)
  groupId:   { type: String, index: true },
  groupName: { type: String },

  // Media Files
  audioUrl:    { type: String, required: true },
  audioHash:   { type: String },   // IPFS CID
  audioBlobId: { type: String },   // Walrus blob ID
  imageUrl:    { type: String },
  imageHash:   { type: String },   // IPFS CID
  imageBlobId: { type: String },   // Walrus blob ID
  
  // Metadata
  genres: [{ type: String, index: true }],
  bpm: { type: Number },
  lyrics: { type: String },
  releaseDate: { type: Date },
  
  // Commercial
  priceUsd: { type: Number, required: true, min: 0, index: true },
  priceDOT: { type: Number, min: 0 }, // Price in DOT
  priceKSM: { type: Number, min: 0 }, // Price in KSM
  editionSize: { type: Number, required: true, min: 1 },
  currentSupply: { type: Number, default: 0, min: 0 },
  
  // Album specific
  trackCount: { type: Number },
  albumType: { type: String, enum: ['EP', 'LP'] },
  
  // Status & Timestamps
  status: { 
    type: String, 
    enum: ['uploaded', 'minted', 'listed', 'sold'], 
    default: 'uploaded',
    index: true 
  },
  
  // Engagement
  views: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Track Schema
const TrackSchema = new Schema<ITrack>({
  collectibleId: { type: Schema.Types.ObjectId, ref: 'Collectible', required: true, index: true },
  
  // Track Info
  title: { type: String, required: true },
  trackNumber: { type: Number, required: true },
  artist: { type: String },
  bpm: { type: Number },
  lyrics: { type: String },
  duration: { type: Number }, // In seconds
  
  // IPFS Data
  audioUrl: { type: String, required: true },
  audioHash: { type: String, required: true },
  imageUrl: { type: String },
  imageHash: { type: String },
  metadataUrl: { type: String, required: true },
  metadataHash: { type: String, required: true }
}, {
  timestamps: true
});

// User Collectible Stats Schema
const UserCollectibleStatsSchema = new Schema<IUserCollectibleStats>({
  userId: { type: String, required: true, unique: true, index: true },
  
  // Stats
  totalCollectibles: { type: Number, default: 0 },
  totalSingles: { type: Number, default: 0 },
  totalAlbums: { type: Number, default: 0 },
  totalTracks: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  
  // Collections
  collectibleIds: [{ type: Schema.Types.ObjectId, ref: 'Collectible' }]
}, {
  timestamps: true
});

// Compound Indexes for Performance
CollectibleSchema.index({ userId: 1, status: 1 });
CollectibleSchema.index({ type: 1, status: 1 });
CollectibleSchema.index({ genres: 1, priceUsd: 1 });
CollectibleSchema.index({ network: 1, parachain: 1 }); // Polkadot specific
CollectibleSchema.index({ contractAddress: 1, tokenId: 1 });
CollectibleSchema.index({ txHash: 1 }); // For transaction lookups
CollectibleSchema.index({ createdAt: -1 });
CollectibleSchema.index({ artist: 1, type: 1 });

TrackSchema.index({ collectibleId: 1, trackNumber: 1 });

// Pre-save middleware to automatically set album type
CollectibleSchema.pre('save', function(next) {
  if (this.type === 'album' && this.trackCount) {
    this.albumType = this.trackCount <= 7 ? 'EP' : 'LP';
  }
  next();
});

// Export models
export const Collectible = mongoose.models.Collectible || mongoose.model<ICollectible>('Collectible', CollectibleSchema);
export const Track = mongoose.models.Track || mongoose.model<ITrack>('Track', TrackSchema);
export const UserCollectibleStats = mongoose.models.UserCollectibleStats || mongoose.model<IUserCollectibleStats>('UserCollectibleStats', UserCollectibleStatsSchema);

// Export schemas for reference
export { CollectibleSchema, TrackSchema, UserCollectibleStatsSchema };
// Database utility functions
// Update the import path for UserNFTStats if it's exported from another file
import { Collectible, Track } from '@/models/Collectible';
import connectMongo from "@/libs/mongoose";
export class CollectibleService {
  
  // NFT Operations
  static async createNFT(nftData: any) {
    await connectMongo();
    const nft = new Collectible(nftData);
    await nft.save();
    
    // Update user stats
    await this.updateUserStats(nftData.userId);
    
    return nft;
  }
  
  static async getUserNFTs(userId: string, status?: string) {
    await connectMongo();
    return Collectible.find({ userId, ...(status && { status }) });
  }
  
  static async getNFTWithTracks(nftId: string) {
    await connectMongo();
    const nft = await Collectible.findById(nftId);
    if (nft?.type === 'album') {
      const tracks = await Track.find({ nftId }).sort({ trackNumber: 1 });
      return { ...nft.toObject(), tracks };
    }
    return nft;
  }
  
  static async searchNFTs(searchTerm: string, filters?: any) {
    await connectMongo();
    let query = Collectible.find({ $text: { $search: searchTerm } });
    
    if (filters) {
      if (filters.genre) query = query.where('genres').in([filters.genre]);
      if (filters.type) query = query.where('type').equals(filters.type);
      if (filters.priceMin) query = query.where('priceUsd').gte(filters.priceMin);
      if (filters.priceMax) query = query.where('priceUsd').lte(filters.priceMax);
    }
    
    return query.exec();
  }
  
  // Track Operations
  static async createTracks(tracks: any[]) {
    await connectMongo();
    return Track.insertMany(tracks);
  }
  
  static async getAlbumTracks(nftId: string) {
    await connectMongo();
    return Track.find({ nftId }).sort({ trackNumber: 1 });
  }
  
  // User Stats Operations
  static async updateUserStats(userId: string) {
    await connectMongo();
    
    const nfts = await Collectible.find({ userId });
    const totalTracks = await Track.countDocuments({ 
      nftId: { $in: nfts.filter(nft => nft.type === 'album').map(nft => nft._id) } 
    });
    
    const stats = {
      totalNFTs: nfts.length,
      totalSingles: nfts.filter(nft => nft.type === 'single').length,
      totalAlbums: nfts.filter(nft => nft.type === 'album').length,
      totalTracks,
      totalSales: nfts.filter(nft => nft.status === 'sold').length,
      totalRevenue: nfts.reduce((sum, nft) => sum + (nft.status === 'sold' ? nft.priceUsd : 0), 0),
      totalViews: nfts.reduce((sum, nft) => sum + nft.views, 0),
      totalPlays: nfts.reduce((sum, nft) => sum + nft.plays, 0),
      totalLikes: nfts.reduce((sum, nft) => sum + nft.likes, 0),
      nftIds: nfts.map(nft => nft._id)
    };
    
    return Collectible.findOneAndUpdate(
      { userId },
      stats,
      { upsert: true, new: true }
    );
  }
  
  static async getUserStats(userId: string) {
    await connectMongo();
    return Collectible.findOne({ userId });
  }
}
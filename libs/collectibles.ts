// Database utility functions
import { NFT, Track, UserNFTStats } from '@/models/Collectible';
import { connectToDatabase } from '@/libs/mongodb';

export class CollectibleService {
  
  // NFT Operations
  static async createNFT(nftData: any) {
    await connectToDatabase();
    const nft = new NFT(nftData);
    await nft.save();
    
    // Update user stats
    await this.updateUserStats(nftData.userId);
    
    return nft;
  }
  
  static async getUserNFTs(userId: string, status?: string) {
    await connectToDatabase();
    return NFT.findByUser(userId, status);
  }
  
  static async getNFTWithTracks(nftId: string) {
    await connectToDatabase();
    const nft = await NFT.findById(nftId);
    if (nft?.type === 'album') {
      const tracks = await Track.find({ nftId }).sort({ trackNumber: 1 });
      return { ...nft.toObject(), tracks };
    }
    return nft;
  }
  
  static async searchNFTs(searchTerm: string, filters?: any) {
    await connectToDatabase();
    let query = NFT.searchNFTs(searchTerm);
    
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
    await connectToDatabase();
    return Track.insertMany(tracks);
  }
  
  static async getAlbumTracks(nftId: string) {
    await connectToDatabase();
    return Track.find({ nftId }).sort({ trackNumber: 1 });
  }
  
  // User Stats Operations
  static async updateUserStats(userId: string) {
    await connectToDatabase();
    
    const nfts = await NFT.find({ userId });
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
    
    return UserNFTStats.findOneAndUpdate(
      { userId },
      stats,
      { upsert: true, new: true }
    );
  }
  
  static async getUserStats(userId: string) {
    await connectToDatabase();
    return UserNFTStats.findOne({ userId });
  }
}
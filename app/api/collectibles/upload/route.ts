import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import { Collectible, Track, UserCollectibleStats } from '@/models/Collectible';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // If the user is not signed in, return an error
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    // Connect to MongoDB
    await connectMongo();
    
    const collectibleData = await request.json();
    
    // Validate required fields
    if (!collectibleData.userId || !collectibleData.title || !collectibleData.artist) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, artist' },
        { status: 400 }
      );
    }

    // Ensure the user can only create collectibles for themselves
    if (collectibleData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot create collectibles for other users' },
        { status: 403 }
      );
    }

    console.log("🔍 Creating collectible for user:", session.user.id);
    console.log("🔍 Collectible data:", {
      title: collectibleData.title,
      artist: collectibleData.artist,
      type: collectibleData.type
    });

    // Create the collectible
    const collectible = new Collectible({
      ...collectibleData,
      status: 'uploaded',
      network: collectibleData.network || 'polkadot',
      currentSupply: 0,
      views: 0,
      plays: 0,
      likes: 0
    });

    await collectible.save();
    console.log("✅ Collectible saved with ID:", collectible._id);

    // If it's an album, create tracks
    if (collectibleData.type === 'album' && collectibleData.tracks) {
      const tracks = collectibleData.tracks.map((track: any) => ({
        ...track,
        collectibleId: collectible._id
      }));
      
      console.log("🔍 Creating", tracks.length, "tracks for album");
      await Track.insertMany(tracks);
      console.log("✅ Tracks created successfully");
    }

    // Update user stats
    console.log("🔍 Updating user stats...");
    await updateUserStats(collectibleData.userId);
    console.log("✅ User stats updated");

    return NextResponse.json({
      success: true,
      data: {
        collectibleId: collectible._id,
        collectible: collectible
      },
      message: `${collectibleData.type === 'album' ? 'Album' : 'Single'} collectible created successfully`
    });

  } catch (error) {
    console.error('❌ Error creating collectible:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to create collectible', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper function to update user stats
async function updateUserStats(userId: string) {
  try {
    const collectibles = await Collectible.find({ userId });
    const albumCollectibles = collectibles.filter(c => c.type === 'album');
    
    const totalTracks = await Track.countDocuments({ 
      collectibleId: { $in: albumCollectibles.map(c => c._id) } 
    });
    
    const stats = {
      totalCollectibles: collectibles.length,
      totalSingles: collectibles.filter(c => c.type === 'single').length,
      totalAlbums: collectibles.filter(c => c.type === 'album').length,
      totalTracks,
      totalSales: collectibles.filter(c => c.status === 'sold').length,
      totalRevenue: collectibles.reduce((sum, c) => sum + (c.status === 'sold' ? c.priceUsd : 0), 0),
      totalViews: collectibles.reduce((sum, c) => sum + c.views, 0),
      totalPlays: collectibles.reduce((sum, c) => sum + c.plays, 0),
      totalLikes: collectibles.reduce((sum, c) => sum + c.likes, 0),
      collectibleIds: collectibles.map(c => c._id)
    };
    
    console.log("🔍 User stats to update:", stats);
    
    const updatedStats = await UserCollectibleStats.findOneAndUpdate(
      { userId },
      stats,
      { upsert: true, new: true }
    );
    
    console.log("✅ User stats updated:", updatedStats);
    
  } catch (error) {
    console.error('❌ Error updating user stats:', error);
    throw error; // Re-throw to be handled by the main catch block
  }
}
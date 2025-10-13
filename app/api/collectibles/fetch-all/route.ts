import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import { Collectible, Track } from '@/models/Collectible';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // If the user is not signed in, return an error
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    // Connect to MongoDB
    // Ensure MongoDB connection is established before querying
    await connectMongo();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // Optional filter by status
    const type = searchParams.get('type'); // Optional filter by type (single/album)
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = { };
    if (status) query.status = status;
    if (type) query.type = type;

    console.log("🔍 Query:", query);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch collectibles with pagination
    const collectibles = await Collectible.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    console.log(`✅ Found ${collectibles.length} collectibles`);

    // Get total count for pagination
    const totalCount = await Collectible.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // For albums, fetch their tracks
    const collectiblesWithTracks = await Promise.all(
      collectibles.map(async (collectible) => {
        if (collectible.type === 'album') {
          const tracks = await Track.find({ collectibleId: collectible._id })
            .sort({ trackNumber: 1 })
            .lean();
          return { ...collectible, tracks };
        }
        return collectible;
      })
    );

    console.log("✅ Added tracks to albums");

    // Return response with pagination info
    return NextResponse.json({
      success: true,
      data: {
        collectibles: collectiblesWithTracks,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      },
      message: `Found ${collectiblesWithTracks.length} collectibles`
    });

  } catch (error) {
    console.error('❌ Error fetching collectibles:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to fetch collectibles', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

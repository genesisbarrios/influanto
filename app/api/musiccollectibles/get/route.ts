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
    await connectMongo();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // Optional filter by status
    const type = searchParams.get('type'); // Optional filter by type (single/album)
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // If no userId provided, use the session user's ID
    const targetUserId = userId || session.user.id;

    // Users can only access their own collectibles (for privacy)
    if (targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access other users\' collectibles' },
        { status: 403 }
      );
    }

    console.log("🔍 Fetching collectibles for user:", targetUserId);

    // Build query
    const query: any = { userId: targetUserId };
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

// Optional: Add a public endpoint for marketplace browsing
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongo();

    const body = await request.json();
    const { 
      search, 
      genres, 
      type, 
      priceMin, 
      priceMax, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      limit = 20,
      page = 1 
    } = body;

    console.log("🔍 Public search with filters:", body);

    // Build query for public browsing (only minted/listed items)
    const query: any = { 
      status: { $in: ['minted', 'listed'] } 
    };

    // Add search filters
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { artist: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    if (genres && genres.length > 0) {
      query.genres = { $in: genres };
    }

    if (type) {
      query.type = type;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      query.priceUsd = {};
      if (priceMin !== undefined) query.priceUsd.$gte = priceMin;
      if (priceMax !== undefined) query.priceUsd.$lte = priceMax;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch collectibles
    const collectibles = await Collectible.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-userId') // Don't expose user IDs in public search
      .lean();

    const totalCount = await Collectible.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // For albums, fetch their tracks (but limit to essential info)
    const collectiblesWithTracks = await Promise.all(
      collectibles.map(async (collectible) => {
        if (collectible.type === 'album') {
          const tracks = await Track.find({ collectibleId: collectible._id })
            .sort({ trackNumber: 1 })
            .select('title trackNumber artist audioUrl imageUrl')
            .lean();
          return { ...collectible, tracks };
        }
        return collectible;
      })
    );

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
    console.error('❌ Error in public search:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search collectibles', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
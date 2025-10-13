import { NextRequest, NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";
import { Collectible } from '@/models/Collectible';

// Add this to force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongo();

    // Get URL parameters instead of using headers
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const userId = searchParams.get('userId');
    const genre = searchParams.get('genre');
    const type = searchParams.get('type');

    console.log('🔍 Fetch all collectibles:', { limit, skip, userId, genre, type });

    // Build filter query
    const filter: any = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (genre) {
      filter.genres = { $in: [genre] };
    }
    
    if (type) {
      filter.type = type;
    }

    // Fetch collectibles with pagination
    const collectibles = await Collectible.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Collectible.countDocuments(filter);

    console.log(`✅ Found ${collectibles.length} collectibles out of ${total} total`);

    return NextResponse.json({
      success: true,
      data: {
        collectibles,
        total,
        limit,
        skip,
        hasMore: (skip + collectibles.length) < total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching collectibles:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch collectibles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
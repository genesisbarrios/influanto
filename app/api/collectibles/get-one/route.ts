import { NextRequest, NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";
import { Collectible } from '@/models/Collectible';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongo();

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const title = searchParams.get('title');

    console.log('🔍 API Request:', { userId, title });

    // Validate required parameters
    if (!userId || !title) {
      return NextResponse.json({
        success: false,
        error: 'userId and title are required parameters'
      }, { status: 400 });
    }

    // Decode the title in case it's URL encoded
    const decodedTitle = decodeURIComponent(title);
    console.log('📝 Decoded title:', decodedTitle);

    // First, let's see what collectibles exist for this user
    const allUserCollectibles = await Collectible.find({ userId }).select('title _id').lean();
    console.log('📦 All collectibles for user:', allUserCollectibles);

    // Try multiple search strategies
    let collectible = null;

    // Strategy 1: Exact match (case-insensitive)
    collectible = await Collectible.findOne({
      userId: userId,
      title: { $regex: new RegExp(`^${decodedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).lean();

    // Strategy 2: If not found, try partial match
    if (!collectible) {
      collectible = await Collectible.findOne({
        userId: userId,
        title: { $regex: new RegExp(decodedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      }).lean();
    }

    // Strategy 3: If still not found, try by ID if the title looks like an ObjectId
    if (!collectible && title.match(/^[0-9a-fA-F]{24}$/)) {
      collectible = await Collectible.findOne({
        userId: userId,
        _id: title
      }).lean();
    }

    console.log('🎯 Found collectible:', collectible ? 'Yes' : 'No');

    // Fetch user profile data
    const userProfile = await User.findOne({
      $or: [
        { _id: userId },
        { Id: userId },
        { name: userId }
      ]
    }).select('name email Id').lean();

    console.log('👤 Found user profile:', userProfile ? 'Yes' : 'No');

    // FIXED: Always return consistent structure
    if (!collectible) {
      return NextResponse.json({
        success: false,
        error: 'Collectible not found',
        debug: {
          searchedUserId: userId,
          searchedTitle: decodedTitle,
          availableCollectibles: allUserCollectibles.map(c => c.title)
        }
      }, { status: 404 });
    }

    // FIXED: Success response with proper structure
    return NextResponse.json({
      success: true,
      data: {
        collectibles: [collectible],
        userProfile: userProfile || null,
        total: 1
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching collectible:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
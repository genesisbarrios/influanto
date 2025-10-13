import { NextRequest, NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";
import { Collectible } from '@/models/Collectible';
import User from '@/models/User';

// Force dynamic rendering - this fixes the Vercel error
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongo();

    // Get URL parameters - this was causing the static rendering issue
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

    // Try multiple search strategies for collectible
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

    console.log('🎯 Found collectible:', collectible ? 'Yes' : 'No');

    if (!collectible) {
      const allUserCollectibles = await Collectible.find({ userId }).select('title _id').lean();
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

    // Fetch user profile with username - THIS WAS MISSING
    const userProfile = await User.findOne({
      $or: [
        { _id: userId },
        { Id: userId },
        { name: userId }
      ]
    }).select('name email Id username').lean(); // ✅ Added 'username' to select

    console.log('👤 Found user profile:', userProfile);

    // Return success response
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
// app/api/printify-disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    // Get user from session
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('🔍 Before disconnect - User data:', {
      printifyShopId: user.printifyShopId,
      printifyConnected: user.printifyConnected,
      selectedProducts: user.selectedProducts
    });

  // Direct assignment
  user.printifyShopId = null;
  user.printifyConnected = false;
  user.printifyStoreUrl = null;
  user.printifyProducts = null;
  user.printifyOrders = null;
  user.selectedProducts = [];
  user.printifyStoreName = null;

  // Save the changes
  await user.save();

console.log(`✅ User ${user._id} disconnected from Printify`);

    return NextResponse.json({ 
      success: true,
      message: 'Successfully disconnected from Printify'
    });

  } catch (error) {
    console.error('❌ Disconnect error:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect from Printify' 
    }, { status: 500 });
  }
}
// app/api/printify-connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, storeUrl } = body;

    console.log('✅ API called with:', { userId, storeUrl });

    if (!userId || !storeUrl) {
      return NextResponse.json({ error: 'Missing userId or storeUrl' }, { status: 400 });
    }

    // Extract shop ID from URL
    const shopId = extractShopIdFromUrl(storeUrl);
    const shopName = extractShopNameFromUrl(storeUrl);
    if (!shopId) {
      return NextResponse.json({ 
        error: 'Invalid store URL format. Please use format: yourstore.printify.me' 
      }, { status: 400 });
    }
    
   // Save shop ID to user database
    await User.findByIdAndUpdate(userId, {
      printifyShopId: shopId,
      printifyStoreName: shopName,
      printifyStoreUrl: storeUrl,
      printifyConnected: true
    });

    console.log(`✅ Extracted shop ID: "${shopId}"`);

    // For now, just return success (we'll add database saving later)
    return NextResponse.json({ 
      success: true, 
      shopId: shopId,
      shopName: `Store ${shopId}`
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ 
      error: 'Failed to connect store' 
    }, { status: 500 });
  }
}

function extractShopNameFromUrl(url: string): string | null {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const urlObj = new URL(cleanUrl);

    // For printify.me, use the subdomain as the shop name
    if (urlObj.hostname.includes('printify.me')) {
      return urlObj.hostname.split('.')[0];
    }

    // For printify.com/shop/{shopId}, use the last part as the shop name
    if (urlObj.hostname.includes('printify.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const shopIndex = pathParts.indexOf('shop');
      if (shopIndex !== -1 && pathParts[shopIndex + 1]) {
        return pathParts[shopIndex + 1];
      }
    }

    // If it's just a shop name without URL formatting
    if (!url.includes('.') && !url.includes('/')) {
      return url;
    }

    return null;
  } catch (error) {
    console.error('URL parsing error:', error);
    return null;
  }
}

function extractShopIdFromUrl(url: string): string | null {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const urlObj = new URL(cleanUrl);
    
    if (urlObj.hostname.includes('printify.me')) {
      const subdomain = urlObj.hostname.split('.')[0];
      return subdomain;
    }
    
    if (urlObj.hostname.includes('printify.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const shopIndex = pathParts.indexOf('shop');
      if (shopIndex !== -1 && pathParts[shopIndex + 1]) {
        return pathParts[shopIndex + 1];
      }
    }
    
    // If it's just a shop name without URL formatting
    if (!url.includes('.') && !url.includes('/')) {
      return url;
    }
    
    return null;
  } catch (error) {
    console.error('URL parsing error:', error);
    return null;
  }
}
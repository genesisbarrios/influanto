// app/api/printify/products/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    console.log('🔍 Products API called for userId:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!PRINTIFY_API_KEY) {
      console.error('❌ PRINTIFY_API_KEY not configured');
      return NextResponse.json({ error: 'Printify API not configured' }, { status: 500 });
    }

    // First, get all available shops
    console.log('🔍 Fetching available shops...');
    const shopsResponse = await fetch('https://api.printify.com/v1/shops.json', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!shopsResponse.ok) {
      console.error('❌ Shops API error:', shopsResponse.status, await shopsResponse.text());
      return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
    }

    const shopsData = await shopsResponse.json();
    console.log('✅ Available shops:', shopsData);

    // Use the shop ID stored in the user document, or fallback to the first shop if not set
    if (!shopsData || shopsData.length === 0) {
      return NextResponse.json({ error: 'No Printify shops found' }, { status: 404 });
    }

    await connectMongo();
    const user = await User.findById(userId);

    let shopId: string;
    let shop: any;

    if (user && user.printifyShopId) {
      shopId = user.printifyShopId;
      shop = shopsData.find((s: any) => s.id.toString() === shopId);
      if (!shop) {
        return NextResponse.json({ error: 'Shop ID not found in Printify shops' }, { status: 404 });
      }
    } else {
      shop = shopsData[0];
      shopId = shop.id.toString();
      // Optionally update the user with the shopId if not set
      if (user) {
        await User.findByIdAndUpdate(userId, { printifyShopId: shopId });
      }
    }

    console.log('🏪 Using shop ID:', shopId, 'Title:', shop.title);

    // Now try to fetch products
    console.log('📦 Fetching products...');
    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!printifyResponse.ok) {
      console.error('❌ Printify products API error:', printifyResponse.status, printifyResponse.statusText);
      const errorText = await printifyResponse.text();
      console.error('❌ Error details:', errorText);
      
      // If no products found, return empty array instead of error
      if (printifyResponse.status === 404) {
        console.log('📦 No products found in shop, returning empty array');
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ 
        error: `Printify API error: ${printifyResponse.status}` 
      }, { status: printifyResponse.status });
    }

    const printifyData = await printifyResponse.json();
    console.log('📦 Raw Printify response:', printifyData);

    // Check if there's data
    if (!printifyData.data || printifyData.data.length === 0) {
      console.log('📦 No products in shop');
      return NextResponse.json([]);
    }

    // Transform Printify data to our format
    const products = printifyData.data.map((product: any) => ({
      id: product.id.toString(),
      title: product.title,
      description: product.description || '',
      images: product.images ? product.images.map((img: any) => img.src) : [],
      variants: product.variants ? product.variants.map((variant: any) => ({
        id: variant.id.toString(),
        price: variant.price ? (variant.price / 100).toFixed(2) : '0.00',
        title: variant.title || '',
        sku: variant.sku || '',
        available: variant.available || false,
      })) : [],
      tags: product.tags || [],
      visible: product.visible || false,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));

    console.log('✅ Transformed products:', products.length);
    console.log('📋 Sample product:', products[0]);

    return NextResponse.json(products);

  } catch (error) {
    console.error('❌ Products API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products from Printify' 
    }, { status: 500 });
  }
}
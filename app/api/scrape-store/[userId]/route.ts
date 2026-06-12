import { NextRequest, NextResponse } from 'next/server';
import supabase from "@/libs/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const { data: user } = await supabase
      .from("users")
      .select("printify_store_url")
      .eq("id", userId)
      .single();

    if (!user?.printify_store_url) {
      return NextResponse.json({ error: 'No store URL found' }, { status: 404 });
    }

    console.log('🔍 Scraping store:', user.printify_store_url);

    // Fetch the public storefront
    const storeResponse = await fetch(user.printify_store_url);
    
    if (!storeResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
    }

    const html = await storeResponse.text();
    
    // Extract product data from the HTML (Printify stores have JSON data embedded)
    const productDataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
    
    if (productDataMatch) {
      const storeData = JSON.parse(productDataMatch[1]);
      const products = storeData.products?.items || [];
      
      // Transform to your format
      const transformedProducts = products.map((product: any) => ({
        id: product.id.toString(),
        title: product.title,
        description: product.description || '',
        images: product.images || [],
        variants: product.variants?.map((variant: any) => ({
          id: variant.id.toString(),
          price: (variant.price / 100).toFixed(2),
          title: variant.title,
          sku: variant.sku,
          available: variant.available,
        })) || [],
        tags: product.tags || [],
        visible: true,
        created_at: product.created_at,
        updated_at: product.updated_at,
      }));

      return NextResponse.json(transformedProducts);
    }

    // // Fallback: Return mock data
    // return NextResponse.json([
    //   {
    //     id: '1',
    //     title: 'Custom Product',
    //     description: 'Product from user store',
    //     images: ['https://via.placeholder.com/300x300/ff6b6b/ffffff?text=Store+Product'],
    //     variants: [
    //       { id: '1', price: '25.99', title: 'Default', sku: 'STORE-001', available: true }
    //     ],
    //     tags: ['user-store'],
    //     visible: true,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString()
    //   }
    // ]);

  } catch (error) {
    console.error('❌ Store scraping error:', error);
    return NextResponse.json({ error: 'Failed to fetch store products' }, { status: 500 });
  }
}
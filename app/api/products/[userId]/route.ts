import { NextRequest, NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

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

    await connectMongo();
    const user = await User.findById(userId);
    
    if (!user?.printifyStoreUrl) {
      return NextResponse.json({ error: 'No store URL found for user' }, { status: 404 });
    }

    console.log('🔍 Scraping user store:', user.printifyStoreUrl);

    // Helper function to fix image URLs
    const fixImageUrl = (imageSrc: string | undefined, storeUrl: string): string => {
      console.log(`🔧 fixImageUrl called with: "${imageSrc}"`);
      
      if (!imageSrc) {
        console.log(`❌ No image source provided, using fallback`);
        return 'https://images.pexels.com/photos/3807781/pexels-photo-3807781.jpeg';
      }

      // If already a full URL, return as is
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        console.log(`✅ Already full URL: ${imageSrc}`);
        return imageSrc;
      }

      // Handle protocol-relative URLs
      if (imageSrc.startsWith('//')) {
        const result = 'https:' + imageSrc;
        console.log(`🔧 Protocol-relative URL: ${imageSrc} -> ${result}`);
        return result;
      }

      // Handle relative URLs
      if (imageSrc.startsWith('/')) {
        try {
          const baseUrl = new URL(storeUrl);
          const result = baseUrl.origin + imageSrc;
          console.log(`🔧 Relative URL: ${imageSrc} -> ${result}`);
          return result;
        } catch (error) {
          console.error('❌ Error parsing base URL:', error);
          return 'https://images.pexels.com/photos/3807781/pexels-photo-3807781.jpeg';
        }
      }

      // If it's just a filename or relative path
      try {
        const baseUrl = new URL(storeUrl);
        const result = baseUrl.origin + '/' + imageSrc;
        console.log(`🔧 Filename URL: ${imageSrc} -> ${result}`);
        return result;
      } catch (error) {
        console.error('❌ Error creating URL:', error);
        return 'https://images.pexels.com/photos/3807781/pexels-photo-3807781.jpeg';
      }
    };

    // Fetch the public storefront
    const storeResponse = await fetch(user.printifyStoreUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!storeResponse.ok) {
      console.error('❌ Failed to fetch store:', storeResponse.status);
      return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
    }

    const html = await storeResponse.text();
    console.log('✅ Store HTML fetched, length:', html.length);

    // DEBUG: Let's see what we're working with
    console.log('🔍 DEBUG: Searching for any img tags in entire HTML...');
    const allImgsInHtml = html.match(/<img[^>]*>/gi) || [];
    console.log(`🖼️ Total img tags found in entire HTML: ${allImgsInHtml.length}`);

    if (allImgsInHtml.length > 0) {
      console.log('🔍 First 3 img tags from entire HTML:');
      allImgsInHtml.slice(0, 3).forEach((img, idx) => {
        // Decode HTML entities for easier reading
        const decoded = img
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        console.log(`  ${idx + 1}. ${decoded}`);
      });
    }

    // DEBUG: Let's also look for Printify CDN URLs directly in the HTML
    console.log('🔍 DEBUG: Looking for Printify CDN URLs in entire HTML...');
    const printifyImages = [...html.matchAll(/(https:\/\/images-api\.printify\.com\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s"'<>]*)?)/gi)];
    console.log(`🖼️ Found ${printifyImages.length} Printify CDN URLs in HTML`);
    if (printifyImages.length > 0) {
      console.log('First few Printify URLs:');
      printifyImages.slice(0, 3).forEach((match, idx) => {
        console.log(`  ${idx + 1}. ${match[1]}`);
      });
    }

    // Simplified approach - find images first, then build products
    const parseProductsFromHTML = () => {
      const products: any[] = [];
      
      console.log('🔍 Starting simplified image-first approach...');
      
      // First, let's find ALL Printify CDN images in the entire HTML
      console.log('🔍 Searching for Printify CDN images in entire HTML...');
      
      // Decode HTML entities in the entire HTML first
      const decodedHtml = html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      // Look for Printify CDN URLs
      const printifyImagePattern = /(https:\/\/images-api\.printify\.com\/[^\s"'<>(){}[\]]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"'<>(){}[\]]*)?)/gi;
      const allPrintifyImages = [...decodedHtml.matchAll(printifyImagePattern)];
      
      console.log(`🖼️ Found ${allPrintifyImages.length} Printify CDN images in entire HTML`);
      
      if (allPrintifyImages.length === 0) {
        console.log('❌ No Printify CDN images found, trying any image URLs...');
        
        // Fallback: look for ANY image URLs
        const anyImagePattern = /(https?:\/\/[^\s"'<>(){}[\]]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"'<>(){}[\]]*)?)/gi;
        const allImages = [...decodedHtml.matchAll(anyImagePattern)];
        console.log(`🖼️ Found ${allImages.length} total image URLs in HTML`);
        
        if (allImages.length === 0) {
          console.log('❌ No images found at all in HTML');
          return [];
        }
        
        // Use the first few non-logo images
        const validImages = allImages
          .map(match => match[1])
          .filter(url => 
            !url.includes('logo') && 
            !url.includes('icon') && 
            !url.includes('favicon') &&
            url.length > 20
          )
          .slice(0, 50);
        
        console.log(`🖼️ Using ${validImages.length} valid images:`, validImages);
        
        validImages.forEach((imageUrl, index) => {
          const product = {
            id: (index + 1).toString(),
            title: `Product ${index + 1}`,
            description: `Product from ${user.printifyStoreUrl}`,
            images: [imageUrl],
            variants: [{
              id: '1',
              price: '25.99',
              title: 'Default',
              sku: `IMG-${index + 1}`,
              available: true,
            }],
            tags: ['image-scraped'],
            visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log(`➕ Adding product: "${product.title}" with image: ${imageUrl}`);
          products.push(product);
        });
        
        return products;
      }
      
      // Process each Printify image
      allPrintifyImages.forEach((imageMatch, index) => {
        const imageUrl = imageMatch[1];
        const imageIndex = imageMatch.index || 0;
        
        console.log(`🔍 Processing Printify image ${index + 1}: ${imageUrl}`);
        
        // Get context around this image to find title/price
        const contextStart = Math.max(0, imageIndex - 1000);
        const contextEnd = Math.min(decodedHtml.length, imageIndex + 1000);
        const context = decodedHtml.slice(contextStart, contextEnd);
        
        // Try to find a product title in this context
        const titlePatterns = [
          /title="([^"]{5,80})"/i,
          /alt="([^"]{5,80})"/i,
          /<h[1-6][^>]*>([^<]{5,80})<\/h[1-6]>/i,
          /class="[^"]*title[^"]*"[^>]*>([^<]{5,80})</i,
          /class="[^"]*name[^"]*"[^>]*>([^<]{5,80})</i
        ];
        
        let title = '';
        for (const pattern of titlePatterns) {
          const titleMatch = context.match(pattern);
          if (titleMatch && titleMatch[1]) {
            const potentialTitle = titleMatch[1].trim();
            // Filter out generic text
            if (!potentialTitle.toLowerCase().includes('image') &&
                !potentialTitle.toLowerCase().includes('loading') &&
                !potentialTitle.toLowerCase().includes('error') &&
                potentialTitle.length > 5 && 
                potentialTitle.length < 80) {
              title = potentialTitle;
              break;
            }
          }
        }
        
        // If no good title found, extract from image URL
        if (!title) {
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          title = filename
            .replace(/\.(jpg|jpeg|png|gif|webp|svg).*$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .substring(0, 50) || `Product ${index + 1}`;
        }
        
        // Try to find price in context
        let price = '25.99';
        const pricePatterns = [
          /\$(\d+\.?\d{0,2})/,
          /(\d+\.?\d{0,2})\s*USD/i,
          /price[^>]*>.*?\$(\d+\.?\d{0,2})/i
        ];
        
        for (const pattern of pricePatterns) {
          const priceMatch = context.match(pattern);
          if (priceMatch && priceMatch[1]) {
            const foundPrice = parseFloat(priceMatch[1]);
            if (foundPrice > 0 && foundPrice < 1000) {
              price = foundPrice.toFixed(2);
              break;
            }
          }
        }
        
        const product = {
          id: (index + 1).toString(),
          title: title,
          description: `Product from ${user.printifyStoreUrl}`,
          images: [imageUrl],
          variants: [{
            id: '1',
            price: price,
            title: 'Default',
            sku: `PRINTIFY-${index + 1}`,
            available: true,
          }],
          tags: ['printify-scraped'],
          visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log(`➕ Adding product: "${title}" with image: ${imageUrl}`);
        products.push(product);
      });
      
      console.log(`📦 Total products created from images: ${products.length}`);
      return products.slice(0, 50); // Limit to 50 products
    };

    const htmlProducts = parseProductsFromHTML();
    if (htmlProducts.length > 0) {
      console.log('✅ Scraped products from image-first approach:', htmlProducts.length);
      return NextResponse.json(htmlProducts);
    }

    // If still no products found, return empty array
    console.log('📦 No products found via image-first scraping');
    return NextResponse.json([]);

  } catch (error) {
    console.error('❌ Store scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape store products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
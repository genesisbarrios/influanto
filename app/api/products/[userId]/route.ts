import { NextRequest, NextResponse } from 'next/server';
import supabase, { mapUser } from "@/libs/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    //console.log('🔍 Products API called for userId:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: userRow } = await supabase.from("users").select().eq("id", userId).single();
    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = mapUser(userRow)!;

    // First, try to get products from Printify API if user has access
    if (user.printifyAccessToken && user.printifyShopId) {
      //console.log('🔍 Fetching products from Printify API...');
      try {
        const printifyResponse = await fetch(`https://api.printify.com/v1/shops/${user.printifyShopId}/products.json`, {
          headers: {
            'Authorization': `Bearer ${user.printifyAccessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (printifyResponse.ok) {
          const printifyData = await printifyResponse.json();
          //console.log('✅ Printify API products fetched:', printifyData.data?.length || 0);

          // Transform the data to include the actual URLs
          const productsWithUrls = printifyData.data?.map((product: any) => {
            // Construct the actual Printify shop URL
            let productUrl = '#';
            
            if (user.printifyShopUrl) {
              // If user has custom shop URL
              productUrl = `${user.printifyShopUrl}/products/${product.id}`;
            } else if (user.printifyStoreUrl) {
              // If user has store URL, use that
              productUrl = `${user.printifyStoreUrl}/products/${product.id}`;
            } else {
              // Default Printify shop URL pattern
              productUrl = `https://${user.printifyShopId}.printify.me/products/${product.id}`;
            }

            return {
              id: product.id,
              title: product.title,
              description: product.description,
              images: product.images?.map((img: any) => img.src) || [],
              variants: product.variants?.map((variant: any) => ({
                id: variant.id,
                price: (variant.price / 100).toFixed(2), // Convert cents to dollars
                title: variant.title
              })) || [],
              url: productUrl, // The actual shop URL
              printifyId: product.id,
              tags: product.tags || [],
              visible: product.visible,
              created_at: product.created_at
            };
          }) || [];

          if (productsWithUrls.length > 0) {
           // console.log('✅ Returning Printify API products with URLs');
            return NextResponse.json(productsWithUrls);
          }
        } else {
          console.log('❌ Printify API failed, falling back to scraping...');
        }
      } catch (printifyError) {
        console.error('❌ Printify API error, falling back to scraping:', printifyError);
      }
    }

    // Fallback to scraping if no Printify API access or if it failed
    if (!user.printifyStoreUrl) {
      return NextResponse.json({ error: 'No store URL found for user' }, { status: 404 });
    }

    //console.log('🔍 Falling back to scraping user store:', user.printifyStoreUrl);

    // Helper function to fix image URLs
    const fixImageUrl = (imageSrc: string | undefined, storeUrl: string): string => {
      //console.log(`🔧 fixImageUrl called with: "${imageSrc}"`);
      
      if (!imageSrc) {
        //console.log(`❌ No image source provided, using fallback`);
        return 'https://images.pexels.com/photos/3807781/pexels-photo-3807781.jpeg';
      }

      // If already a full URL, return as is
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        //console.log(`✅ Already full URL: ${imageSrc}`);
        return imageSrc;
      }

      // Handle protocol-relative URLs
      if (imageSrc.startsWith('//')) {
        const result = 'https:' + imageSrc;
        //console.log(`🔧 Protocol-relative URL: ${imageSrc} -> ${result}`);
        return result;
      }

      // Handle relative URLs
      if (imageSrc.startsWith('/')) {
        try {
          const baseUrl = new URL(storeUrl);
          const result = baseUrl.origin + imageSrc;
          //console.log(`🔧 Relative URL: ${imageSrc} -> ${result}`);
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
        //console.log(`🔧 Filename URL: ${imageSrc} -> ${result}`);
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
      //console.error('❌ Failed to fetch store:', storeResponse.status);
      return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
    }

    const html = await storeResponse.text();
    //console.log('✅ Store HTML fetched, length:', html.length);

    // Simplified approach - find images first, then build products
    // Replace the parseProductsFromHTML function with this updated version:

  const parseProductsFromHTML = () => {
    const products: any[] = [];
    
    //console.log('🔍 Starting URL extraction approach...');
    
    // Decode HTML entities in the entire HTML first
    const decodedHtml = html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Look for product links first - these are the actual URLs we need
    const productLinkPatterns = [
      // Common product link patterns for Printify stores
      /href="([^"]*\/products\/[^"]+)"/gi,
      /href="([^"]*\/product\/[^"]+)"/gi,
      /href="([^"]*\/p\/[^"]+)"/gi,
      /href="([^"]*\/shop\/[^"]+)"/gi,
      // More general product page patterns
      /href="([^"]*product[^"]*\d+[^"]*)"/gi,
      /href="([^"]*item[^"]*\d+[^"]*)"/gi,
    ];
    
    const allProductLinks = new Set<string>();
    
    // Extract all potential product URLs
    productLinkPatterns.forEach(pattern => {
      const matches = [...decodedHtml.matchAll(pattern)];
      matches.forEach(match => {
        let url = match[1];
        
        // Convert relative URLs to absolute
        if (url.startsWith('/')) {
          const baseUrl = new URL(user.printifyStoreUrl);
          url = baseUrl.origin + url;
        } else if (!url.startsWith('http')) {
          url = user.printifyStoreUrl + '/' + url;
        }
        
        // Filter out obviously non-product URLs
        if (!url.includes('cart') && 
            !url.includes('login') && 
            !url.includes('account') &&
            !url.includes('contact') &&
            !url.includes('about') &&
            !url.includes('policy') &&
            !url.includes('#') &&
            url.length > 10) {
          allProductLinks.add(url);
        }
      });
    });
    
   // console.log(`🔗 Found ${allProductLinks.size} potential product URLs`);
    
    if (allProductLinks.size === 0) {
     // console.log('❌ No product URLs found, trying to find product sections...');
      
      // Fallback: Look for sections that might contain products
      const productSectionPatterns = [
        /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/gis,
        /<article[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/article>/gis,
        /<section[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/section>/gis,
      ];
      
      productSectionPatterns.forEach(pattern => {
        const matches = [...decodedHtml.matchAll(pattern)];
        matches.forEach((match, index) => {
          const sectionHtml = match[1];
          
          // Look for links within this product section
          const linkMatches = [...sectionHtml.matchAll(/href="([^"]+)"/gi)];
          linkMatches.forEach(linkMatch => {
            let url = linkMatch[1];
            
            if (url.startsWith('/')) {
              const baseUrl = new URL(user.printifyStoreUrl);
              url = baseUrl.origin + url;
            } else if (!url.startsWith('http')) {
              url = user.printifyStoreUrl + '/' + url;
            }
            
            if (url.length > 10 && !url.includes('#')) {
              allProductLinks.add(url);
            }
          });
        });
      });
    }
    
    //console.log(`🔗 Total unique product URLs after fallback: ${allProductLinks.size}`);
    
    // Now find images and match them with URLs
    const printifyImagePattern = /(https:\/\/images-api\.printify\.com\/[^\s"'<>(){}[\]]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"'<>(){}[\]]*)?)/gi;
    const allPrintifyImages = [...decodedHtml.matchAll(printifyImagePattern)];
    
    //console.log(`🖼️ Found ${allPrintifyImages.length} Printify CDN images`);
    
    // Convert URLs to array for easier processing
    const productUrlsArray = Array.from(allProductLinks);
    
    if (allPrintifyImages.length > 0) {
      // Process Printify images and try to match them with URLs
      allPrintifyImages.forEach((imageMatch, index) => {
        const imageUrl = imageMatch[1];
        const imageIndex = imageMatch.index || 0;
        
        //console.log(`🔍 Processing Printify image ${index + 1}: ${imageUrl.substring(0, 100)}...`);
        
        // Get context around this image to find the associated link
        const contextStart = Math.max(0, imageIndex - 2000);
        const contextEnd = Math.min(decodedHtml.length, imageIndex + 2000);
        const context = decodedHtml.slice(contextStart, contextEnd);
        
        // Look for the closest product URL in the context
        let productUrl = '';
        const contextLinks = [...context.matchAll(/href="([^"]+)"/gi)];
        
        for (const linkMatch of contextLinks) {
          let url = linkMatch[1];
          
          if (url.startsWith('/')) {
            const baseUrl = new URL(user.printifyStoreUrl);
            url = baseUrl.origin + url;
          } else if (!url.startsWith('http')) {
            url = user.printifyStoreUrl + '/' + url;
          }
          
          // Check if this URL looks like a product URL
          if ((url.includes('/product') || url.includes('/p/') || url.includes('/item')) &&
              !url.includes('cart') && !url.includes('login')) {
            productUrl = url;
            break;
          }
        }
        
        // If no specific product URL found in context, use from our collected URLs
        if (!productUrl && productUrlsArray.length > index) {
          productUrl = productUrlsArray[index];
        }
        
        // Extract title from context
        const titlePatterns = [
          /title="([^"]{5,80})"/i,
          /alt="([^"]{5,80})"/i,
          /<h[1-6][^>]*>([^<]{5,80})<\/h[1-6]>/i,
          /class="[^"]*title[^"]*"[^>]*>([^<]{5,80})</i,
          /class="[^"]*name[^"]*"[^>]*>([^<]{5,80})</i,
          /"title":"([^"]{5,80})"/i,
          /"name":"([^"]{5,80})"/i
        ];
        
        let title = '';
        for (const pattern of titlePatterns) {
          const titleMatch = context.match(pattern);
          if (titleMatch && titleMatch[1]) {
            const potentialTitle = titleMatch[1].trim();
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
        
        if (!title) {
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          title = filename
            .replace(/\.(jpg|jpeg|png|gif|webp|svg).*$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .substring(0, 50) || `Product ${index + 1}`;
        }
        
        // Extract price
        let price = '25.99';
        const pricePatterns = [
          /\$(\d+\.?\d{0,2})/,
          /(\d+\.?\d{0,2})\s*USD/i,
          /price[^>]*>.*?\$(\d+\.?\d{0,2})/i,
          /"price":"?\$?(\d+\.?\d{0,2})"?/i,
          /"amount":"?(\d+\.?\d{0,2})"?/i
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
          url: productUrl || user.printifyStoreUrl, // Use the actual extracted URL
          tags: ['printify-scraped'],
          visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        //console.log(`➕ Adding product: "${title}" with URL: ${productUrl || 'fallback URL'}`);
        products.push(product);
      });
    } else {
      // No Printify images, just create products from URLs
      //console.log('❌ No Printify images found, creating products from URLs only');
      
      productUrlsArray.slice(0, 20).forEach((url, index) => {
        const product = {
          id: (index + 1).toString(),
          title: `Product ${index + 1}`,
          description: `Product from ${user.printifyStoreUrl}`,
          images: ['https://via.placeholder.com/300x300/4ecdc4/ffffff?text=Product'],
          variants: [{
            id: '1',
            price: '25.99',
            title: 'Default',
            sku: `URL-${index + 1}`,
            available: true,
          }],
          url: url, // Use the actual extracted URL
          tags: ['url-only'],
          visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        //console.log(`➕ Adding URL-only product: "${product.title}" with URL: ${url}`);
        products.push(product);
      });
    }

    //console.log(`📦 Total products created: ${products.length}`);
    return products.slice(0, 50); // Limit to 50 products
  };

    const htmlProducts = parseProductsFromHTML();
    if (htmlProducts.length > 0) {
      //console.log('✅ Scraped products from image-first approach:', htmlProducts.length);
      return NextResponse.json(htmlProducts);
    }

    // If still no products found, return empty array
    //console.log('📦 No products found via scraping');
    return NextResponse.json([]);

  } catch (error) {
    //console.error('❌ Store scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
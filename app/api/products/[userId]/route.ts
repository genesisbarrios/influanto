// Replace your entire route.ts file with this fixed version:
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
      if (!imageSrc) {
        return 'https://via.placeholder.com/300x300/4ecdc4/ffffff?text=No+Image';
      }

      // If already a full URL, return as is
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        return imageSrc;
      }

      // Handle protocol-relative URLs
      if (imageSrc.startsWith('//')) {
        return 'https:' + imageSrc;
      }

      // Handle relative URLs
      if (imageSrc.startsWith('/')) {
        try {
          const baseUrl = new URL(storeUrl);
          return baseUrl.origin + imageSrc;
        } catch (error) {
          console.error('Error parsing base URL:', error);
          return 'https://via.placeholder.com/300x300/4ecdc4/ffffff?text=Invalid+URL';
        }
      }

      // If it's just a filename or relative path
      try {
        const baseUrl = new URL(storeUrl);
        return baseUrl.origin + '/' + imageSrc;
      } catch (error) {
        return 'https://via.placeholder.com/300x300/4ecdc4/ffffff?text=Invalid+Image';
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

    // Method 1: Try to extract from window.__INITIAL_STATE__
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
    
    if (initialStateMatch) {
      try {
        const storeData = JSON.parse(initialStateMatch[1]);
        console.log('✅ Found __INITIAL_STATE__');
        
        const products = storeData.products?.items || storeData.store?.products || [];
        
        if (products.length > 0) {
          const transformedProducts = products.map((product: any) => {
            // Fix images array
            let productImages: string[] = [];
            
            if (product.images && Array.isArray(product.images)) {
              productImages = product.images
                .map((img: any) => {
                  if (typeof img === 'string') {
                    return fixImageUrl(img, user.printifyStoreUrl);
                  } else if (img?.src) {
                    return fixImageUrl(img.src, user.printifyStoreUrl);
                  } else if (img?.url) {
                    return fixImageUrl(img.url, user.printifyStoreUrl);
                  }
                  return null;
                })
                .filter(Boolean);
            } else if (product.image) {
              productImages = [fixImageUrl(product.image, user.printifyStoreUrl)];
            }

            // If no images found, use placeholder
            if (productImages.length === 0) {
              productImages = ['https://via.placeholder.com/300x300/ff6b6b/ffffff?text=' + encodeURIComponent(product.title || 'Product')];
            }

            return {
              id: product.id?.toString() || Math.random().toString(),
              title: product.title || product.name || 'Untitled Product',
              description: product.description || '',
              images: productImages,
              variants: product.variants?.map((variant: any) => ({
                id: variant.id?.toString() || Math.random().toString(),
                price: variant.price ? (variant.price / 100).toFixed(2) : '25.99',
                title: variant.title || 'Default',
                sku: variant.sku || '',
                available: variant.available !== false,
              })) || [{
                id: '1',
                price: '25.99',
                title: 'Default',
                sku: 'DEFAULT',
                available: true,
              }],
              tags: product.tags || [],
              visible: true,
              created_at: product.created_at || new Date().toISOString(),
              updated_at: product.updated_at || new Date().toISOString(),
            };
          });

          console.log('✅ Scraped products from __INITIAL_STATE__:', transformedProducts.length);
          return NextResponse.json(transformedProducts);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse __INITIAL_STATE__:', parseError);
      }
    }

    // Method 2: Try to extract from script tags with JSON data
    const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
    
    for (const scriptMatch of scriptMatches) {
      const scriptContent = scriptMatch.replace(/<\/?script[^>]*>/g, '');
      
      // Look for product data patterns
      const productDataMatch = scriptContent.match(/products["\']?\s*:\s*(\[.*?\])/s) ||
                              scriptContent.match(/"products":\s*(\[.*?\])/s) ||
                              scriptContent.match(/window\.products\s*=\s*(\[.*?\])/s);
      
      if (productDataMatch) {
        try {
          const products = JSON.parse(productDataMatch[1]);
          
          if (products.length > 0) {
            const transformedProducts = products.map((product: any, index: number) => {
              // Fix images for script method
              let productImages: string[] = [];
              
              if (product.images && Array.isArray(product.images)) {
                productImages = product.images
                  .map((img: any) => fixImageUrl(typeof img === 'string' ? img : img?.src || img?.url, user.printifyStoreUrl))
                  .filter(Boolean);
              } else if (product.image) {
                productImages = [fixImageUrl(product.image, user.printifyStoreUrl)];
              }

              // If no images found, use placeholder with product title
              if (productImages.length === 0) {
                const title = product.title || product.name || `Item ${index + 1}`;
                productImages = [`https://via.placeholder.com/300x300/4ecdc4/ffffff?text=${encodeURIComponent(title)}`];
              }

              return {
                id: product.id?.toString() || (index + 1).toString(),
                title: product.title || product.name || '',
                description: product.description || '',
                images: productImages,
                variants: [{
                  id: '1',
                  price: product.price ? (product.price / 100).toFixed(2) : '25.99',
                  title: 'Default',
                  sku: product.sku || `PROD-${index + 1}`,
                  available: true,
                }],
                tags: product.tags || ['scraped'],
                visible: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            })
            .filter((product: any) => product.title && product.title.trim().length > 0);

            console.log('✅ Scraped products from script tags:', transformedProducts.length);
            
            if (transformedProducts.length > 0) {
              return NextResponse.json(transformedProducts);
            }
          }
        } catch (parseError) {
          console.error('❌ Failed to parse script products:', parseError);
        }
      }
    }

    // Method 3: Basic HTML parsing
    const parseProductsFromHTML = () => {
      const products: any[] = [];
      
      // Look for product containers with more specific patterns
      const productPatterns = [
        /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/gis,
        /<article[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/article>/gis,
        /<li[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/li>/gis
      ];
      
      let allMatches: RegExpMatchArray[] = [];
      
      productPatterns.forEach(pattern => {
        const matches = Array.from(html.matchAll(pattern));
        allMatches = allMatches.concat(matches);
      });
      
      allMatches.forEach((match, index) => {
        const productHtml = match[1];
        
        // Extract title with better patterns
        const titlePatterns = [
          /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i,
          /class="[^"]*title[^"]*"[^>]*>(.*?)<\/[^>]+>/i,
          /class="[^"]*name[^"]*"[^>]*>(.*?)<\/[^>]+>/i,
          /<a[^>]*title="([^"]*)"[^>]*>/i
        ];
        
        let title = '';
        for (const pattern of titlePatterns) {
          const titleMatch = productHtml.match(pattern);
          if (titleMatch) {
            title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
            if (title && title.length > 2 && !title.toLowerCase().includes('product')) {
              break;
            }
            title = '';
          }
        }
        
        // Skip if no real title found
        if (!title || title.length < 3) {
          return;
        }
        
        // Extract price with better patterns
        const pricePatterns = [
          /\$(\d+\.?\d*)/,
          /price[^>]*>.*?\$(\d+\.?\d*)/i,
          /(\d+\.?\d*)\s*USD/i
        ];
        
        let price = '25.99';
        for (const pattern of pricePatterns) {
          const priceMatch = productHtml.match(pattern);
          if (priceMatch) {
            price = priceMatch[1];
            break;
          }
        }
        
        // Extract image with multiple patterns
        const imagePatterns = [
          /<img[^>]*src=["']([^"']+)["'][^>]*>/i,
          /<img[^>]*data-src=["']([^"']+)["'][^>]*>/i,
          /background-image:\s*url\(['"]?([^'"]+)['"]?\)/i
        ];
        
        let imageSrc = '';
        for (const pattern of imagePatterns) {
          const imageMatch = productHtml.match(pattern);
          if (imageMatch && imageMatch[1]) {
            imageSrc = imageMatch[1];
            break;
          }
        }
        
        const image = imageSrc ? 
          fixImageUrl(imageSrc, user.printifyStoreUrl) : 
          `https://via.placeholder.com/300x300/45b7d1/ffffff?text=${encodeURIComponent(title)}`;
        
        products.push({
          id: (index + 1).toString(),
          title: title,
          description: `Product from ${user.printifyStoreUrl}`,
          images: [image],
          variants: [{
            id: '1',
            price: price,
            title: 'Default',
            sku: `HTML-${index + 1}`,
            available: true,
          }],
          tags: ['html-scraped'],
          visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
      
      return products.slice(0, 10); // Limit to first 10 products
    };

    const htmlProducts = parseProductsFromHTML();
    if (htmlProducts.length > 0) {
      console.log('✅ Scraped products from HTML patterns:', htmlProducts.length);
      return NextResponse.json(htmlProducts);
    }

    // If still no products found, return empty array
    console.log('📦 No products found via scraping');
    return NextResponse.json([]);

  } catch (error) {
    console.error('❌ Store scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape store products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
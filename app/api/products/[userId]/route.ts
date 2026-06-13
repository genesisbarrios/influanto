import { NextRequest, NextResponse } from 'next/server';
import supabase, { mapUser } from "@/libs/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const { data: userRow } = await supabase.from("users").select().eq("id", userId).single();
    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = mapUser(userRow)!;

    // First, try to get products from Printify API if user has access
    if (user.printifyAccessToken && user.printifyShopId) {
      try {
        const printifyResponse = await fetch(
          `https://api.printify.com/v1/shops/${user.printifyShopId}/products.json?page=${page}&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${user.printifyAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (printifyResponse.ok) {
          const printifyData = await printifyResponse.json();
          const pageProducts: any[] = Array.isArray(printifyData.data) ? printifyData.data : [];
          const lastPage: number = printifyData.last_page ?? 1;

          if (pageProducts.length > 0) {
            const productsWithUrls = pageProducts.map((product: any) => {
              let productUrl = '#';
              if (user.printifyShopUrl) {
                productUrl = `${user.printifyShopUrl}/products/${product.id}`;
              } else if (user.printifyStoreUrl) {
                productUrl = `${user.printifyStoreUrl}/products/${product.id}`;
              } else {
                productUrl = `https://${user.printifyShopId}.printify.me/products/${product.id}`;
              }

              return {
                id: product.id,
                title: product.title,
                description: product.description,
                images: product.images?.map((img: any) => img.src) || [],
                variants: product.variants?.map((variant: any) => ({
                  id: variant.id,
                  price: (variant.price / 100).toFixed(2),
                  title: variant.title
                })) || [],
                url: productUrl,
                printifyId: product.id,
                tags: product.tags || [],
                visible: product.visible,
                created_at: product.created_at
              };
            });

            return NextResponse.json({
              products: productsWithUrls,
              page,
              hasMore: page < lastPage,
            });
          }
        }
      } catch (printifyError) {
        console.error('Printify API error, falling back to scraping:', printifyError);
      }
    }

    // Fallback to scraping if no Printify API access or if it failed
    if (!user.printifyStoreUrl) {
      return NextResponse.json({ error: 'No store URL found for user' }, { status: 404 });
    }

    const storeResponse = await fetch(user.printifyStoreUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!storeResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
    }

    const html = await storeResponse.text();

    const parseProductsFromHTML = () => {
      const products: any[] = [];

      const decodedHtml = html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      const productLinkPatterns = [
        /href="([^"]*\/products\/[^"]+)"/gi,
        /href="([^"]*\/product\/[^"]+)"/gi,
        /href="([^"]*\/p\/[^"]+)"/gi,
        /href="([^"]*\/shop\/[^"]+)"/gi,
        /href="([^"]*product[^"]*\d+[^"]*)"/gi,
        /href="([^"]*item[^"]*\d+[^"]*)"/gi,
      ];

      const allProductLinks = new Set<string>();

      productLinkPatterns.forEach(pattern => {
        const matches = [...decodedHtml.matchAll(pattern)];
        matches.forEach(match => {
          let url = match[1];
          if (url.startsWith('/')) {
            const baseUrl = new URL(user.printifyStoreUrl);
            url = baseUrl.origin + url;
          } else if (!url.startsWith('http')) {
            url = user.printifyStoreUrl + '/' + url;
          }
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

      if (allProductLinks.size === 0) {
        const productSectionPatterns = [
          /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/gis,
          /<article[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/article>/gis,
          /<section[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/section>/gis,
        ];

        productSectionPatterns.forEach(pattern => {
          const matches = [...decodedHtml.matchAll(pattern)];
          matches.forEach((match) => {
            const sectionHtml = match[1];
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

      const printifyImagePattern = /(https:\/\/images-api\.printify\.com\/[^\s"'<>(){}[\]]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"'<>(){}[\]]*)?)/gi;
      const allPrintifyImages = [...decodedHtml.matchAll(printifyImagePattern)];
      const productUrlsArray = Array.from(allProductLinks);

      if (allPrintifyImages.length > 0) {
        allPrintifyImages.forEach((imageMatch, index) => {
          const imageUrl = imageMatch[1];
          const imageIndex = imageMatch.index || 0;

          const contextStart = Math.max(0, imageIndex - 2000);
          const contextEnd = Math.min(decodedHtml.length, imageIndex + 2000);
          const context = decodedHtml.slice(contextStart, contextEnd);

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
            if ((url.includes('/product') || url.includes('/p/') || url.includes('/item')) &&
              !url.includes('cart') && !url.includes('login')) {
              productUrl = url;
              break;
            }
          }

          if (!productUrl && productUrlsArray.length > index) {
            productUrl = productUrlsArray[index];
          }

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

          products.push({
            id: (index + 1).toString(),
            title,
            description: `Product from ${user.printifyStoreUrl}`,
            images: [imageUrl],
            variants: [{
              id: '1',
              price,
              title: 'Default',
              sku: `PRINTIFY-${index + 1}`,
              available: true,
            }],
            url: productUrl || user.printifyStoreUrl,
            tags: ['printify-scraped'],
            visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      } else {
        productUrlsArray.forEach((url, index) => {
          products.push({
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
            url,
            tags: ['url-only'],
            visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }

      return products;
    };

    const allScrapedProducts = parseProductsFromHTML();
    const start = (page - 1) * limit;
    const pageSlice = allScrapedProducts.slice(start, start + limit);

    return NextResponse.json({
      products: pageSlice,
      page,
      hasMore: start + limit < allScrapedProducts.length,
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

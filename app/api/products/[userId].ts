// pages/api/printify/products/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next';

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  try {
    // Get user's shop ID from database
    // const user = await User.findById(userId);
    // const shopId = user.printifyShopId;
    
    // For now, using a placeholder - replace with actual database call
    const shopId = "12345"; // This should come from your database
    
    // Fetch products using YOUR API key
    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        headers: {
          'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Printify API error: ${response.status}`);
    }

    const products = await response.json();
    
    // Transform data for your frontend
    const transformedProducts = products.data.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      images: product.images.map((img: any) => img.src),
      variants: product.variants.map((variant: any) => ({
        id: variant.id,
        price: variant.price / 100, // Convert cents to dollars
        size: variant.size,
        color: variant.color
      })),
      tags: product.tags
    }));

    res.status(200).json(transformedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
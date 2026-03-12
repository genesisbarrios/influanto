// components/PrintifyProducts.tsx
import { useState, useEffect } from 'react';

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  variants: {
    id: string;
    price: number;
    size?: string;
    color?: string;
  }[];
  tags: string[];
}

interface PrintifyProductsProps {
  userId: string;
  shopId: string;
  selectedProductIds?: string[];
  textColor?: string;
  linksColor?: string;
  cardBgColor?: string;
  font?: string;
}

const PrintifyProducts = ({ 
  userId, 
  shopId, 
  selectedProductIds = [],
  textColor = '#000000', 
  linksColor = '#0066cc',
  cardBgColor = 'transparent',
  font = 'inherit'
}: PrintifyProductsProps) => {
  const [products, setProducts] = useState<PrintifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [userId, shopId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/printify/products/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4" style={{ 
        color: textColor,
        fontFamily: font 
      }}>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4" style={{ 
        color: textColor,
        fontFamily: font 
      }}>
        <p className="text-sm">❌ {error}</p>
        <button 
          onClick={fetchProducts}
          className="text-xs underline mt-2"
          style={{ color: linksColor }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-4" style={{ 
        color: textColor,
        fontFamily: font 
      }}>
        <p className="text-sm">No products found in your store.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
        {products.map((product: PrintifyProduct) => (
          <ProductCard 
            key={product.id} 
            product={product}
            textColor={textColor}
            linksColor={linksColor}
            cardBgColor={cardBgColor}
            font={font}
          />
        ))}
      </div>
    </div>
  );
};

const ProductCard = ({ 
  product, 
  textColor, 
  linksColor, 
  cardBgColor, 
  font 
}: { 
  product: PrintifyProduct;
  textColor: string;
  linksColor: string; 
  cardBgColor: string;
  font: string;
}) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);

  if (!product.variants || product.variants.length === 0) {
    return (
      <div 
        className="flex-none w-40 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        style={{ backgroundColor: cardBgColor }}
      >
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs" style={{ fontFamily: font }}>
            No image
          </span>
        </div>
        <div className="p-3">
          <h4 className="font-medium text-xs truncate" style={{ 
            color: textColor,
            fontFamily: font 
          }}>
            {product.title}
          </h4>
          <p className="text-xs mt-1" style={{ 
            color: textColor,
            fontFamily: font 
          }}>
            Price not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-none w-40 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: cardBgColor }}
    >
      <div className="aspect-square bg-gray-100">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs" style={{ fontFamily: font }}>
              No image
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h4 className="font-medium text-xs truncate" style={{ 
          color: textColor,
          fontFamily: font 
        }}>
          {product.title}
        </h4>
        <p className="text-xs mt-1" style={{ 
          color: textColor,
          fontFamily: font 
        }}>
          ${selectedVariant?.price || 0}
        </p>
        
        {product.variants.length > 1 && (
          <select
            value={selectedVariant?.id || ''}
            onChange={(e) => {
              const variant = product.variants.find(v => v.id === e.target.value);
              if (variant) setSelectedVariant(variant);
            }}
            className="w-full mt-2 text-xs border border-gray-300 rounded px-1 py-1"
            style={{ 
              fontFamily: font,
              fontSize: '10px'
            }}
          >
            {product.variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.size && `${variant.size} - `}
                {variant.color || 'Default'}
              </option>
            ))}
          </select>
        )}
        
        <button
          className="w-full mt-2 px-2 py-1 text-white text-xs rounded transition-colors"
          style={{ 
            backgroundColor: linksColor,
            fontFamily: font,
            fontSize: '10px'
          }}
          onClick={() => {
            // Open product page or handle purchase
            const printifyUrl = `https://printify.com/app/products/${product.id}`;
            window.open(printifyUrl, '_blank');
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default PrintifyProducts;
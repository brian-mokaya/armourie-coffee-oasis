
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addToCart } from '@/services/cartService';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  offerTag?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const { id, name, description, price, originalPrice, image, isPopular, isNew, offerTag } = product;
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsAdding(true);
      // Add item to cart with quantity 1
      await addToCart({
        id,
        name,
        price,
        originalPrice,
        image: image || '',  // Ensure image is never undefined
        quantity: 1
      });
      
      toast({
        title: "Added to Cart",
        description: `${name} has been added to your cart.`
      });
      
      // Call the parent component's onAddToCart handler
      onAddToCart(product);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const fallbackImage = "https://images.unsplash.com/photo-1518770660439-4636190af475";

  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/product/${id}`} className="block h-full">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image || fallbackImage} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = fallbackImage;
            }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {isNew && (
              <Badge className="bg-blue-500">New</Badge>
            )}
            {isPopular && (
              <Badge className="bg-amber-500">Popular</Badge>
            )}
            {offerTag && (
              <Badge className="bg-green-500">{offerTag}</Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 text-coffee-dark">{name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{description}</p>
          <div className="flex items-center">
            <span className="font-bold text-coffee-dark">KES {price.toFixed(2)}</span>
            {originalPrice && originalPrice > price && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                KES {originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-coffee-dark hover:bg-coffee-medium text-white"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Cart'
            )}
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default ProductCard;


import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/product/${id}`} className="block h-full">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
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
            className="w-full bg-coffee-dark hover:bg-coffee-medium text-white"
          >
            Add to Cart
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default ProductCard;

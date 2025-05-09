
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ProductCard, { Product } from './ProductCard';
import { useToast } from '@/components/ui/use-toast';
import { getProducts } from '@/services/productService';
import { Loader2 } from 'lucide-react';
import { Product as ProductType } from '@/types';

const FeaturedProducts = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'smoothies', name: 'Smoothies' },
    { id: 'snacks', name: 'Snacks' }
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(product => product.category === activeCategory);

  const handleAddToCart = (product: ProductType) => {
    // In a real app, this would add the product to the cart state/context
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`
    });
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-coffee-dark text-center mb-8">
        Our Menu
      </h2>
      
      <div className="flex justify-center mb-8 overflow-x-auto pb-2">
        <div className="flex space-x-2">
          {categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              variant={activeCategory === category.id ? "default" : "outline"}
              className={activeCategory === category.id 
                ? "bg-coffee-dark hover:bg-coffee-medium text-white" 
                : "text-coffee-dark border-coffee-dark hover:bg-coffee-light/20"}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-coffee-dark" />
          <span className="ml-2 text-coffee-dark">Loading products...</span>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product as Product}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-coffee-medium text-lg">
            {activeCategory === 'all' 
              ? "No products available yet." 
              : `No ${activeCategory} products available yet.`}
          </p>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import ProductCard, { Product as ProductCardType } from '@/components/ProductCard';
import { useToast } from '@/components/ui/use-toast';
import { getProducts } from '@/services/productService';
import { Loader2 } from 'lucide-react';
import { Product } from '@/types';

const Menu = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load products. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'smoothies', name: 'Smoothies' },
    { id: 'snacks', name: 'Snacks & Food' }
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(product => product.category.toLowerCase() === activeCategory.toLowerCase());

  const handleAddToCart = (product: Product) => {
    // In a real app, this would add the product to the cart state/context
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`
    });
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-coffee-dark mb-2">Our Menu</h1>
          <p className="text-coffee-medium max-w-2xl mx-auto">
            Explore our selection of handcrafted beverages and delicious treats, made with the finest ingredients.
          </p>
        </div>
        
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product as ProductCardType}
                onAddToCart={handleAddToCart}
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
    </Layout>
  );
};

export default Menu;

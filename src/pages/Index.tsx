
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import { getCartItems } from '@/services/cartService';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCartItems = async () => {
      if (isAuthenticated) {
        try {
          const items = await getCartItems();
          const count = items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(count);
        } catch (error) {
          console.error("Error fetching cart items:", error);
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartItems();
  }, [isAuthenticated]);

  return (
    <Layout cartCount={cartCount}>
      <Hero />
      <FeaturedProducts />
      <Features />
      <Testimonials />
      <Newsletter />
    </Layout>
  );
};

export default Index;

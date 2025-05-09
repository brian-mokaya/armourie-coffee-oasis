import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, MapPin, ShoppingBag, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateCoupon, incrementCouponUse } from '@/services/couponService';
import { createOrder } from '@/services/orderService';
import { auth } from "@/firebase/firebase";

// Cart item interface
interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
}

const Cart = () => {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Initialize as an empty array
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [deliveryMethod, setDeliveryMethod] = useState<'manual' | 'gps'>('manual');
  const [address, setAddress] = useState({
    street: '',
    city: 'Nairobi',
    zipCode: '',
    instructions: ''
  });
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch cart items from an API or global state
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        // Replace with your API call or global state logic
        const response = await fetch('/api/cart'); // Example API endpoint
        const data = await response.json();
        setCartItems(data);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load cart items. Please try again.',
        });
      }
    };

    fetchCartItems();
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee - discountAmount;

  // Function to update item quantity
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Function to remove item from cart
  const removeItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart."
    });
  };

  // Function to apply promo code
  const applyPromoCode = async () => {
    setPromoError('');

    if (!promoCode) {
      setPromoError('Please enter a promo code');
      return;
    }

    try {
      const result = await validateCoupon(promoCode.toUpperCase(), subtotal);

      if (result.valid) {
        setDiscountAmount(result.discount);
        setPromoApplied(true);
        toast({
          title: "Promo Applied!",
          description: `A discount of KES ${result.discount.toFixed(2)} has been applied to your order.`
        });
      } else {
        setPromoError(result.message || 'Invalid promo code');
        toast({
          variant: "destructive",
          title: "Invalid Promo Code",
          description: result.message || 'Please check your code and try again.'
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setPromoError('Error validating coupon. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate coupon. Please try again."
      });
    }
  };

  // Function to handle checkout
  const handleCheckout = async () => {
    if (!address.street) {
      toast({
        variant: "destructive",
        title: "Missing Address",
        description: "Please provide a delivery address before checkout."
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const user = auth.currentUser;
      const userEmail = user ? user.email : 'guest@example.com';
      const userName = user ? user.displayName || 'Guest User' : 'Guest User';

      const orderItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      }));

      const loyaltyPoints = Math.floor(total / 115);

      const orderData = {
        customer: userName,
        email: userEmail,
        date: new Date().toISOString(),
        items: orderItems,
        total,
        status: 'Pending' as const,
        paymentStatus: 'Pending' as const,
        paymentMethod: 'Cash on Delivery',
        location: `${address.street}, ${address.city} ${address.zipCode}`,
        loyaltyPoints,
        trackingSteps: [
          {
            title: "Order Placed",
            description: "Your order has been received",
            time: new Date().toISOString(),
            completed: true
          },
          {
            title: "Payment Confirmed",
            description: "Payment has been confirmed",
            time: "",
            completed: false
          },
          {
            title: "Preparing",
            description: "Your order is being prepared",
            time: "",
            completed: false
          },
          {
            title: "Out for Delivery",
            description: "Your order is on the way",
            time: "",
            completed: false
          },
          {
            title: "Delivered",
            description: "Your order has been delivered",
            time: "",
            completed: false
          }
        ]
      };

      const orderId = await createOrder(orderData);

      if (promoApplied && promoCode) {
        await incrementCouponUse(promoCode);
      }

      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been received and is being processed."
      });

      window.location.href = `/track-order?id=${orderId}`;
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to place your order. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-coffee-dark mb-8">Your Cart</h1>
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-center mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground text-center mb-6">Looks like you haven't added any items yet.</p>
            <Button asChild className="bg-coffee-dark hover:bg-coffee-medium">
              <Link to="/menu">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          // Render cart items and other components
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            {/* Delivery Information */}
            {/* Order Summary */}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;

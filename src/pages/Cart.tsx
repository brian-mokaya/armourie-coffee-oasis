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
import { placeOrder } from '@/services/cartService'; // <-- use placeOrder
import { auth } from "@/firebase/firebase";
import { getCartItems, removeFromCart, updateCartItemQuantity, clearCart } from '@/services/cartService';

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch cart items when component mounts
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const items = await getCartItems();
        setCartItems(items);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cart items. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [toast]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee - discountAmount;
  
  // Function to update item quantity
  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateCartItemQuantity(id, newQuantity);
      
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? {...item, quantity: newQuantity} : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Function to remove item from cart
  const handleRemoveItem = async (id: string) => {
    try {
      await removeFromCart(id);
      setCartItems(prevItems => prevItems.filter(item => item.id !== id));
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart."
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive'
      });
    }
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
  
  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Available",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real app, we would use Google Maps API to get the address from coordinates
        // For now, we'll just use placeholder text
        setAddress({
          ...address,
          street: "Location detected: Use street name for specific location"
        });
        setIsLocationLoading(false);
        
        // Simulate delivery fee calculation based on distance
        const randomFee = Math.floor(Math.random() * 200) + 100; // Random fee between 100-300
        setDeliveryFee(randomFee);
        
        toast({
          title: "Location Detected",
          description: "Your location has been successfully detected."
        });
      },
      (error) => {
        setIsLocationLoading(false);
        toast({
          title: "Error Detecting Location",
          description: error.message,
          variant: "destructive"
        });
      }
    );
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
      
      // Use placeOrder instead of createOrder
      const orderId = await placeOrder(orderData, userEmail);
      
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

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-coffee-dark" />
            <p className="text-lg text-coffee-dark">Loading your cart...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-4 py-2 border-b last:border-0">
                        <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
                            }}
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center mt-1">
                            <span className="font-semibold text-coffee-dark">KES {item.price.toFixed(2)}</span>
                            {item.originalPrice && (
                              <span className="ml-2 text-sm text-muted-foreground line-through">
                                KES {item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-6 text-center">{item.quantity}</span>
                          
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Delivery Information */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                  <CardDescription>How would you like to provide your delivery address?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="flex gap-4">
                      <Button
                        variant={deliveryMethod === 'manual' ? 'default' : 'outline'}
                        className={deliveryMethod === 'manual' ? 'bg-coffee-dark hover:bg-coffee-medium' : ''}
                        onClick={() => setDeliveryMethod('manual')}
                      >
                        Manual Input
                      </Button>
                      <Button
                        variant={deliveryMethod === 'gps' ? 'default' : 'outline'}
                        className={deliveryMethod === 'gps' ? 'bg-coffee-dark hover:bg-coffee-medium' : ''}
                        onClick={() => setDeliveryMethod('gps')}
                      >
                        Use GPS Location
                      </Button>
                    </div>
                    
                    {deliveryMethod === 'manual' ? (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input 
                            id="street" 
                            placeholder="Street Address" 
                            value={address.street}
                            onChange={(e) => setAddress({...address, street: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city" 
                              value={address.city}
                              onChange={(e) => setAddress({...address, city: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="zipCode">Postal Code</Label>
                            <Input 
                              id="zipCode" 
                              placeholder="Postal Code" 
                              value={address.zipCode}
                              onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                          <Input 
                            id="instructions" 
                            placeholder="E.g. Gate code, landmark, etc." 
                            value={address.instructions}
                            onChange={(e) => setAddress({...address, instructions: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-4">
                        <Button 
                          onClick={getCurrentLocation}
                          disabled={isLocationLoading}
                          className="bg-coffee-dark hover:bg-coffee-medium"
                        >
                          {isLocationLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Detecting Location...
                            </>
                          ) : (
                            'Detect My Location'
                          )}
                        </Button>
                        
                        {address.street && (
                          <div className="p-3 bg-muted rounded-md flex items-start space-x-2">
                            <MapPin className="h-5 w-5 text-coffee-dark mt-0.5" />
                            <div>
                              <p className="font-medium">{address.street}</p>
                              <p className="text-sm text-muted-foreground">{address.city} {address.zipCode}</p>
                              {address.instructions && (
                                <p className="text-sm mt-1">{address.instructions}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid gap-2">
                          <Label htmlFor="gpsInstructions">Delivery Instructions (Optional)</Label>
                          <Input 
                            id="gpsInstructions" 
                            placeholder="E.g. Gate code, landmark, etc." 
                            value={address.instructions}
                            onChange={(e) => setAddress({...address, instructions: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>KES {subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>KES {deliveryFee.toFixed(2)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>- KES {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>KES {total.toFixed(2)}</span>
                  </div>
                  
                  {/* Promo Code */}
                  <div className="pt-4">
                    <Label htmlFor="promoCode">Promo Code</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        id="promoCode"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError('');
                        }}
                        disabled={promoApplied}
                        className={promoError ? "border-red-300" : ""}
                      />
                      <Button 
                        onClick={applyPromoCode}
                        disabled={!promoCode || promoApplied}
                        variant="outline"
                      >
                        Apply
                      </Button>
                    </div>
                    
                    {promoError && (
                      <p className="text-sm text-red-500 mt-1">{promoError}</p>
                    )}
                    
                    {promoApplied && (
                      <Badge variant="outline" className="mt-2 bg-green-50 text-green-600 border-green-200">
                        Promo Code Applied
                      </Badge>
                    )}
                  </div>
                  
                  {/* Loyalty points reminder */}
                  <div className="bg-coffee-light/20 p-3 rounded-md text-sm">
                    <p className="font-medium">Earn Loyalty Points with this purchase!</p>
                    <p className="text-muted-foreground">
                      You'll earn {Math.floor(total / 115)} points with this order.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-coffee-dark hover:bg-coffee-medium"
                    onClick={handleCheckout}
                    disabled={!address.street || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;

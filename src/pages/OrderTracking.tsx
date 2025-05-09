
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Check, 
  Clock, 
  Package, 
  Search, 
  Truck,
  Loader2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { getOrderById } from '@/services/orderService';

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('order') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Function to fetch order data from Firebase
  const handleTrackOrder = async () => {
    if (!orderNumber) {
      setError('Please enter an order number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const order = await getOrderById(orderNumber);
      
      if (!order) {
        setError('Order not found. Please check your order number and try again.');
        setOrderData(null);
        toast({
          variant: "destructive",
          title: "Order not found",
          description: "Please check your order number and try again."
        });
      } else {
        // Check if the user owns this order when logged in
        if (currentUser && currentUser.email !== order.email) {
          setError('You do not have permission to view this order.');
          setOrderData(null);
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You do not have permission to view this order."
          });
          return;
        }
        
        setOrderData(order);
        toast({
          title: "Order found",
          description: `Tracking information for order #${order.id.slice(0, 4)} has been loaded.`
        });
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError('An error occurred while trying to fetch your order. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch order information. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for order in search params when component mounts
  useEffect(() => {
    if (initialOrderId) {
      handleTrackOrder();
    }
  }, [initialOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Track Your Order</h1>
        
        <div className="max-w-3xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter Your Order Number</CardTitle>
              <CardDescription>
                Enter the order number you received in your confirmation email or SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. 2305"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="pl-9"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleTrackOrder();
                    }}
                  />
                </div>
                <Button onClick={handleTrackOrder} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tracking...
                    </>
                  ) : (
                    'Track Order'
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 mt-4 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="text-center mt-4 text-sm text-muted-foreground">
                <p>Don't know your order number? Check your email for order confirmation</p>
              </div>
            </CardContent>
          </Card>

          {orderData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order #{orderData.id.slice(0, 4)}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(orderData.date).toLocaleDateString()} at {new Date(orderData.date).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {orderData.status}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-2">Delivery Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Delivery Address</h4>
                      <p className="font-medium">{orderData.location}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact</h4>
                      <p className="font-medium">{orderData.customer}</p>
                      <p className="text-sm text-muted-foreground">{orderData.email}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Order Tracking</h3>
                  <div className="space-y-6">
                    {orderData.trackingSteps.map((step, idx) => (
                      <div key={idx} className="relative flex gap-4">
                        {idx !== orderData.trackingSteps.length - 1 && (
                          <div className="absolute left-[14px] top-[24px] h-full w-0.5 bg-gray-200"></div>
                        )}
                        
                        <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          step.completed ? 'bg-green-100 border-green-600 text-green-600' : 'bg-gray-100 border-gray-400 text-gray-400'
                        }`}>
                          {step.completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className="pb-6">
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{step.time ? new Date(step.time).toLocaleString() : '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    {orderData.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium">KES {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center pt-2">
                      <p className="font-bold">Total</p>
                      <p className="font-bold">KES {orderData.total.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-muted-foreground">Payment Method</p>
                      <p>{orderData.paymentMethod}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <p className="text-muted-foreground">Payment Status</p>
                      <p>{orderData.paymentStatus}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <p className="text-muted-foreground">Loyalty Points Earned</p>
                      <p>{orderData.loyaltyPoints || 0} points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OrderTracking;

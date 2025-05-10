import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByCustomer } from '@/services/orderService';
import { Order } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Loader2, Package, Clock, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const UserOrders = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !currentUser?.email) {
        navigate('/login');
        return;
      }
      try {
        setIsLoading(true);
        const userOrders = await getOrdersByCustomer(currentUser.email);
        setOrders(userOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser, isAuthenticated, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Out for Delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-coffee-dark mr-2" />
            <span>Loading your orders...</span>
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Order #{order.id.slice(0, 4)}
                      </CardTitle>
                      <CardDescription>
                        Placed on {new Date(order.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/track-order?order=${order.id}`)}
                      >
                        <Clock className="mr-1 h-4 w-4" />
                        Track Order
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Order Summary</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">KES {item.price.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={2} className="font-bold text-right">Total:</TableCell>
                            <TableCell className="font-bold text-right">KES {order.total.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 border-t">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h4>
                        <p>{order.paymentMethod}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h4>
                        <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'outline'}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Location</h4>
                        <p>{order.location}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Loyalty Points Earned</h4>
                        <p>{order.loyaltyPoints || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserOrders;

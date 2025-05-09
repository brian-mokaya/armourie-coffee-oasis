
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Truck, 
  MoreVertical, 
  Search, 
  Calendar, 
  User,
  MapPin,
  Clock,
  CreditCard,
  Check,
  AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { db } from "@/firebase/firebase";
import { collection, getDocs, doc, updateDoc, query, where, DocumentData } from "firebase/firestore";
import { useToast } from '@/components/ui/use-toast';

// Define the order interface
interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  location: string;
  loyaltyPoints: number;
  trackingSteps: {
    title: string;
    description: string;
    time: string;
    completed: boolean;
  }[];
}

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch orders from Firebase on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersCollection = collection(db, "orders");
        const ordersSnapshot = await getDocs(ordersCollection);
        const ordersList: Order[] = [];
        
        ordersSnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Order, 'id'>;
          ordersList.push({ id: doc.id, ...data });
        });
        
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch orders. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  // Filter orders based on search term and selected tab
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (currentTab === 'all') return matchesSearch;
    return matchesSearch && order.status.toLowerCase() === currentTab.toLowerCase();
  });

  // Update order status in Firebase
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!newStatus) return;
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        // Update tracking steps based on the new status
        trackingSteps: orders.find(o => o.id === orderId)?.trackingSteps.map(step => {
          // Mark all steps as completed up to the current status step
          const statusSteps = {
            "Pending": ["Order Placed"],
            "Processing": ["Order Placed", "Payment Confirmed", "Preparing"],
            "Out for Delivery": ["Order Placed", "Payment Confirmed", "Preparing", "Out for Delivery"],
            "Delivered": ["Order Placed", "Payment Confirmed", "Preparing", "Out for Delivery", "Delivered"],
          };
          
          const relevantSteps = statusSteps[newStatus as keyof typeof statusSteps] || [];
          return {
            ...step,
            completed: relevantSteps.includes(step.title)
          };
        })
      });
      
      // Update local state
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            trackingSteps: order.trackingSteps.map(step => {
              const statusSteps = {
                "Pending": ["Order Placed"],
                "Processing": ["Order Placed", "Payment Confirmed", "Preparing"],
                "Out for Delivery": ["Order Placed", "Payment Confirmed", "Preparing", "Out for Delivery"],
                "Delivered": ["Order Placed", "Payment Confirmed", "Preparing", "Out for Delivery", "Delivered"],
              };
              
              const relevantSteps = statusSteps[newStatus as keyof typeof statusSteps] || [];
              return {
                ...step,
                completed: relevantSteps.includes(step.title)
              };
            })
          };
        }
        return order;
      }));
      
      toast({
        title: "Status Updated",
        description: `Order #${orderId} status updated to ${newStatus}`,
      });
      
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status. Please try again."
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>;
      case 'Processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{status}</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{status}</Badge>;
      case 'Out for Delivery':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Find the selected order details
  const orderDetail = selectedOrder 
    ? orders.find(order => order.id === selectedOrder) 
    : null;

  return (
    <AdminLayout title="Orders">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Orders</CardTitle>
            <CardDescription>
              View and manage all customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mb-6" onValueChange={setCurrentTab}>
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered</TabsTrigger>
                </TabsList>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <TabsContent value="all" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading orders...
                          </TableCell>
                        </TableRow>
                      ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(order.date).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>KES {order.total.toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedOrder(order.id)}
                                    >
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Order #{orderDetail?.id}</DialogTitle>
                                      <DialogDescription>
                                        Order placed on {orderDetail ? new Date(orderDetail.date).toLocaleString() : ''}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {orderDetail && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                          <h3 className="font-medium text-lg mb-2">Order Details</h3>
                                          
                                          <div className="grid gap-4">
                                            <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-muted-foreground" />
                                              <div>
                                                <p className="font-medium">{orderDetail.customer}</p>
                                                <p className="text-sm text-muted-foreground">{orderDetail.email}</p>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              <MapPin className="h-4 w-4 text-muted-foreground" />
                                              <p>{orderDetail.location}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              <Clock className="h-4 w-4 text-muted-foreground" />
                                              <p>{new Date(orderDetail.date).toLocaleString()}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                                              <div>
                                                <p className="font-medium">{orderDetail.paymentMethod}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {getPaymentStatusBadge(orderDetail.paymentStatus || '')}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <h3 className="font-medium text-lg mt-6 mb-2">Order Items</h3>
                                          <div className="border rounded-md">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Item</TableHead>
                                                  <TableHead className="text-right">Qty</TableHead>
                                                  <TableHead className="text-right">Price</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {orderDetail.items.map((item) => (
                                                  <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">KES {item.total.toLocaleString()}</TableCell>
                                                  </TableRow>
                                                ))}
                                                <TableRow>
                                                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                                                  <TableCell className="text-right font-bold">KES {orderDetail.total.toLocaleString()}</TableCell>
                                                </TableRow>
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                        
                                        <div className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                                          <h3 className="font-medium text-lg mb-4">Order Tracking</h3>
                                          
                                          <div className="space-y-6">
                                            {orderDetail.trackingSteps.map((step, idx) => (
                                              <div key={idx} className="relative flex gap-4">
                                                {idx !== orderDetail.trackingSteps.length - 1 && (
                                                  <div className="absolute left-[14px] top-[24px] h-full w-0.5 bg-gray-200"></div>
                                                )}
                                                
                                                <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                                  step.completed ? 'bg-green-100 border-green-600 text-green-600' : 'bg-gray-100 border-gray-400 text-gray-400'
                                                }`}>
                                                  {step.completed ? (
                                                    <Check className="h-4 w-4" />
                                                  ) : (
                                                    <AlertCircle className="h-4 w-4" />
                                                  )}
                                                </div>
                                                
                                                <div className="pb-6">
                                                  <p className="font-medium">{step.title}</p>
                                                  <p className="text-sm text-muted-foreground">{step.description}</p>
                                                  <p className="text-xs text-muted-foreground mt-1">{step.time}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          <div className="mt-6 border-t pt-4">
                                            <h4 className="font-medium mb-2">Update Order Status</h4>
                                            <div className="flex gap-2">
                                              <select 
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                              >
                                                <option value="">Select status</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Out for Delivery">Out for Delivery</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                              </select>
                                              <Button 
                                                onClick={() => {
                                                  if (selectedStatus) {
                                                    updateOrderStatus(orderDetail.id, selectedStatus);
                                                  }
                                                }}
                                                disabled={!selectedStatus}
                                              >
                                                Update
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          <div className="mt-6 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                            <h4 className="font-medium text-yellow-800 flex items-center gap-1">
                                              <AlertCircle className="h-4 w-4" />
                                              Loyalty Points
                                            </h4>
                                            <p className="text-sm text-yellow-800 mt-1">
                                              This order earned the customer {orderDetail.loyaltyPoints} points (1 point per KES 115 spent).
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-2">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Processing")}>
                                      Mark as Processing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Out for Delivery")}>
                                      Mark as Out for Delivery
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Delivered")}>
                                      Mark as Delivered
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => updateOrderStatus(order.id, "Cancelled")}
                                    >
                                      Cancel Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No orders found {searchTerm ? `for "${searchTerm}"` : ''}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(order.date).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>KES {order.total.toLocaleString()}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No pending orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="processing" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(order.date).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>KES {order.total.toLocaleString()}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No processing orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="delivered" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(order.date).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>KES {order.total.toLocaleString()}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No delivered orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

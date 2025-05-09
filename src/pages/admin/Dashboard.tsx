
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart3, 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Package,
  Tag,
  Clock,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '@/firebase/firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Order, Customer, Product } from '@/types';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    productInventory: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch recent orders
        const ordersRef = collection(db, 'orders');
        const recentOrdersQuery = query(ordersRef, orderBy('date', 'desc'), limit(5));
        const orderSnapshot = await getDocs(recentOrdersQuery);
        const ordersData: Order[] = [];
        orderSnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() } as Order);
        });
        setRecentOrders(ordersData);
        
        // Fetch stats data
        const allOrdersSnapshot = await getDocs(collection(db, 'orders'));
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const productsSnapshot = await getDocs(collection(db, 'products'));
        
        // Calculate total revenue from all orders
        let totalRevenue = 0;
        allOrdersSnapshot.forEach((doc) => {
          const orderData = doc.data();
          totalRevenue += orderData.total || 0;
        });
        
        setStats({
          totalRevenue,
          totalOrders: allOrdersSnapshot.size,
          activeCustomers: customersSnapshot.size,
          productInventory: productsSnapshot.size
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-coffee-dark" />
          <span className="ml-2 text-coffee-dark">Loading dashboard data...</span>
        </div>
      </AdminLayout>
    );
  }

  const statsItems = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      icon: DollarSign, 
      change: '+4.5%', 
      trend: 'up' 
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      icon: ShoppingBag, 
      change: '+11.2%', 
      trend: 'up' 
    },
    { 
      title: 'Active Customers', 
      value: stats.activeCustomers.toString(), 
      icon: Users, 
      change: '+2.3%', 
      trend: 'up' 
    },
    { 
      title: 'Product Inventory', 
      value: stats.productInventory.toString(), 
      icon: Package, 
      change: '-3.1%', 
      trend: 'down' 
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-6">
        <h2 className="text-3xl font-bold">Welcome back, Admin</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsItems.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-7 md:col-span-5">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                You had {recentOrders.length} orders this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id.slice(0, 4)}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No recent orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline">View all orders</Link>
            </CardFooter>
          </Card>

          <Card className="col-span-7 md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link to="/admin/products" className="flex items-center gap-4 rounded-md border p-4 hover:bg-gray-50">
                <Package className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Add New Product</p>
                  <p className="text-xs text-muted-foreground">Create a new product listing</p>
                </div>
              </Link>
              <Link to="/admin/offers" className="flex items-center gap-4 rounded-md border p-4 hover:bg-gray-50">
                <Tag className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Create Offer</p>
                  <p className="text-xs text-muted-foreground">Set up promotional offers</p>
                </div>
              </Link>
              <Link to="/admin/orders" className="flex items-center gap-4 rounded-md border p-4 hover:bg-gray-50">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Track Orders</p>
                  <p className="text-xs text-muted-foreground">View and update order status</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

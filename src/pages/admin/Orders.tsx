
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrders, updateOrderStatus, deleteOrder, removeOrderFromCustomer } from "@/services/orderService";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  Trash
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Order } from "@/types";
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminOrders = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: getOrders,
    enabled: isAdmin
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: Order['status'] }) => 
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error(`Error updating order: ${error}`);
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      await deleteOrder(order.id);
      if (order.email) {
        await removeOrderFromCustomer(order.id, order.email);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Order successfully deleted");
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error deleting order: ${error}`);
    }
  });

  const handleStatusChange = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ id: orderId, status: status as Order['status'] });
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete);
    }
  };

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

  const getPaymentStatusColor = (status: string) => {
    return status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  if (isLoading) {
    return (
      <AdminLayout title="Orders">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-coffee-dark" />
          <span className="ml-2">Loading orders...</span>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout title="Orders">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Orders</h3>
          <p className="text-gray-500">There was a problem fetching order data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Orders</h2>
          <p className="text-gray-500">View and update customer orders</p>
        </div>
        
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(0, 4)}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</TableCell>
                  <TableCell>KES {order.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">View</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Order Details - #{order.id.slice(0, 4)}</DialogTitle>
                          <DialogDescription>
                            Placed on {new Date(order.date).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium">Customer Information</h3>
                            <p>Name: {order.customer}</p>
                            <p>Email: {order.email}</p>
                            <p>Delivery Location: {order.location}</p>
                          </div>
                          
                          <div>
                            <h3 className="font-medium">Order Items</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">KES {item.price.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">KES {item.total.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                                  <TableCell className="text-right font-bold">KES {order.total.toLocaleString()}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <AlertDialog open={isDeleteDialogOpen && orderToDelete?.id === order.id} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" onClick={() => handleDeleteOrder(order)}>
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Order
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the order and remove it from our database. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDeleteOrder} className="bg-red-600 hover:bg-red-700">
                                  {deleteOrderMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No Orders Found</h3>
                      <p className="text-gray-500">There are no orders in the system yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Search, User, Calendar, Mail, Phone, MapPin, Gift, Loader2 } from 'lucide-react';
import { User as UserType } from '@/services/userService';
import { getAllUsers, updateUserLoyaltyPoints, deleteUser } from '@/services/userService';
import { getOrdersByCustomer } from '@/services/orderService';

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const { toast } = useToast();

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (selectedUser && showUserDialog) {
        try {
          const orders = await getOrdersByCustomer(selectedUser.email);
          setUserOrders(orders);
        } catch (error) {
          console.error('Error fetching user orders:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load user orders."
          });
        }
      }
    };

    fetchUserOrders();
  }, [selectedUser, showUserDialog, toast]);
  
  const filteredUsers = users.filter(user => 
    (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLoyaltyPoints = async () => {
    if (!selectedUser || !loyaltyPoints) return;
    
    try {
      setIsSubmitting(true);
      const points = parseInt(loyaltyPoints);
      await updateUserLoyaltyPoints(selectedUser.uid, points);

      // Update local state
      setUsers(users.map(user => 
        user.uid === selectedUser.uid 
          ? { ...user, loyaltyPoints: (user.loyaltyPoints || 0) + points } 
          : user
      ));
      
      setSelectedUser({
        ...selectedUser,
        loyaltyPoints: (selectedUser.loyaltyPoints || 0) + points
      });
      
      setLoyaltyPoints('');
      
      toast({
        title: "Points Added",
        description: `${points} loyalty points added to ${selectedUser.fullName}'s account.`
      });
      
    } catch (error) {
      console.error("Error adding loyalty points:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add loyalty points. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      await deleteUser(selectedUser.uid);

      // Update local state
      setUsers(users.filter(u => u.uid !== selectedUser.uid));
      
      setShowDeleteDialog(false);
      setShowUserDialog(false);
      setSelectedUser(null);
      
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully."
      });
      
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <AdminLayout title="Users">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage your user accounts and their loyalty points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-100 p-1 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <span className="font-medium">{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-800">
                          {user.loyaltyPoints || 0} points
                        </Badge>
                      </TableCell>
                      <TableCell>{user.orders?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 
                        `No users found for "${searchTerm}"` : 
                        "No users available."
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6">
                <h3 className="font-medium text-lg mb-4">User Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Name</span>
                    </div>
                    <p>{selectedUser.fullName}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p>{selectedUser.email}</p>
                  </div>
                  
                  {selectedUser.phone && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone</span>
                      </div>
                      <p>{selectedUser.phone}</p>
                    </div>
                  )}
                  
                  {selectedUser.address && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Address</span>
                      </div>
                      <p>{selectedUser.address}</p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Registered On</span>
                    </div>
                    <p>{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Loyalty Points</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 text-sm">
                      {selectedUser.loyaltyPoints || 0} points
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">Add Loyalty Points</h4>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Points to add"
                      value={loyaltyPoints}
                      onChange={(e) => setLoyaltyPoints(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddLoyaltyPoints}
                      disabled={!loyaltyPoints || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">User Actions</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete User
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 md:pl-6">
                <h3 className="font-medium text-lg mb-4">Order History</h3>
                
                {userOrders.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userOrders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{formatDate(order.date)}</TableCell>
                            <TableCell>KES {order.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">
                      No orders found for this user
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-4">Activity Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border p-4 rounded-md text-center">
                      <span className="text-2xl font-bold">{userOrders.length}</span>
                      <p className="text-muted-foreground text-sm">Total Orders</p>
                    </div>
                    <div className="border p-4 rounded-md text-center">
                      <span className="text-2xl font-bold">
                        {userOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                      </span>
                      <p className="text-muted-foreground text-sm">Total Spent (KES)</p>
                    </div>
                    <div className="border p-4 rounded-md text-center">
                      <span className="text-2xl font-bold">{selectedUser.loyaltyPoints || 0}</span>
                      <p className="text-muted-foreground text-sm">Loyalty Points</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? All their data including order history and loyalty points will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCustomers;
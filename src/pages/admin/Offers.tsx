
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tag, MoreVertical, PlusCircle, Search, CalendarRange, Loader2 } from 'lucide-react';
import { Coupon } from '@/types';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/services/couponService';

const AdminOffers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'Percentage' as 'Percentage' | 'Fixed',
    value: '',
    minPurchase: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: '',
    isActive: true
  });
  const { toast } = useToast();

  // Fetch coupons from Firestore
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setIsLoading(true);
        const couponsData = await getCoupons();
        setCoupons(couponsData);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load coupons. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, [toast]);
  
  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCoupon.code || !newCoupon.value || !newCoupon.validFrom || !newCoupon.validTo) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const couponData: Omit<Coupon, 'id'> = {
        code: newCoupon.code.toUpperCase(),
        type: newCoupon.type,
        value: parseFloat(newCoupon.value),
        minPurchase: newCoupon.minPurchase ? parseFloat(newCoupon.minPurchase) : undefined,
        validFrom: newCoupon.validFrom,
        validTo: newCoupon.validTo,
        maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : undefined,
        currentUses: 0,
        isActive: newCoupon.isActive
      };
      
      await createCoupon(couponData);
      
      // Refresh coupon list
      const updatedCoupons = await getCoupons();
      setCoupons(updatedCoupons);
      
      // Reset form
      setNewCoupon({
        code: '',
        type: 'Percentage',
        value: '',
        minPurchase: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxUses: '',
        isActive: true
      });
      
      toast({
        title: "Coupon Created",
        description: "The coupon has been created successfully."
      });
      
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create coupon. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoupon) return;
    
    try {
      setIsSubmitting(true);
      
      await updateCoupon(selectedCoupon.id, selectedCoupon);
      
      // Refresh coupon list
      const updatedCoupons = await getCoupons();
      setCoupons(updatedCoupons);
      
      setShowEditDialog(false);
      setSelectedCoupon(null);
      
      toast({
        title: "Coupon Updated",
        description: "The coupon has been updated successfully."
      });
      
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update coupon. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;
    
    try {
      setIsSubmitting(true);
      
      await deleteCoupon(selectedCoupon.id);
      
      // Update local state
      setCoupons(coupons.filter(c => c.id !== selectedCoupon.id));
      
      setShowDeleteDialog(false);
      setSelectedCoupon(null);
      
      toast({
        title: "Coupon Deleted",
        description: "The coupon has been deleted successfully."
      });
      
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete coupon. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCouponStatus = async (couponId: string, isActive: boolean) => {
    try {
      await updateCoupon(couponId, { isActive });
      
      // Update local state
      setCoupons(coupons.map(coupon => 
        coupon.id === couponId ? { ...coupon, isActive } : coupon
      ));
      
      toast({
        title: isActive ? "Coupon Activated" : "Coupon Deactivated",
        description: `The coupon has been ${isActive ? 'activated' : 'deactivated'}.`
      });
      
    } catch (error) {
      console.error("Error updating coupon status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update coupon status. Please try again."
      });
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inactive</Badge>;
    }
    
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);
    
    if (now < validFrom) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Upcoming</Badge>;
    } else if (now > validTo) {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Expired</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
    }
  };

  const formatDiscountValue = (coupon: Coupon) => {
    return coupon.type === 'Percentage' ? `${coupon.value}% off` : `KES ${coupon.value} off`;
  };

  return (
    <AdminLayout title="Offers & Promotions">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Coupons & Offers</CardTitle>
            <CardDescription>
              Manage promotional coupons, discounts, and special deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-6">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                    <DialogDescription>
                      Set up a new promotional coupon code for your customers.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddCoupon}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right text-sm">
                          Code *
                        </Label>
                        <Input 
                          id="code" 
                          placeholder="e.g. SUMMER25" 
                          className="col-span-3 uppercase"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right text-sm">
                          Type *
                        </Label>
                        <Select
                          value={newCoupon.type}
                          onValueChange={(value: 'Percentage' | 'Fixed') => setNewCoupon({...newCoupon, type: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select coupon type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Percentage">Percentage Discount</SelectItem>
                            <SelectItem value="Fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value" className="text-right text-sm">
                          Value *
                        </Label>
                        <div className="col-span-3 flex items-center">
                          <Input
                            id="value"
                            type="number"
                            placeholder={newCoupon.type === 'Percentage' ? "25" : "500"}
                            value={newCoupon.value}
                            onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})}
                            required
                          />
                          <span className="ml-2">
                            {newCoupon.type === 'Percentage' ? '%' : 'KES'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minPurchase" className="text-right text-sm">
                          Min Purchase
                        </Label>
                        <div className="col-span-3 flex items-center">
                          <Input
                            id="minPurchase"
                            type="number"
                            placeholder="1000"
                            value={newCoupon.minPurchase}
                            onChange={(e) => setNewCoupon({...newCoupon, minPurchase: e.target.value})}
                          />
                          <span className="ml-2">KES</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dates" className="text-right text-sm">
                          Valid Period *
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Input
                            id="valid-from"
                            type="date"
                            value={newCoupon.validFrom}
                            onChange={(e) => setNewCoupon({...newCoupon, validFrom: e.target.value})}
                            required
                          />
                          <span>to</span>
                          <Input
                            id="valid-to"
                            type="date"
                            value={newCoupon.validTo}
                            onChange={(e) => setNewCoupon({...newCoupon, validTo: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxUses" className="text-right text-sm">
                          Max Uses
                        </Label>
                        <Input
                          id="maxUses"
                          type="number"
                          placeholder="Unlimited"
                          className="col-span-3"
                          value={newCoupon.maxUses}
                          onChange={(e) => setNewCoupon({...newCoupon, maxUses: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Coupon'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading coupons...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCoupons.length > 0 ? (
                    filteredCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-gray-100 p-1.5">
                              <Tag className="h-5 w-5 text-gray-500" />
                            </div>
                            <span className="font-medium">{coupon.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>{coupon.type}</TableCell>
                        <TableCell>{formatDiscountValue(coupon)}</TableCell>
                        <TableCell>{getStatusBadge(coupon)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarRange className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validTo).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {coupon.maxUses ? `${coupon.currentUses} / ${coupon.maxUses}` : `${coupon.currentUses}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedCoupon(coupon);
                                setShowEditDialog(true);
                              }}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                // Create a duplicate with new code
                                setNewCoupon({
                                  code: `${coupon.code}_COPY`,
                                  type: coupon.type,
                                  value: coupon.value.toString(),
                                  minPurchase: coupon.minPurchase?.toString() || '',
                                  validFrom: coupon.validFrom,
                                  validTo: coupon.validTo,
                                  maxUses: coupon.maxUses?.toString() || '',
                                  isActive: coupon.isActive
                                });
                              }}>
                                Duplicate
                              </DropdownMenuItem>
                              {coupon.isActive ? (
                                <DropdownMenuItem onClick={() => toggleCouponStatus(coupon.id, false)}>
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => toggleCouponStatus(coupon.id, true)}>
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedCoupon(coupon);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 
                          `No coupons found for "${searchTerm}"` : 
                          "No coupons available. Create your first coupon!"
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCoupon && (
            <form onSubmit={handleEditCoupon}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-code" className="text-right text-sm">
                    Code
                  </Label>
                  <Input 
                    id="edit-code" 
                    className="col-span-3 uppercase"
                    value={selectedCoupon.code}
                    onChange={(e) => setSelectedCoupon({
                      ...selectedCoupon, 
                      code: e.target.value.toUpperCase()
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-type" className="text-right text-sm">
                    Type
                  </Label>
                  <Select
                    value={selectedCoupon.type}
                    onValueChange={(value: 'Percentage' | 'Fixed') => setSelectedCoupon({
                      ...selectedCoupon, 
                      type: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage">Percentage Discount</SelectItem>
                      <SelectItem value="Fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-value" className="text-right text-sm">
                    Value
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Input
                      id="edit-value"
                      type="number"
                      value={selectedCoupon.value}
                      onChange={(e) => setSelectedCoupon({
                        ...selectedCoupon, 
                        value: parseFloat(e.target.value)
                      })}
                    />
                    <span className="ml-2">
                      {selectedCoupon.type === 'Percentage' ? '%' : 'KES'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-minPurchase" className="text-right text-sm">
                    Min Purchase
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Input
                      id="edit-minPurchase"
                      type="number"
                      placeholder="1000"
                      value={selectedCoupon.minPurchase || ''}
                      onChange={(e) => setSelectedCoupon({
                        ...selectedCoupon, 
                        minPurchase: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                    <span className="ml-2">KES</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-dates" className="text-right text-sm">
                    Valid Period
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="edit-valid-from"
                      type="date"
                      value={selectedCoupon.validFrom.split('T')[0]}
                      onChange={(e) => setSelectedCoupon({
                        ...selectedCoupon, 
                        validFrom: e.target.value
                      })}
                    />
                    <span>to</span>
                    <Input
                      id="edit-valid-to"
                      type="date"
                      value={selectedCoupon.validTo.split('T')[0]}
                      onChange={(e) => setSelectedCoupon({
                        ...selectedCoupon, 
                        validTo: e.target.value
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-maxUses" className="text-right text-sm">
                    Max Uses
                  </Label>
                  <Input
                    id="edit-maxUses"
                    type="number"
                    placeholder="Unlimited"
                    className="col-span-3"
                    value={selectedCoupon.maxUses || ''}
                    onChange={(e) => setSelectedCoupon({
                      ...selectedCoupon, 
                      maxUses: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-active" className="text-right text-sm">
                    Status
                  </Label>
                  <Select
                    value={selectedCoupon.isActive ? "active" : "inactive"}
                    onValueChange={(value) => setSelectedCoupon({
                      ...selectedCoupon, 
                      isActive: value === "active"
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCoupon}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOffers;

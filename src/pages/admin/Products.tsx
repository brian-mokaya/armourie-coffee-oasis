import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody,
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Package, MoreVertical, PlusCircle, Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types';
import { getProducts, addProduct, updateProduct, deleteProduct, updateProductStock } from '@/services/productService';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: 'In Stock' as const,
    image: ''
  });
  const { toast } = useToast();
  
  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load products. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const productData: Omit<Product, 'id'> = {
        name: newProduct.name,
        description: newProduct.description || 'No description available',
        price: parseFloat(newProduct.price),
        category: newProduct.category || 'Uncategorized',
        stock: newProduct.stock,
        image: newProduct.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        isNew: true
      };
      
      await addProduct(productData);
      
      // Refresh product list
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
      
      // Reset form
      setNewProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: 'In Stock' as const,
        image: ''
      });
      
      toast({
        title: "Product Added",
        description: "The product has been added successfully."
      });
      
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;
    
    try {
      setIsSubmitting(true);
      
      await updateProduct(selectedProduct.id, selectedProduct);
      
      // Refresh product list
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
      
      setShowEditDialog(false);
      setSelectedProduct(null);
      
      toast({
        title: "Product Updated",
        description: "The product has been updated successfully."
      });
      
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsSubmitting(true);
      
      await deleteProduct(selectedProduct.id);
      
      // Update local state
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      
      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully."
      });
      
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateStock = async (productId: string, stock: 'In Stock' | 'Low Stock' | 'Out of Stock') => {
    try {
      await updateProductStock(productId, stock);
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId ? { ...product, stock } : product
      ));
      
      toast({
        title: "Stock Updated",
        description: `Stock status updated to ${stock}.`
      });
      
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update stock status. Please try again."
      });
    }
  };

  const getStockBadge = (stock: string) => {
    switch (stock) {
      case 'In Stock':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{stock}</Badge>;
      case 'Low Stock':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{stock}</Badge>;
      case 'Out of Stock':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{stock}</Badge>;
      default:
        return <Badge variant="outline">{stock}</Badge>;
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load products. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  return (
    <AdminLayout title="Products">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product to add to your store.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddProduct}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right text-sm">
                        Name *
                      </Label>
                      <Input 
                        id="name" 
                        placeholder="Product name" 
                        className="col-span-3" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right text-sm">
                        Description
                      </Label>
                      <Textarea 
                        id="description" 
                        placeholder="Product description" 
                        className="col-span-3" 
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right text-sm">
                        Category
                      </Label>
                      <Select 
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({...newProduct, category: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coffee">Coffee</SelectItem>
                          <SelectItem value="smoothies">Smoothies</SelectItem>
                          <SelectItem value="snacks">Snacks & Food</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right text-sm">
                        Price (KES) *
                      </Label>
                      <Input 
                        id="price" 
                        type="number" 
                        placeholder="0" 
                        className="col-span-3"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stock" className="text-right text-sm">
                        Stock Status
                      </Label>
                      <Select 
                        value={newProduct.stock}
                        onValueChange={(value: 'In Stock' | 'Low Stock' | 'Out of Stock') => 
                          setNewProduct({...newProduct, stock: value as 'In Stock'})
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select stock status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Low Stock">Low Stock</SelectItem>
                          <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="image" className="text-right text-sm">
                        Image URL
                      </Label>
                      <Input 
                        id="image" 
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        className="col-span-3"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Product'
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
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md overflow-hidden">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 p-2">
                                <Package className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>KES {product.price.toLocaleString()}</TableCell>
                      <TableCell>{getStockBadge(product.stock)}</TableCell>
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
                              setSelectedProduct(product);
                              setShowEditDialog(true);
                            }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStock(product.id, 'In Stock')}>
                              Mark In Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStock(product.id, 'Low Stock')}>
                              Mark Low Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStock(product.id, 'Out of Stock')}>
                              Mark Out of Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedProduct(product);
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
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 
                        `No products found for "${searchTerm}"` : 
                        "No products available. Add your first product!"
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <form onSubmit={handleEditProduct}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right text-sm">
                    Name
                  </Label>
                  <Input 
                    id="edit-name" 
                    placeholder="Product name" 
                    className="col-span-3"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct, 
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right text-sm">
                    Description
                  </Label>
                  <Textarea 
                    id="edit-description" 
                    placeholder="Product description" 
                    className="col-span-3"
                    value={selectedProduct.description}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct, 
                      description: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-category" className="text-right text-sm">
                    Category
                  </Label>
                  <Select 
                    value={selectedProduct.category}
                    onValueChange={(value) => setSelectedProduct({
                      ...selectedProduct, 
                      category: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coffee">Coffee</SelectItem>
                      <SelectItem value="smoothies">Smoothies</SelectItem>
                      <SelectItem value="snacks">Snacks & Food</SelectItem>
                      <SelectItem value="desserts">Desserts</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-price" className="text-right text-sm">
                    Price (KES)
                  </Label>
                  <Input 
                    id="edit-price" 
                    type="number" 
                    placeholder="0" 
                    className="col-span-3"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct, 
                      price: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock" className="text-right text-sm">
                    Stock Status
                  </Label>
                  <Select 
                    value={selectedProduct.stock}
                    onValueChange={(value: 'In Stock' | 'Low Stock' | 'Out of Stock') => 
                      setSelectedProduct({
                        ...selectedProduct, 
                        stock: value
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select stock status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-image" className="text-right text-sm">
                    Image URL
                  </Label>
                  <div className="col-span-3">
                    {selectedProduct.image && (
                      <div className="mb-2 h-24 w-24 rounded overflow-hidden">
                        <img 
                          src={selectedProduct.image} 
                          alt={selectedProduct.name} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475';
                          }}
                        />
                      </div>
                    )}
                    <Input 
                      id="edit-image" 
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={selectedProduct.image || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct, 
                        image: e.target.value
                      })}
                    />
                  </div>
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
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
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

export default AdminProducts;

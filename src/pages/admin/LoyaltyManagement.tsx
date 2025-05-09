
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Gift, 
  Users, 
  Award, 
  MoreVertical, 
  PlusCircle, 
  Search, 
  Trash, 
  Edit, 
  Star 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/firebase/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// Define interfaces
interface Reward {
  id: string;
  name: string;
  description?: string;
  points: number;
  image: string;
  active: boolean;
  createdAt: Timestamp;
}

interface LoyaltyUser {
  id: string;
  userId: string;
  points: number;
  tier: string;
  email?: string;
  name?: string;
}

interface Redemption {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  redeemedAt: Timestamp;
}

const LoyaltyManagement = () => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [users, setUsers] = useState<LoyaltyUser[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [isEditRewardOpen, setIsEditRewardOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);

  // Form states
  const [rewardName, setRewardName] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState('');
  const [rewardImage, setRewardImage] = useState('');
  const [rewardActive, setRewardActive] = useState(true);

  // Fetch rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true);
      try {
        const rewardsRef = collection(db, 'rewards');
        const rewardsSnapshot = await getDocs(rewardsRef);
        const rewardsList = rewardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Reward[];
        
        setRewards(rewardsList);
      } catch (error) {
        console.error("Error fetching rewards:", error);
        toast({
          title: "Error",
          description: "Failed to load rewards data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [toast]);

  // Fetch users with loyalty data
  useEffect(() => {
    const fetchLoyaltyUsers = async () => {
      try {
        const loyaltyRef = collection(db, 'loyalty');
        const loyaltySnapshot = await getDocs(loyaltyRef);
        const usersData = loyaltySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LoyaltyUser[];
        
        // Fetch user details for each loyalty record
        const loyaltyUsers = await Promise.all(usersData.map(async (user) => {
          try {
            const userRef = doc(db, 'users', user.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...user,
                email: userData.email,
                name: userData.displayName || userData.email
              };
            }
            return user;
          } catch (error) {
            console.error("Error fetching user data:", error);
            return user;
          }
        }));

        setUsers(loyaltyUsers);
      } catch (error) {
        console.error("Error fetching loyalty users:", error);
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        });
      }
    };

    fetchLoyaltyUsers();
  }, [toast]);

  // Fetch redemptions data
  useEffect(() => {
    const fetchRedemptions = async () => {
      try {
        const redemptionsRef = collection(db, 'redemptions');
        const q = query(redemptionsRef, orderBy('redeemedAt', 'desc'));
        const redemptionsSnapshot = await getDocs(q);
        
        const redemptionsList = redemptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Redemption[];
        
        // Fetch user details for each redemption
        const enrichedRedemptions = await Promise.all(redemptionsList.map(async (redemption) => {
          try {
            const userRef = doc(db, 'users', redemption.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...redemption,
                userEmail: userData.email,
                userName: userData.displayName || userData.email
              };
            }
            return redemption;
          } catch (error) {
            console.error("Error fetching user data for redemption:", error);
            return redemption;
          }
        }));
        
        setRedemptions(enrichedRedemptions);
      } catch (error) {
        console.error("Error fetching redemptions:", error);
        toast({
          title: "Error",
          description: "Failed to load redemptions data",
          variant: "destructive",
        });
      }
    };

    fetchRedemptions();
  }, [toast]);

  // Filter rewards based on search term
  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle add reward form submission
  const handleAddReward = async () => {
    if (!rewardName || !rewardPoints || !rewardImage) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newReward = {
        name: rewardName,
        description: rewardDescription,
        points: parseInt(rewardPoints),
        image: rewardImage,
        active: rewardActive,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'rewards'), newReward);
      
      // Update the local state
      setRewards([...rewards, { id: docRef.id, ...newReward } as Reward]);
      
      // Reset form
      setRewardName('');
      setRewardDescription('');
      setRewardPoints('');
      setRewardImage('');
      setRewardActive(true);
      setIsAddRewardOpen(false);
      
      toast({
        title: "Reward Added",
        description: "The new reward has been successfully added",
      });
    } catch (error) {
      console.error("Error adding reward:", error);
      toast({
        title: "Error",
        description: "Failed to add reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle edit reward form submission
  const handleEditReward = async () => {
    if (!currentReward || !rewardName || !rewardPoints || !rewardImage) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const rewardRef = doc(db, 'rewards', currentReward.id);
      
      const updatedReward = {
        name: rewardName,
        description: rewardDescription,
        points: parseInt(rewardPoints),
        image: rewardImage,
        active: rewardActive
      };
      
      await updateDoc(rewardRef, updatedReward);
      
      // Update local state
      setRewards(rewards.map(reward => 
        reward.id === currentReward.id 
          ? { ...reward, ...updatedReward } 
          : reward
      ));
      
      // Reset form and close dialog
      setCurrentReward(null);
      setIsEditRewardOpen(false);
      
      toast({
        title: "Reward Updated",
        description: "The reward has been successfully updated",
      });
    } catch (error) {
      console.error("Error updating reward:", error);
      toast({
        title: "Error",
        description: "Failed to update reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete reward
  const handleDeleteReward = async (rewardId: string) => {
    if (!window.confirm("Are you sure you want to delete this reward? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'rewards', rewardId));
      
      // Update local state
      setRewards(rewards.filter(reward => reward.id !== rewardId));
      
      toast({
        title: "Reward Deleted",
        description: "The reward has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting reward:", error);
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Set up edit reward form
  const setupEditReward = (reward: Reward) => {
    setCurrentReward(reward);
    setRewardName(reward.name);
    setRewardDescription(reward.description || '');
    setRewardPoints(reward.points.toString());
    setRewardImage(reward.image);
    setRewardActive(reward.active);
    setIsEditRewardOpen(true);
  };

  // Update user loyalty points manually
  const handleUpdateUserPoints = async (userId: string, currentPoints: number) => {
    const newPoints = prompt("Enter new points amount:", currentPoints.toString());
    if (!newPoints) return;
    
    const pointsValue = parseInt(newPoints);
    if (isNaN(pointsValue)) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateDoc(doc(db, 'loyalty', userId), {
        points: pointsValue,
        tier: pointsValue >= 500 ? "Gold" : pointsValue >= 200 ? "Silver" : "Bronze"
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              points: pointsValue,
              tier: pointsValue >= 500 ? "Gold" : pointsValue >= 200 ? "Silver" : "Bronze"
            } 
          : user
      ));
      
      toast({
        title: "Points Updated",
        description: "The user's loyalty points have been updated",
      });
    } catch (error) {
      console.error("Error updating user points:", error);
      toast({
        title: "Error",
        description: "Failed to update user points. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Loyalty Program Management">
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span>Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Redemptions</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Manage Rewards</CardTitle>
              <CardDescription>
                Create and manage loyalty rewards for your customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rewards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Dialog open={isAddRewardOpen} onOpenChange={setIsAddRewardOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Reward
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Reward</DialogTitle>
                      <DialogDescription>
                        Create a new reward for your loyalty program.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="name" className="text-right text-sm">
                          Name*
                        </label>
                        <Input 
                          id="name" 
                          placeholder="Reward name" 
                          className="col-span-3" 
                          value={rewardName}
                          onChange={(e) => setRewardName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="description" className="text-right text-sm">
                          Description
                        </label>
                        <Textarea 
                          id="description" 
                          placeholder="Reward description" 
                          className="col-span-3" 
                          value={rewardDescription}
                          onChange={(e) => setRewardDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="points" className="text-right text-sm">
                          Points*
                        </label>
                        <Input 
                          id="points" 
                          type="number" 
                          placeholder="0" 
                          className="col-span-3"
                          value={rewardPoints}
                          onChange={(e) => setRewardPoints(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="image" className="text-right text-sm">
                          Image URL*
                        </label>
                        <Input 
                          id="image" 
                          placeholder="https://example.com/image.jpg" 
                          className="col-span-3"
                          value={rewardImage}
                          onChange={(e) => setRewardImage(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="active" className="text-right text-sm">
                          Status
                        </label>
                        <div className="col-span-3">
                          <select 
                            id="active"
                            className="w-full border border-input rounded-md h-10 px-3"
                            value={rewardActive ? "active" : "inactive"}
                            onChange={(e) => setRewardActive(e.target.value === "active")}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddRewardOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddReward}>Save Reward</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isEditRewardOpen} onOpenChange={setIsEditRewardOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Reward</DialogTitle>
                      <DialogDescription>
                        Update the details of this reward.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-name" className="text-right text-sm">
                          Name*
                        </label>
                        <Input 
                          id="edit-name" 
                          placeholder="Reward name" 
                          className="col-span-3" 
                          value={rewardName}
                          onChange={(e) => setRewardName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-description" className="text-right text-sm">
                          Description
                        </label>
                        <Textarea 
                          id="edit-description" 
                          placeholder="Reward description" 
                          className="col-span-3" 
                          value={rewardDescription}
                          onChange={(e) => setRewardDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-points" className="text-right text-sm">
                          Points*
                        </label>
                        <Input 
                          id="edit-points" 
                          type="number" 
                          placeholder="0" 
                          className="col-span-3"
                          value={rewardPoints}
                          onChange={(e) => setRewardPoints(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-image" className="text-right text-sm">
                          Image URL*
                        </label>
                        <Input 
                          id="edit-image" 
                          placeholder="https://example.com/image.jpg" 
                          className="col-span-3"
                          value={rewardImage}
                          onChange={(e) => setRewardImage(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-active" className="text-right text-sm">
                          Status
                        </label>
                        <div className="col-span-3">
                          <select 
                            id="edit-active"
                            className="w-full border border-input rounded-md h-10 px-3"
                            value={rewardActive ? "active" : "inactive"}
                            onChange={(e) => setRewardActive(e.target.value === "active")}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditRewardOpen(false)}>Cancel</Button>
                      <Button onClick={handleEditReward}>Update Reward</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reward</TableHead>
                      <TableHead>Points Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Loading rewards...
                        </TableCell>
                      </TableRow>
                    ) : filteredRewards.length > 0 ? (
                      filteredRewards.map((reward) => (
                        <TableRow key={reward.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md overflow-hidden">
                                <img src={reward.image} alt={reward.name} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <p className="font-medium">{reward.name}</p>
                                {reward.description && (
                                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{reward.points} points</TableCell>
                          <TableCell>
                            {reward.active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
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
                                <DropdownMenuItem onClick={() => setupEditReward(reward)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReward(reward.id)}
                                  className="text-red-600"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No rewards found
                          {searchTerm && ` for "${searchTerm}"`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Users</CardTitle>
              <CardDescription>
                Manage user loyalty points and tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Loyalty Tier</TableHead>
                      <TableHead>Current Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium">{user.name || "User"}</p>
                                {user.email && (
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {user.tier === "Gold" && (
                                <Gift className="h-4 w-4 text-yellow-500" />
                              )}
                              {user.tier === "Silver" && (
                                <Star className="h-4 w-4 text-gray-400" />
                              )}
                              {user.tier === "Bronze" && (
                                <Award className="h-4 w-4 text-amber-700" />
                              )}
                              <span>{user.tier}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{user.points} points</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateUserPoints(user.id, user.points)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Update Points
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No loyalty users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Redemptions Tab */}
        <TabsContent value="redemptions">
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
              <CardDescription>
                View all reward redemptions by customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Points Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.length > 0 ? (
                      redemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell>
                            {redemption.redeemedAt?.toDate().toLocaleDateString()} at {redemption.redeemedAt?.toDate().toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{redemption.userName || "User"}</p>
                              {redemption.userEmail && (
                                <p className="text-xs text-muted-foreground">{redemption.userEmail}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{redemption.rewardName}</TableCell>
                          <TableCell>
                            <span className="font-medium">{redemption.pointsUsed} points</span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No redemption history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default LoyaltyManagement;

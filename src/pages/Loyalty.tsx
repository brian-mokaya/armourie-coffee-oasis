import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Gift, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { db, auth } from '@/firebase/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

// Define interfaces for our data types
interface RewardItem {
  id: string;
  name: string;
  points: number;
  image: string;
}

interface OrderHistoryItem {
  id: string;
  date: string;
  points: number;
  total: number;
}

interface UserLoyalty {
  id: string;
  userId: string;
  points: number;
  tier: string;
}

const Loyalty = () => {
  const { toast } = useToast();
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loyaltyId, setLoyaltyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Redirect to login or show a message
        toast({
          title: "You need to login",
          description: "Please login to view your loyalty points",
          variant: "destructive",
        });
      }
    });
    
    return () => unsubscribe();
  }, [toast]);

  // Fetch rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const rewardsRef = collection(db, 'rewards');
        const rewardsSnapshot = await getDocs(rewardsRef);
        const rewardsList = rewardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RewardItem[];
        
        setRewards(rewardsList);
      } catch (error) {
        console.error("Error fetching rewards:", error);
        toast({
          title: "Error",
          description: "Failed to load rewards data",
          variant: "destructive",
        });
      }
    };

    fetchRewards();
  }, [toast]);

  // Fetch user loyalty data
  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Query loyalty collection for current user
        const loyaltyRef = collection(db, 'loyalty');
        const q = query(loyaltyRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Create a new loyalty record for the user
          const newLoyaltyData = {
            userId,
            points: 0,
            tier: 'Bronze',
            createdAt: Timestamp.now()
          };
          
          const docRef = await addDoc(collection(db, 'loyalty'), newLoyaltyData);
          setLoyaltyId(docRef.id);
          setLoyaltyPoints(0);
        } else {
          // Get existing loyalty data
          const loyaltyData = querySnapshot.docs[0].data() as UserLoyalty;
          setLoyaltyId(querySnapshot.docs[0].id);
          setLoyaltyPoints(loyaltyData.points);
        }

        // Get order history
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where("userId", "==", userId));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const ordersHistory = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date,
            points: data.points || Math.round(data.total / 10), // Default calculation if points not stored
            total: data.total
          };
        }) as OrderHistoryItem[];
        
        setOrderHistory(ordersHistory);
      } catch (error) {
        console.error("Error fetching loyalty data:", error);
        toast({
          title: "Error",
          description: "Failed to load loyalty data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyData();
  }, [userId, toast]);

  const handleRedeemReward = async (reward: RewardItem) => {
    if (!userId || !loyaltyId) {
      toast({
        title: "Authentication required",
        description: "Please log in to redeem rewards",
        variant: "destructive",
      });
      return;
    }

    if (loyaltyPoints >= reward.points) {
      try {
        // Update loyalty points in Firestore
        const loyaltyRef = doc(db, 'loyalty', loyaltyId);
        const newPoints = loyaltyPoints - reward.points;
        
        await updateDoc(loyaltyRef, {
          points: newPoints
        });
        
        // Add redemption record
        await addDoc(collection(db, 'redemptions'), {
          userId,
          rewardId: reward.id,
          rewardName: reward.name,
          pointsUsed: reward.points,
          redeemedAt: Timestamp.now()
        });
        
        // Update local state
        setLoyaltyPoints(newPoints);
        
        toast({
          title: "Reward Redeemed!",
          description: `You have redeemed: ${reward.name}. It will be applied to your next order.`,
        });
      } catch (error) {
        console.error("Error redeeming reward:", error);
        toast({
          title: "Error",
          description: "Failed to redeem reward. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Not enough points",
        description: `You need ${reward.points - loyaltyPoints} more points to redeem this reward.`,
        variant: "destructive",
      });
    }
  };

  // Calculate progress to next tier
  const currentTier = loyaltyPoints >= 500 ? "Gold" : loyaltyPoints >= 200 ? "Silver" : "Bronze";
  const nextTier = loyaltyPoints >= 500 ? "Diamond" : loyaltyPoints >= 200 ? "Gold" : "Silver";
  const pointsToNextTier = loyaltyPoints >= 500 ? 1000 - loyaltyPoints : loyaltyPoints >= 200 ? 500 - loyaltyPoints : 200 - loyaltyPoints;
  const nextTierThreshold = loyaltyPoints >= 500 ? 1000 : loyaltyPoints >= 200 ? 500 : 200;
  const tierProgress = (loyaltyPoints / nextTierThreshold) * 100;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-coffee-dark mb-8">Loading your loyalty data...</h1>
        </div>
      </Layout>
    );
  }

  if (!userId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-coffee-dark mb-8">Sign In Required</h1>
          <p className="mb-8">Please sign in to view your loyalty information.</p>
          <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-coffee-dark mb-8 text-center">Loyalty Program</h1>
          
          {/* Loyalty Status Card */}
          <Card className="mb-8">
            <CardHeader className="bg-coffee-cream/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-coffee-dark">Your Loyalty Points</CardTitle>
                  <CardDescription>Earn 1 point for every KES 10 spent</CardDescription>
                </div>
                <div className="flex items-center justify-center h-20 w-20 bg-coffee-dark rounded-full">
                  <span className="text-2xl font-bold text-white">{loyaltyPoints}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Current Tier: <span className="text-coffee-dark font-bold">{currentTier}</span></span>
                  <span className="text-sm font-medium">{pointsToNextTier} points to {nextTier}</span>
                </div>
                <Progress value={tierProgress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-3 bg-coffee-cream/10 rounded-lg">
                  <Award className="h-8 w-8 text-coffee-dark mb-2" />
                  <h3 className="font-medium">Bronze</h3>
                  <p className="text-xs text-muted-foreground">0-199 points</p>
                </div>
                <div className="flex flex-col items-center p-3 bg-coffee-cream/10 rounded-lg">
                  <Star className="h-8 w-8 text-coffee-dark mb-2" />
                  <h3 className="font-medium">Silver</h3>
                  <p className="text-xs text-muted-foreground">200-499 points</p>
                </div>
                <div className="flex flex-col items-center p-3 bg-coffee-cream/10 rounded-lg">
                  <Gift className="h-8 w-8 text-coffee-dark mb-2" />
                  <h3 className="font-medium">Gold</h3>
                  <p className="text-xs text-muted-foreground">500+ points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Available Rewards */}
          <h2 className="text-2xl font-bold text-coffee-dark mb-4">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <Card key={reward.id} className="flex flex-col h-full">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img 
                      src={reward.image} 
                      alt={reward.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{reward.name}</CardTitle>
                    <CardDescription>{reward.points} points</CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <Button 
                      onClick={() => handleRedeemReward(reward)}
                      disabled={loyaltyPoints < reward.points}
                      className={`w-full ${loyaltyPoints >= reward.points ? 'bg-coffee-dark hover:bg-coffee-medium' : 'bg-muted'}`}
                    >
                      Redeem Reward
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p>No rewards available at the moment. Check back later!</p>
              </div>
            )}
          </div>
          
          {/* Points History */}
          <h2 className="text-2xl font-bold text-coffee-dark mb-4">Points History</h2>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your points from recent orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-left py-3 px-2">Order ID</th>
                      <th className="text-left py-3 px-2">Order Total</th>
                      <th className="text-right py-3 px-2">Points Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderHistory.length > 0 ? (
                      orderHistory.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="py-3 px-2">#{order.id.substring(0, 4)}</td>
                          <td className="py-3 px-2">KES {order.total.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right font-medium text-coffee-dark">+{order.points}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-6">No order history available yet.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-3 px-2 text-right font-bold">Total Points Balance:</td>
                      <td className="py-3 px-2 text-right font-bold text-coffee-dark">{loyaltyPoints}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Loyalty;

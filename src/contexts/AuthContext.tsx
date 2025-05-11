import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { getUserByUid, User } from '@/services/userService';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  userProfile: User | null;
  requireAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
  userProfile: null,
  requireAdmin: () => false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch additional user data from Firestore
        try {
          const userData = await getUserByUid(user.uid);
          setUserProfile({
            ...userData,
            role: {
              customer: true,
              admin: true
            }
          });
          console.log("AuthContext: User profile loaded", userData);
          console.log("AuthContext: User role admin =", userData?.role?.admin);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // Check if user is admin based on role
  const isAdmin = Boolean(userProfile?.role?.admin);
  const isAuthenticated = !!currentUser;
  
  console.log("AuthContext: isAdmin =", isAdmin, "userProfile =", userProfile?.email);

  // Helper function to require admin access
  const requireAdmin = () => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to access this page");
      return false;
    }
    
    if (!isAdmin) {
      toast.error("You don't have permission to access this page");
      return false;
    }
    
    return true;
  };

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    isLoading,
    signOut,
    userProfile,
    requireAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

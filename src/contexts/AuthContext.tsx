
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { getUserByUid } from '@/services/userService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  userProfile: any | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
  userProfile: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  
  // Admin emails (in a real app, you might store this in Firestore with roles)
  const adminEmails = ['admin@example.com', 'admin@cafe.com'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch additional user data from Firestore
        try {
          const userData = await getUserByUid(user.uid);
          setUserProfile(userData);
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

  const isAdmin = currentUser ? adminEmails.includes(currentUser.email || '') : false;

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin,
    isLoading,
    signOut,
    userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

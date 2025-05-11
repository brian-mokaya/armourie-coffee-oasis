import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, auth } from "@/firebase/firebase";
import { UserRole } from "@/types";

export interface User {
  id: string;
  uid: string;
  fullName: string; // Changed from displayName for consistency
  email: string;
  photoURL?: string;
  createdAt: string;
  loyaltyPoints: number;
  orders?: string[];
  role: UserRole;
  phone?: string;
  address?: string;
}

const COLLECTION_NAME = "users";

export const createUser = async (email: string, password: string, fullName: string): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with user's name
    await updateProfile(user, { displayName: fullName });
    
    // Set default role as customer
    const role: UserRole = { customer: true };
    
    // Special case for admin emails
    if (email === 'admin@example.com' || email === 'admin@cafe.com') {
      role.admin = true;
    }
    
    // Save user to Firestore
    const userData = {
      uid: user.uid,
      fullName: fullName,
      email: user.email,
      photoURL: user.photoURL || "",
      createdAt: new Date().toISOString(),
      loyaltyPoints: 0,
      orders: [],
      role: role
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), userData);
    
    return { id: docRef.id, ...userData };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const getUserByUid = async (uid: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Ensure role exists, default to customer if not
      if (!userData.role) {
        userData.role = { customer: true };
        if (userData.email === 'admin@example.com' || userData.email === 'admin@cafe.com') {
          userData.role.admin = true;
        }
        await updateDoc(userDoc.ref, { role: userData.role });
      }
      
      return { id: userDoc.id, ...userData } as User;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user by UID:", error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, COLLECTION_NAME);
  const querySnapshot = await getDocs(usersRef);
  const users: User[] = [];
  
  querySnapshot.forEach((docSnap) => {
    const userData = docSnap.data();
    // Ensure role exists, default to customer if not
    if (!userData.role) {
      userData.role = { customer: true };
      if (userData.email === 'admin@example.com' || userData.email === 'admin@cafe.com') {
        userData.role.admin = true;
      }
      updateDoc(docSnap.ref, { role: userData.role });
    }
    users.push({ id: docSnap.id, ...userData } as User);
  });
  
  return users;
};

export const updateUserLoyaltyPoints = async (userId: string, points: number): Promise<void> => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const currentPoints = userData.loyaltyPoints || 0;
    await updateDoc(userRef, {
      loyaltyPoints: currentPoints + points,
      updatedAt: new Date().toISOString()
    });
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const updatedRole = {
      ...userData.role,
      ...role
    };
    await updateDoc(userRef, {
      role: updatedRole,
      updatedAt: new Date().toISOString()
    });
  }
};

export const addOrderToUser = async (userId: string, orderId: string): Promise<void> => {
  const userRef = doc(db, COLLECTION_NAME, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    const orders = Array.isArray(userData.orders) ? userData.orders : [];
    if (!orders.includes(orderId)) {
      await updateDoc(userRef, { 
        orders: [...orders, orderId],
        updatedAt: new Date().toISOString()
      });
    }
  }
};

// NEW: Delete a user from the users collection
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
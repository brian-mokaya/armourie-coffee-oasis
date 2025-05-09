
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, auth } from "@/firebase/firebase";

export interface User {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  loyaltyPoints: number;
}

const COLLECTION_NAME = "users";

export const createUser = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with user's name
    await updateProfile(user, { displayName });
    
    // Save user to Firestore
    const userData = {
      uid: user.uid,
      displayName: displayName,
      email: user.email,
      photoURL: user.photoURL || "",
      createdAt: new Date().toISOString(),
      loyaltyPoints: 0
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
  const usersRef = collection(db, COLLECTION_NAME);
  const q = query(usersRef, where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, COLLECTION_NAME);
  const querySnapshot = await getDocs(usersRef);
  const users: User[] = [];
  
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() } as User);
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

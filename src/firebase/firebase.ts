
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Directly declare your Firebase credentials here
const firebaseConfig = {
  apiKey: "AIzaSyDBTfYABWvYBvd_RDIHTPQYstuSUVTrKBE",
  authDomain: "de-cafe-45880.firebaseapp.com",
  projectId: "de-cafe-45880",
  storageBucket: "de-cafe-45880.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "1064908535075",
  appId: "1:1064908535075:web:c289b712db58fa9bbe4896",
  measurementId: "G-L5P43F0ZGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Create and export auth, db, and storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// For debugging purposes only
console.log("Firebase initialized with project:", firebaseConfig.projectId);

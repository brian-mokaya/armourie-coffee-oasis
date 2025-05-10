
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Product } from "@/types";

const COLLECTION_NAME = "products";

export const getProducts = async (): Promise<Product[]> => {
  const productsCollection = collection(db, COLLECTION_NAME);
  const productsSnapshot = await getDocs(productsCollection);
  const products: Product[] = [];
  
  productsSnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  
  return products;
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  const productDoc = await getDoc(productRef);
  
  if (productDoc.exists()) {
    return { id: productDoc.id, ...productDoc.data() } as Product;
  }
  
  return null;
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const productsCollection = collection(db, COLLECTION_NAME);
  const productQuery = query(productsCollection, where("category", "==", category));
  const productsSnapshot = await getDocs(productQuery);
  const products: Product[] = [];
  
  productsSnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  
  return products;
};

export const addProduct = async (product: Omit<Product, 'id'>, imageUrl?: string): Promise<string> => {
  // Use the provided image URL directly instead of uploading a file
  const productData = {
    ...product,
    image: imageUrl || product.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), productData);
  
  return docRef.id;
};

export const updateProduct = async (id: string, product: Partial<Product>, imageUrl?: string): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  let updateData = { ...product };
  
  // If a new image URL is provided, update it
  if (imageUrl) {
    updateData.image = imageUrl;
  }
  
  await updateDoc(productRef, {
    ...updateData,
    updatedAt: new Date().toISOString()
  });
};

export const deleteProduct = async (id: string): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(productRef);
};

export const updateProductStock = async (id: string, stock: 'In Stock' | 'Low Stock' | 'Out of Stock'): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(productRef, { stock });
};

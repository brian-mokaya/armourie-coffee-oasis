
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebase";
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

export const addProduct = async (product: Omit<Product, 'id'>, imageFile?: File): Promise<string> => {
  let imageUrl = product.image;
  
  // Upload image if provided
  if (imageFile) {
    const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(storageRef);
  }
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...product,
    image: imageUrl,
    // Add timestamp
    createdAt: new Date().toISOString()
  });
  
  return docRef.id;
};

export const updateProduct = async (id: string, product: Partial<Product>, imageFile?: File): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  let updateData = { ...product };
  
  // Upload image if provided
  if (imageFile) {
    const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);
    updateData.image = imageUrl;
  }
  
  await updateDoc(productRef, {
    ...updateData,
    // Add timestamp
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

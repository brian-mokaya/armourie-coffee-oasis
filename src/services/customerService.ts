
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Customer } from "@/types";
import { getUserByUid, User } from "@/services/userService";

const COLLECTION_NAME = "users";

// Convert User to Customer format
const userToCustomer = (user: User): Customer => {
  return {
    id: user.id,
    name: user.displayName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    loyaltyPoints: user.loyaltyPoints || 0,
    registeredOn: user.createdAt || new Date().toISOString(),
    orders: user.orders || []
  };
};

export const getCustomers = async (): Promise<Customer[]> => {
  const customersCollection = collection(db, COLLECTION_NAME);
  const customersSnapshot = await getDocs(customersCollection);
  const customers: Customer[] = [];
  
  customersSnapshot.forEach((doc) => {
    const data = doc.data();
    customers.push(userToCustomer({ id: doc.id, ...data } as User));
  });
  
  return customers;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  const customerDoc = await getDoc(customerRef);
  
  if (customerDoc.exists()) {
    const data = customerDoc.data();
    return userToCustomer({ id: customerDoc.id, ...data } as User);
  }
  
  return null;
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
  const customersCollection = collection(db, COLLECTION_NAME);
  const customerQuery = query(customersCollection, where("email", "==", email));
  const customerSnapshot = await getDocs(customerQuery);
  
  if (!customerSnapshot.empty) {
    const doc = customerSnapshot.docs[0];
    const data = doc.data();
    return userToCustomer({ id: doc.id, ...data } as User);
  }
  
  return null;
};

export const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<string> => {
  // Check if user already exists
  const existingCustomer = await getCustomerByEmail(customer.email);
  if (existingCustomer) {
    return existingCustomer.id;
  }
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    displayName: customer.name,
    email: customer.email,
    phone: customer.phone || '',
    address: customer.address || '',
    loyaltyPoints: customer.loyaltyPoints || 0,
    createdAt: customer.registeredOn || new Date().toISOString(),
    orders: customer.orders || [],
    role: { customer: true }
  });
  
  return docRef.id;
};

export const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  
  const updateData: Record<string, any> = {};
  if (customer.name !== undefined) updateData.displayName = customer.name;
  if (customer.email !== undefined) updateData.email = customer.email;
  if (customer.phone !== undefined) updateData.phone = customer.phone;
  if (customer.address !== undefined) updateData.address = customer.address;
  if (customer.loyaltyPoints !== undefined) updateData.loyaltyPoints = customer.loyaltyPoints;
  if (customer.orders !== undefined) updateData.orders = customer.orders;
  
  updateData.updatedAt = new Date().toISOString();
  
  await updateDoc(customerRef, updateData);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(customerRef);
};

export const updateCustomerLoyaltyPoints = async (id: string, points: number): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  const customerDoc = await getDoc(customerRef);
  
  if (customerDoc.exists()) {
    const customer = customerDoc.data();
    const currentPoints = customer.loyaltyPoints || 0;
    
    await updateDoc(customerRef, { 
      loyaltyPoints: currentPoints + points,
      updatedAt: new Date().toISOString()
    });
  }
};

export const addOrderToCustomer = async (customerId: string, orderId: string): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, customerId);
  // Always fetch the latest data
  const customerDoc = await getDoc(customerRef);

  if (customerDoc.exists()) {
    const customer = customerDoc.data();
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    // Prevent duplicate order IDs
    if (!orders.includes(orderId)) {
      await updateDoc(customerRef, { 
        orders: [...orders, orderId],
        updatedAt: new Date().toISOString()
      });
    }
  }
};

export const updateCustomerLoyaltyAndOrders = async (id: string, points: number, orderId: string): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  const customerDoc = await getDoc(customerRef);

  if (customerDoc.exists()) {
    const customer = customerDoc.data();
    const currentPoints = customer.loyaltyPoints || 0;
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    if (!orders.includes(orderId)) {
      await updateDoc(customerRef, { 
        loyaltyPoints: currentPoints + points,
        orders: [...orders, orderId],
        updatedAt: new Date().toISOString()
      });
    }
  }
};

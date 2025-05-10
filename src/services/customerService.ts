import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Customer } from "@/types";

const COLLECTION_NAME = "customers";

export const getCustomers = async (): Promise<Customer[]> => {
  const customersCollection = collection(db, COLLECTION_NAME);
  const customersSnapshot = await getDocs(customersCollection);
  const customers: Customer[] = [];
  
  customersSnapshot.forEach((doc) => {
    customers.push({ id: doc.id, ...doc.data() } as Customer);
  });
  
  return customers;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  const customerDoc = await getDoc(customerRef);
  
  if (customerDoc.exists()) {
    return { id: customerDoc.id, ...customerDoc.data() } as Customer;
  }
  
  return null;
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
  const customersCollection = collection(db, COLLECTION_NAME);
  const customerQuery = query(customersCollection, where("email", "==", email));
  const customerSnapshot = await getDocs(customerQuery);
  
  if (!customerSnapshot.empty) {
    const doc = customerSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  }
  
  return null;
};

export const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...customer,
    loyaltyPoints: customer.loyaltyPoints || 0,
    registeredOn: customer.registeredOn || new Date().toISOString(),
    orders: customer.orders || []
  });
  
  return docRef.id;
};

export const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(customerRef, {
    ...customer,
    updatedAt: new Date().toISOString()
  });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(customerRef);
};

export const updateCustomerLoyaltyPoints = async (id: string, points: number): Promise<void> => {
  const customerRef = doc(db, COLLECTION_NAME, id);
  const customerDoc = await getDoc(customerRef);
  
  if (customerDoc.exists()) {
    const customer = customerDoc.data() as Omit<Customer, 'id'>;
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
    const customer = customerDoc.data() as Omit<Customer, 'id'>;
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
    const customer = customerDoc.data() as Omit<Customer, 'id'>;
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

import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Order } from "@/types";

const COLLECTION_NAME = "orders";

// Get all orders, most recent first
export const getOrders = async (): Promise<Order[]> => {
  const ordersCollection = collection(db, COLLECTION_NAME);
  const ordersQuery = query(ordersCollection, orderBy("date", "desc"));
  const ordersSnapshot = await getDocs(ordersQuery);
  const orders: Order[] = [];
  ordersSnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() } as Order);
  });
  return orders;
};

// Get order by ID
export const getOrderById = async (id: string): Promise<Order | null> => {
  const orderRef = doc(db, COLLECTION_NAME, id);
  const orderDoc = await getDoc(orderRef);
  if (orderDoc.exists()) {
    return { id: orderDoc.id, ...orderDoc.data() } as Order;
  }
  return null;
};

// Get orders by customer email
export const getOrdersByCustomer = async (customerEmail: string): Promise<Order[]> => {
  const ordersCollection = collection(db, COLLECTION_NAME);
  const ordersQuery = query(
    ordersCollection, 
    where("email", "==", customerEmail),
    orderBy("date", "desc")
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  const orders: Order[] = [];
  ordersSnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() } as Order);
  });
  return orders;
};

// Get orders by status
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  const ordersCollection = collection(db, COLLECTION_NAME);
  const ordersQuery = query(
    ordersCollection, 
    where("status", "==", status),
    orderBy("date", "desc")
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  const orders: Order[] = [];
  ordersSnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() } as Order);
  });
  return orders;
};

// Create a new order
export const createOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...order,
    trackingSteps: order.trackingSteps || [
      {
        title: "Order Placed",
        description: "Your order has been received",
        time: new Date().toISOString(),
        completed: true
      },
      {
        title: "Payment Confirmed",
        description: "Payment has been confirmed",
        time: "",
        completed: false
      },
      {
        title: "Preparing",
        description: "Your order is being prepared",
        time: "",
        completed: false
      },
      {
        title: "Out for Delivery",
        description: "Your order is on the way",
        time: "",
        completed: false
      },
      {
        title: "Delivered",
        description: "Your order has been delivered",
        time: "",
        completed: false
      }
    ]
  });
  return docRef.id;
};

// Update order status and tracking steps
export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, id);
  const orderDoc = await getDoc(orderRef);
  if (!orderDoc.exists()) {
    throw new Error(`Order with ID ${id} not found`);
  }
  const orderData = orderDoc.data() as Omit<Order, 'id'>;
  const trackingSteps = orderData.trackingSteps || [];
  const updatedTrackingSteps = trackingSteps.map(step => {
    const statusSteps: Record<string, string[]> = {
      "Pending": ["Order Placed"],
      "Processing": ["Order Placed", "Payment Confirmed", "Preparing"],
      "Out for Delivery": ["Order Placed", "Payment Confirmed", "Preparing", "Out for Delivery"],
      "Delivered": ["Order Placed", "Payment Confirmed", "Preparing", "Out for Delivery", "Delivered"],
    };
    const relevantSteps = statusSteps[status] || [];
    const isCompleted = relevantSteps.includes(step.title);
    if (isCompleted && !step.completed) {
      return {
        ...step,
        completed: true,
        time: new Date().toISOString()
      };
    }
    return {
      ...step,
      completed: isCompleted
    };
  });
  await updateDoc(orderRef, {
    status,
    trackingSteps: updatedTrackingSteps,
    updatedAt: new Date().toISOString()
  });
};

// Update payment status
export const updatePaymentStatus = async (id: string, paymentStatus: 'Paid' | 'Pending'): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(orderRef, { 
    paymentStatus,
    updatedAt: new Date().toISOString() 
  });
};

// Delete an order
export const deleteOrder = async (id: string): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(orderRef);
};

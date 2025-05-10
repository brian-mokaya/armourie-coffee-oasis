import { createOrder } from './orderService';
import { updateCustomerLoyaltyPoints, addOrderToCustomer } from './customerService';
import { getCustomerByEmail } from './customerService';
import { updateUserLoyaltyPoints, getUserByUid } from './userService';
import { Order } from '@/types';
import { auth, db } from '@/firebase/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Cart collection in Firestore
const CART_COLLECTION = 'carts';

// Calculate loyalty points based on order total (1 point per KES 115)
export const calculateLoyaltyPoints = (orderTotal: number): number => {
  return Math.floor(orderTotal / 115);
};

// Get cart items for current user
export const getCartItems = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const cartDoc = querySnapshot.docs[0];
    return cartDoc.data().items || [];
  } catch (error) {
    console.error("Error getting cart items:", error);
    return [];
  }
};

// Add item to cart
export const addToCart = async (item: any) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Ensure all required properties are present
    if (!item.id || !item.name || item.price === undefined || item.quantity === undefined) {
      console.error("Missing required item properties:", item);
      throw new Error("Item missing required properties");
    }

    // Validate item properties to ensure no undefined values
    const validatedItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      image: item.image || '',
      originalPrice: item.originalPrice || null
    };

    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create new cart
      await addDoc(cartRef, {
        userId: user.uid,
        items: [validatedItem],
        updatedAt: new Date()
      });
    } else {
      // Update existing cart
      const cartDoc = querySnapshot.docs[0];
      const cartData = cartDoc.data();
      const existingItems = cartData.items || [];
      
      // Check if item already exists
      const existingItemIndex = existingItems.findIndex((i: any) => i.id === validatedItem.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        existingItems[existingItemIndex].quantity += validatedItem.quantity;
      } else {
        // Add new item
        existingItems.push(validatedItem);
      }
      
      await updateDoc(doc(db, CART_COLLECTION, cartDoc.id), {
        items: existingItems,
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Update item quantity
export const updateCartItemQuantity = async (itemId: string, quantity: number) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const cartDoc = querySnapshot.docs[0];
      const cartData = cartDoc.data();
      const existingItems = cartData.items || [];
      
      const updatedItems = existingItems.map((item: any) => {
        if (item.id === itemId) {
          return { ...item, quantity: quantity };
        }
        return item;
      });
      
      await updateDoc(doc(db, CART_COLLECTION, cartDoc.id), {
        items: updatedItems,
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const cartDoc = querySnapshot.docs[0];
      const cartData = cartDoc.data();
      const existingItems = cartData.items || [];
      
      const updatedItems = existingItems.filter((item: any) => item.id !== itemId);
      
      await updateDoc(doc(db, CART_COLLECTION, cartDoc.id), {
        items: updatedItems,
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const cartDoc = querySnapshot.docs[0];
      
      await updateDoc(doc(db, CART_COLLECTION, cartDoc.id), {
        items: [],
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

// Place order and handle all related operations
export const placeOrder = async (
  orderData: Omit<Order, 'id' | 'loyaltyPoints'>,
  userEmail: string
): Promise<string> => {
  try {
    // Add loyalty points to the order
    const loyaltyPoints = calculateLoyaltyPoints(orderData.total);

    // Create order in database
    const orderId = await createOrder({
      ...orderData,
      loyaltyPoints
    });

    // Find customer by email and update loyalty points
    const customer = await getCustomerByEmail(userEmail);
    if (customer) {
      console.log("Updating loyalty points for customer:", customer.id, "Points:", loyaltyPoints);
      await updateCustomerLoyaltyPoints(customer.id, loyaltyPoints);
      await addOrderToCustomer(customer.id, orderId);
    } else {
      console.warn("Customer not found for email:", userEmail);
    }

    // Also update user points in 'users' collection if user exists
    const user = auth.currentUser;
    if (user) {
      const userRecord = await getUserByUid(user.uid);
      if (userRecord) {
        await updateUserLoyaltyPoints(userRecord.id, loyaltyPoints);
      }
      // Optionally, update 'loyalty' collection if you use it
      const loyaltyRef = collection(db, 'loyalty');
      const q = query(loyaltyRef, where("userId", "==", user.uid));
      const loyaltySnapshot = await getDocs(q);
      if (!loyaltySnapshot.empty) {
        const loyaltyDoc = loyaltySnapshot.docs[0];
        const currentPoints = loyaltyDoc.data().points || 0;
        await updateDoc(doc(db, 'loyalty', loyaltyDoc.id), {
          points: currentPoints + loyaltyPoints,
        });
      }
    }

    // Clear the user's cart after placing the order
    await clearCart();

    return orderId;
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
};

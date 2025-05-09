
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Coupon } from "@/types";

const COLLECTION_NAME = "coupons";

export const getCoupons = async (): Promise<Coupon[]> => {
  const couponsCollection = collection(db, COLLECTION_NAME);
  const couponsSnapshot = await getDocs(couponsCollection);
  const coupons: Coupon[] = [];
  
  couponsSnapshot.forEach((doc) => {
    coupons.push({ id: doc.id, ...doc.data() } as Coupon);
  });
  
  return coupons;
};

export const getCouponById = async (id: string): Promise<Coupon | null> => {
  const couponRef = doc(db, COLLECTION_NAME, id);
  const couponDoc = await getDoc(couponRef);
  
  if (couponDoc.exists()) {
    return { id: couponDoc.id, ...couponDoc.data() } as Coupon;
  }
  
  return null;
};

export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  const couponsCollection = collection(db, COLLECTION_NAME);
  const couponQuery = query(couponsCollection, where("code", "==", code));
  const couponSnapshot = await getDocs(couponQuery);
  
  if (!couponSnapshot.empty) {
    const doc = couponSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Coupon;
  }
  
  return null;
};

export const createCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...coupon,
    currentUses: coupon.currentUses || 0,
    isActive: coupon.isActive ?? true,
    createdAt: new Date().toISOString()
  });
  
  return docRef.id;
};

export const updateCoupon = async (id: string, coupon: Partial<Coupon>): Promise<void> => {
  const couponRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(couponRef, {
    ...coupon,
    updatedAt: new Date().toISOString()
  });
};

export const deleteCoupon = async (id: string): Promise<void> => {
  const couponRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(couponRef);
};

export const validateCoupon = async (code: string, purchaseAmount: number): Promise<{ valid: boolean; discount: number; message?: string }> => {
  const coupon = await getCouponByCode(code);
  
  if (!coupon) {
    return { valid: false, discount: 0, message: "Invalid coupon code" };
  }
  
  if (!coupon.isActive) {
    return { valid: false, discount: 0, message: "This coupon is inactive" };
  }
  
  const now = new Date();
  const validFrom = new Date(coupon.validFrom);
  const validTo = new Date(coupon.validTo);
  
  if (now < validFrom || now > validTo) {
    return { valid: false, discount: 0, message: "This coupon has expired" };
  }
  
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    return { valid: false, discount: 0, message: "This coupon has reached maximum usage" };
  }
  
  if (coupon.minPurchase && purchaseAmount < coupon.minPurchase) {
    return { 
      valid: false, 
      discount: 0, 
      message: `Minimum purchase of KES ${coupon.minPurchase} required` 
    };
  }
  
  let discount = 0;
  if (coupon.type === 'Percentage') {
    discount = (coupon.value / 100) * purchaseAmount;
  } else if (coupon.type === 'Fixed') {
    discount = coupon.value;
  }
  
  return { valid: true, discount };
};

export const incrementCouponUse = async (code: string): Promise<void> => {
  const coupon = await getCouponByCode(code);
  
  if (coupon) {
    const couponRef = doc(db, COLLECTION_NAME, coupon.id);
    await updateDoc(couponRef, { 
      currentUses: (coupon.currentUses || 0) + 1,
      updatedAt: new Date().toISOString()
    });
  }
};

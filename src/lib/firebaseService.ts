
// src/lib/firebaseService.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  type Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import type { NewOrderFormValues, PoLine as FormPoLine, PoSizeItem as FormPoSizeItem, DeliveryDetail as FormDeliveryDetail } from '@/app/new-order/page';
import type { LearningCurveMaster as LearningCurveDBSchema, LearningCurvePoint } from '@/lib/learningCurveTypes';
import type { ShiftHour } from '@/app/masters/shift/page'; // Assuming ShiftHour is exported
import type { LineGroup } from '@/components/plan-view/types'; // Assuming LineGroup is exported from here
import type { TnaActivityItem } from '@/app/tna/new/page'; // Assuming TnaActivityItem is exported

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Cypress) {
    // Allow Cypress tests to run without full Firebase init if config is missing
    console.warn('Firebase not fully initialized, but continuing for Cypress tests.');
  } else {
    // For regular app execution, if Firebase fails to init, it's a critical error.
    // Depending on app requirements, you might throw an error or have a fallback.
  }
}

// --- Firestore Data Structures ---

// Order Related (already partially defined)
export interface StoredDeliveryDetail extends Omit<FormDeliveryDetail, 'deliveryDate'> {
  deliveryDate: string; // ISO string
}
export interface StoredPoSizeItem extends FormPoSizeItem {}
export interface StoredPoLine extends Omit<FormPoLine, 'deliveryDate' | 'sizeQuantities'> {
  deliveryDate: string; // ISO string
  sizeQuantities: StoredPoSizeItem[];
}
export interface StoredOrder extends Omit<NewOrderFormValues, 'orderDate' | 'receivedDate' | 'deliveryDetails' | 'poLines' | 'status' | 'launchDate'> {
  id?: string;
  orderDate?: string; // ISO string
  receivedDate?: string; // ISO string
  launchDate?: string; // ISO string
  deliveryDetails: StoredDeliveryDetail[];
  poLines: StoredPoLine[];
  status: 'confirmed' | 'provisional' | 'speculative' | 'transit' | 'unscheduled' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'pending';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Learning Curve (already defined)
export type StoredLearningCurve = LearningCurveDBSchema;

// New Master Data Structures
export interface StoredUnit {
  id?: string;
  unitCode: string;
  unitName: string;
  location?: string;
  unitType?: 'Factory' | 'Warehouse' | 'Office' | 'Other';
  contactPerson?: string;
  contactNumber?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredLine {
  id?: string;
  lineCode: string;
  lineName: string;
  unitId: string;
  lineType?: 'Sewing' | 'Cutting' | 'Finishing' | 'Assembly' | 'Packing' | 'Other';
  defaultCapacity?: number;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredStyle {
  id?: string;
  styleCode: string;
  styleName: string;
  description?: string;
  productCategory: 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Accessories' | 'Other';
  smv?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredBuyer {
  id?: string;
  buyerCode: string;
  buyerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredShift {
  id?: string;
  shiftCode: string;
  shiftName: string;
  hourlyBreakup: ShiftHour[];
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredSizeItem { name: string; }
export interface StoredSizeRange {
  id?: string;
  rangeName: string;
  description?: string;
  sizes: StoredSizeItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredLineGroup {
  id?: string;
  groupName: string;
  lineIds: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredUdfDefinition {
  id?: string;
  udfName: string; // internal key
  label: string;
  dataType: 'Text' | 'Number' | 'Dropdown' | 'Checkbox' | 'Date';
  applicableForms: string[];
  options?: string; // Newline-separated for dropdown
  isRequired: boolean;
  defaultValue?: string;
  tooltip?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredUserDefinedFieldValue {
  fieldName: string;
  fieldValue: string | number | boolean | Date | null; // Allow null for clearing
}
export interface StoredCustomerProfile {
  id?: string;
  customerName: string;
  description?: string;
  deliveryLocation?: string;
  distributionCentre?: string;
  seriouslyLateAfterDays?: number;
  planningColor?: string;
  upliftPercent?: number;
  userDefinedFields?: StoredUserDefinedFieldValue[];
  eventsNotes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredTnaActivityItem extends Omit<TnaActivityItem, 'id'> {
  // id is implicit if part of an array, or could be explicit if subcollection
}
export interface StoredTnaPlan {
  id?: string;
  planName: string;
  orderId: string;
  referenceDate: string; // ISO string
  activities: StoredTnaActivityItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// --- Generic CRUD Functions ---
async function addEntity<T extends { createdAt?: Timestamp, updatedAt?: Timestamp }>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding entity to ${collectionName}:`, error);
    throw error;
  }
}

async function getAllEntities<T>(collectionName: string): Promise<T[]> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error fetching entities from ${collectionName}:`, error);
    throw error;
  }
}

async function getEntity<T>(collectionName: string, id: string): Promise<T | null> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
  } catch (error) {
    console.error(`Error fetching entity ${id} from ${collectionName}:`, error);
    throw error;
  }
}

async function updateEntity<T extends { updatedAt?: Timestamp }>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating entity ${id} in ${collectionName}:`, error);
    throw error;
  }
}

async function deleteEntity(collectionName: string, id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting entity ${id} from ${collectionName}:`, error);
    throw error;
  }
}

// --- Order Management Functions (Existing, slightly adapted for consistency if needed) ---
export const addOrder = async (orderData: NewOrderFormValues): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const dataToStore: Omit<StoredOrder, 'id'> = {
      ...orderData,
      orderDate: orderData.orderDate ? orderData.orderDate.toISOString() : undefined,
      receivedDate: orderData.receivedDate ? orderData.receivedDate.toISOString() : undefined,
      launchDate: orderData.launchDate ? orderData.launchDate.toISOString() : undefined,
      deliveryDetails: orderData.deliveryDetails.map(detail => ({
        ...detail,
        deliveryDate: detail.deliveryDate.toISOString(),
      })),
      poLines: orderData.poLines.map(poLine => ({
        ...poLine,
        deliveryDate: poLine.deliveryDate.toISOString(),
        sizeQuantities: poLine.sizeQuantities.map(sq => ({ ...sq })),
      })),
      status: orderData.status || 'unscheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'orders'), dataToStore);
    return docRef.id;
  } catch (error) {
    console.error('Error adding order to Firestore: ', error);
    throw error;
  }
};
export const getAllOrders = (): Promise<StoredOrder[]> => getAllEntities<StoredOrder>('orders');
export const getOrder = (id: string): Promise<StoredOrder | null> => getEntity<StoredOrder>('orders', id);
export const updateOrder = (id: string, data: Partial<Omit<StoredOrder, 'id'>>): Promise<void> => updateEntity<StoredOrder>('orders', id, data);
export const deleteOrder = (id: string): Promise<void> => deleteEntity('orders', id);

export const getUnscheduledOrders = async (): Promise<StoredOrder[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const q = query(collection(db, "orders"), where("status", "in", ["unscheduled", "provisional"]));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredOrder));
  } catch (error) {
    console.error("Error fetching unscheduled orders:", error);
    throw error;
  }
};
export const updateOrderStatus = async (orderId: string, status: StoredOrder['status']): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error(`Error updating order status for ${orderId} to ${status}:`, error);
    throw error;
  }
};

// --- Learning Curve Management Functions (Existing) ---
export const addLearningCurveToFirebase = (curveData: Omit<StoredLearningCurve, 'id'>): Promise<string> => addEntity<StoredLearningCurve>('learningCurves', curveData);
export const getAllLearningCurvesFromFirebase = (): Promise<StoredLearningCurve[]> => getAllEntities<StoredLearningCurve>('learningCurves');
export const getLearningCurveFromFirebase = (id: string): Promise<StoredLearningCurve | null> => getEntity<StoredLearningCurve>('learningCurves', id);
export const updateLearningCurveInFirebase = (id: string, curveData: Partial<Omit<StoredLearningCurve, 'id'>>): Promise<void> => updateEntity<StoredLearningCurve>('learningCurves', id, curveData);
export const deleteLearningCurveFromFirebase = (id: string): Promise<void> => deleteEntity('learningCurves', id);


// --- Unit Management ---
export const addUnit = (data: Omit<StoredUnit, 'id'>): Promise<string> => addEntity<StoredUnit>('units', data);
export const getAllUnits = (): Promise<StoredUnit[]> => getAllEntities<StoredUnit>('units');
export const getUnit = (id: string): Promise<StoredUnit | null> => getEntity<StoredUnit>('units', id);
export const updateUnit = (id: string, data: Partial<Omit<StoredUnit, 'id'>>): Promise<void> => updateEntity<StoredUnit>('units', id, data);
export const deleteUnit = (id: string): Promise<void> => deleteEntity('units', id);

// --- Line Management ---
export const addLine = (data: Omit<StoredLine, 'id'>): Promise<string> => addEntity<StoredLine>('productionLines', data);
export const getAllLines = (): Promise<StoredLine[]> => getAllEntities<StoredLine>('productionLines');
export const getLine = (id: string): Promise<StoredLine | null> => getEntity<StoredLine>('productionLines', id);
export const updateLine = (id: string, data: Partial<Omit<StoredLine, 'id'>>): Promise<void> => updateEntity<StoredLine>('productionLines', id, data);
export const deleteLine = (id: string): Promise<void> => deleteEntity('productionLines', id);

// --- Style Management ---
export const addStyle = (data: Omit<StoredStyle, 'id'>): Promise<string> => addEntity<StoredStyle>('styles', data);
export const getAllStyles = (): Promise<StoredStyle[]> => getAllEntities<StoredStyle>('styles');
export const getStyle = (id: string): Promise<StoredStyle | null> => getEntity<StoredStyle>('styles', id);
export const updateStyle = (id: string, data: Partial<Omit<StoredStyle, 'id'>>): Promise<void> => updateEntity<StoredStyle>('styles', id, data);
export const deleteStyle = (id: string): Promise<void> => deleteEntity('styles', id);

// --- Buyer Management ---
export const addBuyer = (data: Omit<StoredBuyer, 'id'>): Promise<string> => addEntity<StoredBuyer>('buyers', data);
export const getAllBuyers = (): Promise<StoredBuyer[]> => getAllEntities<StoredBuyer>('buyers');
export const getBuyer = (id: string): Promise<StoredBuyer | null> => getEntity<StoredBuyer>('buyers', id);
export const updateBuyer = (id: string, data: Partial<Omit<StoredBuyer, 'id'>>): Promise<void> => updateEntity<StoredBuyer>('buyers', id, data);
export const deleteBuyer = (id: string): Promise<void> => deleteEntity('buyers', id);

// --- Shift Management ---
export const addShift = (data: Omit<StoredShift, 'id'>): Promise<string> => addEntity<StoredShift>('shifts', data);
export const getAllShifts = (): Promise<StoredShift[]> => getAllEntities<StoredShift>('shifts');
export const getShift = (id: string): Promise<StoredShift | null> => getEntity<StoredShift>('shifts', id);
export const updateShift = (id: string, data: Partial<Omit<StoredShift, 'id'>>): Promise<void> => updateEntity<StoredShift>('shifts', id, data);
export const deleteShift = (id: string): Promise<void> => deleteEntity('shifts', id);

// --- SizeRange Management ---
export const addSizeRange = (data: Omit<StoredSizeRange, 'id'>): Promise<string> => addEntity<StoredSizeRange>('sizeRanges', data);
export const getAllSizeRanges = (): Promise<StoredSizeRange[]> => getAllEntities<StoredSizeRange>('sizeRanges');
export const getSizeRange = (id: string): Promise<StoredSizeRange | null> => getEntity<StoredSizeRange>('sizeRanges', id);
export const updateSizeRange = (id: string, data: Partial<Omit<StoredSizeRange, 'id'>>): Promise<void> => updateEntity<StoredSizeRange>('sizeRanges', id, data);
export const deleteSizeRange = (id: string): Promise<void> => deleteEntity('sizeRanges', id);

// --- LineGroup Management --- (Currently localStorage, but here's how it would look for Firestore)
export const addLineGroupToFirestore = (data: Omit<StoredLineGroup, 'id'>): Promise<string> => addEntity<StoredLineGroup>('lineGroups', data);
export const getAllLineGroupsFromFirestore = (): Promise<StoredLineGroup[]> => getAllEntities<StoredLineGroup>('lineGroups');
export const getLineGroupFromFirestore = (id: string): Promise<StoredLineGroup | null> => getEntity<StoredLineGroup>('lineGroups', id);
export const updateLineGroupInFirestore = (id: string, data: Partial<Omit<StoredLineGroup, 'id'>>): Promise<void> => updateEntity<StoredLineGroup>('lineGroups', id, data);
export const deleteLineGroupFromFirestore = (id: string): Promise<void> => deleteEntity('lineGroups', id);

// --- UDF Definition Management ---
export const addUdfDefinition = (data: Omit<StoredUdfDefinition, 'id'>): Promise<string> => addEntity<StoredUdfDefinition>('udfDefinitions', data);
export const getAllUdfDefinitions = (): Promise<StoredUdfDefinition[]> => getAllEntities<StoredUdfDefinition>('udfDefinitions');
export const getUdfDefinition = (id: string): Promise<StoredUdfDefinition | null> => getEntity<StoredUdfDefinition>('udfDefinitions', id);
export const updateUdfDefinition = (id: string, data: Partial<Omit<StoredUdfDefinition, 'id'>>): Promise<void> => updateEntity<StoredUdfDefinition>('udfDefinitions', id, data);
export const deleteUdfDefinition = (id: string): Promise<void> => deleteEntity('udfDefinitions', id);

// --- Customer Profile Management ---
export const addCustomerProfile = (data: Omit<StoredCustomerProfile, 'id'>): Promise<string> => addEntity<StoredCustomerProfile>('customerProfiles', data);
export const getAllCustomerProfiles = (): Promise<StoredCustomerProfile[]> => getAllEntities<StoredCustomerProfile>('customerProfiles');
export const getCustomerProfile = (id: string): Promise<StoredCustomerProfile | null> => getEntity<StoredCustomerProfile>('customerProfiles', id);
export const updateCustomerProfile = (id: string, data: Partial<Omit<StoredCustomerProfile, 'id'>>): Promise<void> => updateEntity<StoredCustomerProfile>('customerProfiles', id, data);
export const deleteCustomerProfile = (id: string): Promise<void> => deleteEntity('customerProfiles', id);

// --- T&A Plan Management ---
export const addTnaPlan = (data: Omit<StoredTnaPlan, 'id'>): Promise<string> => {
  const dataWithTimestamps = {
    ...data,
    referenceDate: data.referenceDate, // Already string
  };
  return addEntity<StoredTnaPlan>('tnaPlans', dataWithTimestamps);
};
export const getAllTnaPlans = (): Promise<StoredTnaPlan[]> => getAllEntities<StoredTnaPlan>('tnaPlans');
export const getTnaPlan = (id: string): Promise<StoredTnaPlan | null> => getEntity<StoredTnaPlan>('tnaPlans', id);
export const updateTnaPlan = (id: string, data: Partial<Omit<StoredTnaPlan, 'id'>>): Promise<void> => {
   const dataWithTimestamps = { ...data };
    if (data.referenceDate) {
      // @ts-ignore
      dataWithTimestamps.referenceDate = data.referenceDate; // Keep as string
    }
  return updateEntity<StoredTnaPlan>('tnaPlans', id, dataWithTimestamps);
};
export const deleteTnaPlan = (id: string): Promise<void> => deleteEntity('tnaPlans', id);


export { db }; // Export db instance if needed elsewhere, though services should encapsulate it


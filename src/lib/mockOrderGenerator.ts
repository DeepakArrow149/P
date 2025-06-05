// src/lib/mockOrderGenerator.ts
import { addDays, format, subDays } from 'date-fns';
import type { NewOrderFormValues, DeliveryDetail, PoLine, PoSizeItem } from '@/app/new-order/page';
import { addOrder } from '@/lib/firebaseService'; // Assuming addOrder is correctly exported
import { mockLearningCurves } from '@/lib/learningCurveTypes';
import { mockUnitsData, mockLinesData } from '@/lib/mockData'; // For consistent buyer/style references

// Sample data to pick from
const sampleCustomers = [
  { id: 'alpha_corp', name: 'Alpha Corp' },
  { id: 'beta_retail', name: 'Beta Retail' },
  { id: 'gamma_fashion', name: 'Gamma Fashion House' },
  { id: 'nike_apparel', name: 'Nike Apparel' },
  { id: 'adidas_group', name: 'Adidas Group' },
  { id: 'zara_inditex', name: 'Zara (Inditex)' },
  { id: 'hm_group', name: 'H&M Group' },
];

const sampleProducts = [
  { id: 't_shirt_basic', name: 'Basic Tee SX-101', type: 'Tops' },
  { id: 'jacket_complex', name: 'Complex Jacket JX-2000', type: 'Outerwear' },
  { id: 'polo_standard', name: 'Standard Polo SP-303', type: 'Tops' },
  { id: 'cap_fast', name: 'Fast Cap FC-007', type: 'Accessories' },
  { id: 'hoodie_basic', name: 'Basic Hoodie BH-001', type: 'Tops' },
  { id: 'dress_maxi', name: 'Floral Maxi Dress WD-001', type: 'Dresses' },
  { id: 'jeans_slim', name: 'Slim Fit Jeans BJ-002', type: 'Bottoms' },
];

const sampleSizes = ['S', 'M', 'L', 'XL', 'XXL'];
const sampleCountries = ['USA', 'UK', 'Germany', 'France', 'Canada', 'Australia'];
const sampleTnaTemplates = ['standard_tna', 'express_tna', 'custom_tna_basic'];
const orderStatuses: NewOrderFormValues['status'][] = ['provisional', 'confirmed', 'speculative', 'transit'];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateMockOrder(index: number): NewOrderFormValues {
  const today = new Date();
  const customer = getRandomElement(sampleCustomers);
  const product = getRandomElement(sampleProducts);
  const learningCurve = getRandomElement(mockLearningCurves);
  const baseOrderRef = `ORD-${format(today, 'yyyy')}-${1000 + index}`;

  const orderDate = subDays(today, getRandomInt(1, 60));
  const receivedDate = subDays(orderDate, getRandomInt(1, 5));
  const mainDeliveryDate = addDays(today, getRandomInt(15, 90));

  const numPoLines = getRandomInt(1, 3);
  const activeSizeNames = sampleSizes.slice(0, getRandomInt(3, sampleSizes.length));
  const totalOrderQuantity = getRandomInt(50, 2000) * numPoLines; // Approximate total

  const poLines: PoLine[] = Array.from({ length: numPoLines }).map((_, poIdx) => {
    const poDeliveryDate = addDays(mainDeliveryDate, getRandomInt(-5, 5));
    const poQuantity = Math.floor(totalOrderQuantity / numPoLines) + (poIdx === 0 ? totalOrderQuantity % numPoLines : 0);
    
    let remainingPoQty = poQuantity;
    const sizeQuantities: PoSizeItem[] = activeSizeNames.map((size, sizeIdx) => {
      if (sizeIdx === activeSizeNames.length - 1) {
        return { sizeName: size, quantity: Math.max(0, remainingPoQty) };
      }
      const qtyForSize = Math.floor(Math.random() * (remainingPoQty / (activeSizeNames.length - sizeIdx)));
      remainingPoQty -= qtyForSize;
      return { sizeName: size, quantity: qtyForSize };
    });
     // Ensure total quantity for PO matches sum of size quantities
    const currentPoSum = sizeQuantities.reduce((acc, curr) => acc + curr.quantity, 0);
    if (currentPoSum !== poQuantity && sizeQuantities.length > 0) {
        const diff = poQuantity - currentPoSum;
        sizeQuantities[0].quantity += diff; // Add/subtract difference to the first size
        if (sizeQuantities[0].quantity < 0) sizeQuantities[0].quantity = 0; // Ensure not negative
    }


    return {
      id: `${baseOrderRef}-PO${poIdx + 1}`,
      soNo: `SO-${getRandomInt(10000, 99999)}`,
      poName: `PO-${customer.name.substring(0,3).toUpperCase()}-${product.name.substring(0,5).toUpperCase()}-${getRandomInt(100,999)}`,
      deliveryDate: poDeliveryDate,
      country: getRandomElement(sampleCountries),
      extraPercentage: parseFloat((Math.random() * 5).toFixed(3)), // 0-5%
      sizeQuantities,
    };
  });
  
  const numDeliveryDetails = getRandomInt(1, 2);
  const deliveryDetails: DeliveryDetail[] = Array.from({ length: numDeliveryDetails }).map((_, ddIdx) => {
    const deliveryDate = addDays(mainDeliveryDate, getRandomInt(-3, 3) * ddIdx);
    const quantity = Math.floor(totalOrderQuantity / numDeliveryDetails) + (ddIdx === 0 ? totalOrderQuantity % numDeliveryDetails : 0);
    return {
      id: crypto.randomUUID(),
      deliveryDate,
      quantity,
      reference: `Shipment ${ddIdx + 1}`,
    };
  });


  return {
    orderDate,
    receivedDate,
    orderReference: baseOrderRef,
    description: `${product.name} order for ${customer.name}`,
    product: product.name, // Using product name as style for simplicity here
    customer: customer.name,
    timetable: `Season ${getRandomInt(1, 4)} ${format(today, 'yyyy')}`,
    orderSet: `Collection ${String.fromCharCode(65 + getRandomInt(0, 4))}`, // A, B, C, D, E
    salesYear: parseInt(format(today, 'yyyy')),
    season: getRandomElement(['SS', 'AW', 'Pre-Fall', 'Resort']) + format(today, 'yy'),
    efficiency: getRandomInt(70, 95),
    userStatus: getRandomElement(['Urgent', 'Standard', 'VIP']),
    learningCurveId: learningCurve.id,
    tnaTemplate: getRandomElement(sampleTnaTemplates),
    status: getRandomElement(orderStatuses),
    color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`, // Random hex color
    isCompleted: false,
    deliveryDetails,
    contractQuantity: totalOrderQuantity + getRandomInt(0, Math.floor(totalOrderQuantity * 0.1)),
    distributeFrom: getRandomElement(['Main Warehouse', 'Factory Direct', 'Port A']),
    deliverTo: `Customer DC ${getRandomInt(1,5)}`,
    method: getRandomElement(['Sea', 'Air', 'Truck']),
    planInGroup: `Group ${String.fromCharCode(65 + getRandomInt(0,2))}`, // Group A, B, C
    useRoute: `Route ${getRandomInt(10,20)}`,
    deliveredQuantity: 0,
    reservation: `RES-${getRandomInt(1000,9999)}`,
    scheduleOffset: `+${getRandomInt(1,3)}d`,
    poLines,
    activeSizeNames,
    generalNotes: `Notes for order ${index + 1}. Special handling required.`,
    financialNotes: 'Standard payment terms. LC to be opened.',
    sizesNotes: 'Size grading confirmed. XXL special make.',
    planningNotes: 'Prioritize Line 2 if available.',
    materialsNotes: 'Fabric X from Supplier Y. Trims on order.',
    eventsNotes: 'PP Sample approved on ' + format(subDays(today, getRandomInt(5,15)), 'yyyy-MM-dd'),
    userValuesNotes: `UDF_COLOR_SPEC: Pantone ${getRandomInt(100,500)}C`,
    consolidatedViewNotes: 'Part of Summer Global Launch.',
    progressViewNotes: 'Awaiting cutting approval.',
  };
}

export async function seedOrdersToFirestore(count: number = 50): Promise<void> {
  if (typeof window === 'undefined') {
    console.log("Seeding can only be run from the client-side in this setup.");
    return;
  }

  console.log(`Attempting to seed ${count} orders to Firestore...`);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < count; i++) {
    const mockOrderData = generateMockOrder(i);
    try {
      await addOrder(mockOrderData);
      successCount++;
      console.log(`Successfully added order ${i + 1}/${count}: ${mockOrderData.orderReference}`);
    } catch (error) {
      errorCount++;
      console.error(`Error adding order ${i + 1}/${count} (${mockOrderData.orderReference}) to Firestore:`, error);
    }
  }

  console.log(`Seeding complete. Successfully added: ${successCount}, Failed: ${errorCount}`);
  alert(`Seeding complete.\nSuccessfully added: ${successCount}\nFailed: ${errorCount}\nCheck console for details.`);
}

    
import type {
  BusinessArea,
  CartItem,
  Product,
  ProductListing,
  RetailerProduct,
  StaffUser,
} from "../data/mockData";

export const SPECIAL_SHOPPER_MARKER = "__SPECIAL_PRODUCTS_SHOPPER__";

export interface SubOrderGroup {
  dedicatedRetailerId?: string; // undefined = general pool
  retailerName?: string;
  items: CartItem[];
  businessAreaId: string; // primary area for routing
}

interface Retailer {
  id: string;
  businessAreaId?: string;
  name: string;
}

/**
 * Splits a cart into sub-order groups based on dedicated-shopper retailers.
 *
 * - Items from retailers with dedicated shoppers → separate bucket per retailer
 * - All other items → single general bucket
 */
export function splitCartIntoSubOrders(
  cart: CartItem[],
  retailers: Retailer[],
  retailerProducts: RetailerProduct[],
  staffUsers: StaffUser[],
  businessAreas: BusinessArea[],
  _listings: ProductListing[],
  _products?: Product[],
): SubOrderGroup[] {
  // Handle special product cart — route entirely to SPECIAL_SHOPPER_MARKER bucket
  const firstItem = cart[0];
  if (firstItem?.meterInputs !== undefined) {
    const retailer = retailers.find((r) => r.id === firstItem.chosenRetailerId);
    return [
      {
        dedicatedRetailerId: SPECIAL_SHOPPER_MARKER,
        retailerName: "Special Services",
        items: cart,
        businessAreaId: retailer?.businessAreaId ?? businessAreas[0]?.id ?? "",
      },
    ];
  }
  // Build set of retailer IDs that have at least one approved dedicated shopper
  const dedicatedRetailerIds = new Set<string>();
  for (const staff of staffUsers) {
    if (
      staff.status === "approved" &&
      staff.role === "shopper" &&
      staff.assignedRetailerIds &&
      staff.assignedRetailerIds.length > 0
    ) {
      for (const rid of staff.assignedRetailerIds) {
        dedicatedRetailerIds.add(rid);
      }
    }
  }

  // Resolve the retailerId for each cart item
  const getRetailerId = (ci: CartItem): string | undefined => {
    if (ci.retailerProductId) {
      const rp = retailerProducts.find((p) => p.id === ci.retailerProductId);
      return rp?.retailerId;
    }
    return ci.chosenRetailerId;
  };

  // Bucket map: dedicatedRetailerId → CartItem[], and 'general' → CartItem[]
  const dedicatedBuckets = new Map<string, CartItem[]>();
  const generalItems: CartItem[] = [];

  for (const ci of cart) {
    const retailerId = getRetailerId(ci);
    if (retailerId && dedicatedRetailerIds.has(retailerId)) {
      const bucket = dedicatedBuckets.get(retailerId) ?? [];
      bucket.push(ci);
      dedicatedBuckets.set(retailerId, bucket);
    } else {
      generalItems.push(ci);
    }
  }

  const result: SubOrderGroup[] = [];

  // Add dedicated buckets
  for (const [retailerId, items] of dedicatedBuckets.entries()) {
    const retailer = retailers.find((r) => r.id === retailerId);
    const businessAreaId =
      retailer?.businessAreaId ?? businessAreas[0]?.id ?? "";
    result.push({
      dedicatedRetailerId: retailerId,
      retailerName: retailer?.name,
      items,
      businessAreaId,
    });
  }

  // Group general items by businessAreaId — one sub-order per area
  if (generalItems.length > 0) {
    const areaBuckets = new Map<string, CartItem[]>();
    for (const ci of generalItems) {
      const retailerId = getRetailerId(ci);
      let areaId = businessAreas[0]?.id ?? "";
      if (retailerId) {
        const retailer = retailers.find((r) => r.id === retailerId);
        if (retailer?.businessAreaId) areaId = retailer.businessAreaId;
      }
      const bucket = areaBuckets.get(areaId) ?? [];
      bucket.push(ci);
      areaBuckets.set(areaId, bucket);
    }
    for (const [areaId, items] of areaBuckets.entries()) {
      result.push({
        dedicatedRetailerId: undefined,
        retailerName: undefined,
        items,
        businessAreaId: areaId,
      });
    }
  }

  return result;
}

import type {
  BusinessArea,
  CartItem,
  DeliveryType,
  Retailer,
} from "../data/mockData";

export interface DeliveryFeeBreakdown {
  baseFee: number;
  extraAreaFees: number;
  homeDeliverySurcharge: number;
  total: number;
  areaBreakdown: { areaName: string; fee: number; retailerNames: string[] }[];
  uniqueAreaCount: number;
  deliveryAreaIds: string[];
}

export function calculateDeliveryFee(
  cart: CartItem[],
  retailers: Retailer[],
  businessAreas: BusinessArea[],
  deliveryType: DeliveryType,
): DeliveryFeeBreakdown {
  if (cart.length === 0) {
    return {
      baseFee: 0,
      extraAreaFees: 0,
      homeDeliverySurcharge: 0,
      total: 0,
      areaBreakdown: [],
      uniqueAreaCount: 0,
      deliveryAreaIds: [],
    };
  }

  // Collect unique business area IDs from chosen retailers
  const seenAreaIds: string[] = [];
  for (const item of cart) {
    if (!item.chosenRetailerId) continue;
    const retailer = retailers.find((r) => r.id === item.chosenRetailerId);
    if (!retailer?.businessAreaId) continue;
    if (!seenAreaIds.includes(retailer.businessAreaId)) {
      seenAreaIds.push(retailer.businessAreaId);
    }
  }

  const uniqueAreaCount = seenAreaIds.length;

  if (uniqueAreaCount === 0) {
    // Cart has items but none have a retailer/area linked — still charge base
    return {
      baseFee: 40,
      extraAreaFees: 0,
      homeDeliverySurcharge: deliveryType === "home_delivery" ? 5 : 0,
      total: 40 + (deliveryType === "home_delivery" ? 5 : 0),
      areaBreakdown: [{ areaName: "Delivery", fee: 40, retailerNames: [] }],
      uniqueAreaCount: 1,
      deliveryAreaIds: [],
    };
  }

  const baseFee = 40;
  const extraAreaFees = (uniqueAreaCount - 1) * 15;
  const homeDeliverySurcharge = deliveryType === "home_delivery" ? 5 : 0;
  const total = baseFee + extraAreaFees + homeDeliverySurcharge;

  const areaBreakdown = seenAreaIds.map((areaId, index) => {
    const area = businessAreas.find((ba) => ba.id === areaId);
    // Collect unique retailer names for items from this area
    const areaRetailerNames: string[] = [];
    for (const item of cart) {
      if (!item.chosenRetailerId) continue;
      const retailer = retailers.find((r) => r.id === item.chosenRetailerId);
      if (retailer?.businessAreaId !== areaId) continue;
      if (!areaRetailerNames.includes(retailer.name)) {
        areaRetailerNames.push(retailer.name);
      }
    }
    return {
      areaName: area?.name ?? "Unknown Area",
      fee: index === 0 ? 40 : 15,
      retailerNames: areaRetailerNames,
    };
  });

  return {
    baseFee,
    extraAreaFees,
    homeDeliverySurcharge,
    total,
    areaBreakdown,
    uniqueAreaCount,
    deliveryAreaIds: seenAreaIds,
  };
}

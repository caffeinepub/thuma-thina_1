// ─── Types ────────────────────────────────────────────────────────────────────

export type DemoRole =
  | "customer"
  | "shopper"
  | "driver"
  | "operator"
  | "admin"
  | "guest";

export type OrderStatus =
  | "awaiting_payment"
  | "pending"
  | "accepted_by_shopper"
  | "shopping_in_progress"
  | "ready_for_collection"
  | "accepted_by_driver"
  | "out_for_delivery"
  | "delivered"
  | "collected";

export type DeliveryType = "pickup_point" | "home_delivery";

export type ProductCategory =
  | "Groceries"
  | "Household"
  | "Fast Food"
  | "Beverages"
  | "Personal Care"
  | "Baby & Kids"
  | "Auto Spares"
  | "Butchery"
  | "Voucher"
  | "Building Materials"
  | "Phones"
  | "Gadgets"
  | "TV"
  | "Toys"
  | "Power Tools"
  | "Surface & Floor Cleaners"
  | "Detergents & Soaps"
  | string;

export interface Town {
  id: string;
  name: string;
  province: string;
}

export interface BusinessArea {
  id: string;
  name: string;
  townId: string;
  type: "mall" | "store" | "market" | "factory" | "restaurant";
}

export interface PickupPoint {
  id: string;
  name: string;
  townId: string;
  address: string;
  operatorId?: string;
  profileImageUrl?: string;
}

export interface DaySchedule {
  open: string; // "08:00"
  close: string; // "18:00"
  closed: boolean;
}

export interface OperatingHours {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
}

export interface Retailer {
  id: string;
  name: string;
  townId: string;
  address: string;
  businessAreaId?: string;
  operatingHours?: OperatingHours;
  parentRetailerId?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  imageEmoji: string;
  images?: string[];
  inStock: boolean;
  isSuggestion?: boolean;
  suggestedBy?: string;
  approved?: boolean;
  isSpecial?: boolean;
  serviceFee?: number;
  attributes?: string; // JSON string: { "Size": ["S","M","L"], "Color": ["Red","Blue"] }
}

export interface ProductListing {
  id: string;
  productId: string;
  retailerId: string;
  price: number;
  outOfStock?: boolean;
}

export interface RetailerProduct {
  id: string;
  retailerId: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  imageEmoji: string;
  images?: string[];
  inStock: boolean;
  availableSizes?: string;
  availableColors?: string;
  availableFlavors?: string;
  availableWeights?: string;
  outOfStockSizes?: string;
  outOfStockColors?: string;
  outOfStockFlavors?: string;
  outOfStockWeights?: string;
  inheritedFrom?: string;
  attributes?: string; // JSON string: { "Size": ["S","M","L"], "Color": ["Red","Blue"] }
}

export interface CartItem {
  productId: string;
  quantity: number;
  listingId?: string;
  chosenRetailerId?: string;
  chosenPrice?: number;
  retailerProductId?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedAttributes?: Record<string, string>; // attributeType -> chosen option
  meterInputs?: Array<{
    entryId: string;
    meterNumber?: string;
    slipImage?: string;
    purchaseAmount?: number;
  }>;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  meterInputs?: Array<{
    entryId: string;
    meterNumber?: string;
    slipImage?: string;
    purchaseAmount?: number;
  }>;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  deliveryFee?: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  pickupPointId: string;
  pickupPointName: string;
  homeAddress?: string;
  townId: string;
  businessAreaId: string;
  deliveryAreas?: string[];
  shopperId?: string;
  shopperName?: string;
  driverId?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;
  isWalkIn?: boolean;
  parentOrderId?: string; // shared across all sub-orders from the same checkout
  dedicatedRetailerId?: string; // if set, this sub-order is for a dedicated-shopper retailer
  shopperProofImages?: string[];
}

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: DemoRole;
  status: "pending" | "approved" | "rejected";
  businessAreaId?: string;
  pickupPointId?: string;
  profileImageUrl?: string;
  createdAt: string;
  isPromotedAdmin?: boolean;
  assignedRetailerIds?: string[];
  juniorAdminRole?: "products_admin" | "listings_admin" | "approvals_admin";
}

export interface NomayiniWallet {
  totalEarned: number;
  unlockedBalance: number;
  lockedShortTerm: number;
  lockedLongTerm: number;
  transactions: NomayiniTransaction[];
}

export interface NomayiniTransaction {
  id: string;
  type: "earned" | "spent" | "sent" | "received";
  amount: number;
  description: string;
  date: string;
  unlockDate?: string;
  lockType?: "short" | "long";
}

// Alias for component usage
export type WalletTransaction = NomayiniTransaction;

export interface Article {
  id: string;
  title: string;
  body: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  images?: string[];
  likes?: number;
  dislikes?: number;
}

// ─── Default Operating Hours ──────────────────────────────────────────────────
export const DEFAULT_OPERATING_HOURS: OperatingHours = {
  mon: { open: "08:00", close: "18:00", closed: false },
  tue: { open: "08:00", close: "18:00", closed: false },
  wed: { open: "08:00", close: "18:00", closed: false },
  thu: { open: "08:00", close: "18:00", closed: false },
  fri: { open: "08:00", close: "18:00", closed: false },
  sat: { open: "08:00", close: "14:00", closed: false },
  sun: { open: "08:00", close: "14:00", closed: true },
};

// ─── Order Status Labels & Steps ──────────────────────────────────────────────
export const ORDER_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting Payment",
  pending: "Placed",
  accepted_by_shopper: "Shopper Assigned",
  shopping_in_progress: "Shopping in Progress",
  ready_for_collection: "Ready for Collection",
  accepted_by_driver: "Driver Assigned",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  collected: "Collected",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "awaiting_payment",
  "pending",
  "accepted_by_shopper",
  "shopping_in_progress",
  "ready_for_collection",
  "accepted_by_driver",
  "out_for_delivery",
  "delivered",
];

// ─── Operating Hours Helpers ──────────────────────────────────────────────────
export function isRetailerOpen(retailer: Retailer): boolean {
  if (!retailer.operatingHours) return true;
  const now = new Date();
  const days: (keyof OperatingHours)[] = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ];
  const dayKey = days[now.getDay()];
  const schedule = retailer.operatingHours[dayKey];
  if (!schedule || schedule.closed) return false;
  if (!schedule.open || !schedule.close) return false;
  const [openH, openM] = schedule.open.split(":").map(Number);
  const [closeH, closeM] = schedule.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export function getClosingText(retailer: Retailer): string {
  if (!retailer.operatingHours) return "";
  const days: (keyof OperatingHours)[] = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const schedule = retailer.operatingHours[dayKey];
  if (!schedule || schedule.closed) return "";
  if (!schedule.open || !schedule.close) return "";
  const [closeH, closeM] = schedule.close.split(":").map(Number);
  const closeMinutes = closeH * 60 + closeM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = schedule.open.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
    return `Closes at ${schedule.close}`;
  }
  return "";
}

export function getNextOpeningText(retailer: Retailer): string {
  if (!retailer.operatingHours) return "";
  const days: (keyof OperatingHours)[] = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Check today first — if open time is still in the future today
  const todayIdx = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const todayKey = days[todayIdx];
  const todaySchedule = retailer.operatingHours[todayKey];
  if (todaySchedule && !todaySchedule.closed) {
    const [openH, openM] = todaySchedule.open.split(":").map(Number);
    const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
    const todayOpenMinutes = openH * 60 + openM;
    const todayCloseMinutes = closeH * 60 + closeM;
    // Shop hasn't opened yet today
    if (nowMinutes < todayOpenMinutes) {
      return `Opens today at ${todaySchedule.open}`;
    }
    // Shop is currently open — show closing time
    if (nowMinutes >= todayOpenMinutes && nowMinutes < todayCloseMinutes) {
      return `Closes today at ${todaySchedule.close}`;
    }
    // Past closing time today — fall through to next day search
  }

  // Find the next day (tomorrow onwards) that is open
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (todayIdx + i) % 7;
    const schedule = retailer.operatingHours[days[dayIndex]];
    if (schedule && !schedule.closed) {
      if (i === 1) {
        return `Opens tomorrow at ${schedule.open}`;
      }
      return `Opens ${dayNames[dayIndex]} at ${schedule.open}`;
    }
  }
  return "Closed";
}

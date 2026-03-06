// ─── Types ────────────────────────────────────────────────────────────────────

export type DemoRole =
  | "customer"
  | "shopper"
  | "driver"
  | "operator"
  | "admin"
  | "guest";

export type OrderStatus =
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
  | "Baby & Kids";

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

export interface Retailer {
  id: string;
  name: string;
  townId: string;
  address: string;
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
}

export interface ProductListing {
  id: string;
  productId: string;
  retailerId: string;
  price: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  listingId?: string;
  chosenRetailerId?: string;
  chosenPrice?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  pickupPointId: string;
  pickupPointName: string;
  homeAddress?: string;
  townId: string;
  businessAreaId: string;
  shopperId?: string;
  shopperName?: string;
  driverId?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;
  isWalkIn?: boolean;
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
}

export interface NomayiniWallet {
  totalEarned: number;
  unlockedBalance: number;
  lockedShortTerm: number;
  lockedLongTerm: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: "earned" | "sent" | "spent" | "received";
  amount: number;
  description: string;
  date: string;
  unlockDate?: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const towns: Town[] = [
  { id: "t1", name: "Durban", province: "KwaZulu-Natal" },
  { id: "t2", name: "Pietermaritzburg", province: "KwaZulu-Natal" },
  { id: "t3", name: "Richards Bay", province: "KwaZulu-Natal" },
];

export const businessAreas: BusinessArea[] = [
  { id: "ba1", name: "Gateway Mall", townId: "t1", type: "mall" },
  { id: "ba2", name: "Berea Centre", townId: "t1", type: "mall" },
  { id: "ba3", name: "Pavilion Mall", townId: "t1", type: "mall" },
  { id: "ba4", name: "Victoria Street Market", townId: "t1", type: "market" },
  { id: "ba5", name: "Bluff Spar", townId: "t1", type: "store" },
  { id: "ba6", name: "Liberty Midlands Mall", townId: "t2", type: "mall" },
  {
    id: "ba7",
    name: "Pietermaritzburg Market Square",
    townId: "t2",
    type: "market",
  },
  { id: "ba8", name: "Richards Bay Boardwalk", townId: "t3", type: "mall" },
];

export const pickupPoints: PickupPoint[] = [
  {
    id: "pp1",
    name: "KwaMashu Community Centre",
    townId: "t1",
    address: "Section D, KwaMashu, Durban",
    operatorId: "u4",
  },
  {
    id: "pp2",
    name: "Umlazi Pick-up Point",
    townId: "t1",
    address: "V Section, Umlazi, Durban",
    operatorId: undefined,
  },
  {
    id: "pp3",
    name: "Pinetown Pick-up Point",
    townId: "t1",
    address: "12 Old Main Road, Pinetown",
  },
  {
    id: "pp4",
    name: "PMB Central Pick-up Point",
    townId: "t2",
    address: "45 Commercial Road, Pietermaritzburg",
  },
  {
    id: "pp5",
    name: "Richards Bay Collect Hub",
    townId: "t3",
    address: "Mzingazi Road, Richards Bay",
  },
];

export const retailers: Retailer[] = [
  { id: "r1", name: "Bluff Spar", townId: "t1", address: "Bluff Road, Durban" },
  {
    id: "r2",
    name: "Checkers Berea",
    townId: "t1",
    address: "Berea Centre, Durban",
  },
  {
    id: "r3",
    name: "Pick n Pay Gateway",
    townId: "t1",
    address: "Gateway Mall, Umhlanga",
  },
  {
    id: "r4",
    name: "Victoria Street Market",
    townId: "t1",
    address: "Victoria Street, Durban",
  },
  {
    id: "r5",
    name: "Liberty Midlands Spar",
    townId: "t2",
    address: "Liberty Midlands Mall, PMB",
  },
  {
    id: "r6",
    name: "Boardwalk Checkers",
    townId: "t3",
    address: "Boardwalk Mall, Richards Bay",
  },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Ace Instant Porridge (1kg)",
    description: "Smooth, nutritious maize meal porridge — ready in minutes",
    category: "Groceries",
    imageEmoji: "🌾",
    inStock: true,
  },
  {
    id: "p2",
    name: "Koo Baked Beans (410g)",
    description: "Classic SA pantry staple — beans in rich tomato sauce",
    category: "Groceries",
    imageEmoji: "🥫",
    inStock: true,
  },
  {
    id: "p3",
    name: "Sunlight Dishwashing Liquid (750ml)",
    description: "Cuts through grease, gentle on hands",
    category: "Household",
    imageEmoji: "🧴",
    inStock: true,
  },
  {
    id: "p4",
    name: "Nando's Peri-Peri Chicken (Quarter)",
    description: "Flame-grilled chicken with signature peri-peri sauce",
    category: "Fast Food",
    imageEmoji: "🍗",
    inStock: true,
  },
  {
    id: "p5",
    name: "Coca-Cola 2L",
    description: "Ice-cold refreshment — South Africa's favourite",
    category: "Beverages",
    imageEmoji: "🥤",
    inStock: true,
  },
  {
    id: "p6",
    name: "Albany Superior White Bread",
    description: "Fresh, soft white bread — 700g loaf",
    category: "Groceries",
    imageEmoji: "🍞",
    inStock: true,
  },
  {
    id: "p7",
    name: "Clover Full Cream Milk (2L)",
    description: "Rich, fresh full cream milk from South African dairy farms",
    category: "Groceries",
    imageEmoji: "🥛",
    inStock: true,
  },
  {
    id: "p8",
    name: "Doom Insect Spray (300ml)",
    description: "Fast-acting insect killer — flying & crawling insects",
    category: "Household",
    imageEmoji: "🐛",
    inStock: true,
  },
  {
    id: "p9",
    name: "Steers Burger Meal",
    description: "Classic flame-grilled burger with chips and cooldrink",
    category: "Fast Food",
    imageEmoji: "🍔",
    inStock: true,
  },
  {
    id: "p10",
    name: "Mageu (1L) — Amahle Brand",
    description: "Traditional fermented maize drink — naturally soured",
    category: "Beverages",
    imageEmoji: "🫙",
    inStock: true,
  },
  {
    id: "p11",
    name: "Pampers Active Baby Diapers (M, 44s)",
    description: "Soft, absorbent nappies — keeps baby dry for up to 12 hours",
    category: "Baby & Kids",
    imageEmoji: "👶",
    inStock: true,
  },
  {
    id: "p12",
    name: "Vaseline Intensive Care Lotion (400ml)",
    description: "Deep-moisture body lotion for dry skin",
    category: "Personal Care",
    imageEmoji: "🧼",
    inStock: true,
  },
  {
    id: "p13",
    name: "Chicken Feet (1kg — Fresh)",
    description: "Fresh chicken feet — ideal for umleqwa or umngqusho",
    category: "Groceries",
    imageEmoji: "🍖",
    inStock: true,
  },
  {
    id: "p14",
    name: "Robertsons Braai & Grill Spice (200g)",
    description: "Bold, smoky spice blend — essential for every braai",
    category: "Groceries",
    imageEmoji: "🌶️",
    inStock: true,
  },
  {
    id: "p15",
    name: "Ultramel Custard (500ml)",
    description: "Smooth, creamy vanilla custard — perfect with pudding",
    category: "Groceries",
    imageEmoji: "🍮",
    inStock: true,
  },
  {
    id: "p16",
    name: "Inkomfe Traditional Sorghum Beer (2L)",
    description: "Traditionally brewed sorghum umqombothi beer",
    category: "Beverages",
    imageEmoji: "🍺",
    inStock: false,
  },
  {
    id: "p17",
    name: "Handy Andy All Purpose Cleaner (750ml)",
    description: "Powerful surface cleaner — kills 99.9% of bacteria",
    category: "Household",
    imageEmoji: "🧹",
    inStock: true,
  },
  {
    id: "p18",
    name: "Spur Burger (Burger Only)",
    description: "Legendary flame-grilled Spur beef burger",
    category: "Fast Food",
    imageEmoji: "🥩",
    inStock: true,
  },
  {
    id: "p19",
    name: "Suggested: Boerewors (500g)",
    description: "Traditional SA farm sausage — coil style",
    category: "Groceries",
    imageEmoji: "🌭",
    inStock: true,
    isSuggestion: true,
    suggestedBy: "Sipho Dlamini",
    approved: false,
  },
];

export const productListings: ProductListing[] = [
  // p1 - Ace Instant Porridge
  { id: "l1", productId: "p1", retailerId: "r1", price: 24.99 },
  { id: "l2", productId: "p1", retailerId: "r2", price: 22.5 },
  { id: "l3", productId: "p1", retailerId: "r3", price: 25.99 },
  // p2 - Koo Baked Beans
  { id: "l4", productId: "p2", retailerId: "r1", price: 16.99 },
  { id: "l5", productId: "p2", retailerId: "r2", price: 15.5 },
  { id: "l6", productId: "p2", retailerId: "r3", price: 17.49 },
  // p3 - Sunlight Dishwashing Liquid
  { id: "l7", productId: "p3", retailerId: "r1", price: 22.99 },
  { id: "l8", productId: "p3", retailerId: "r2", price: 21.5 },
  { id: "l9", productId: "p3", retailerId: "r5", price: 23.99 },
  // p4 - Nando's (fast food — store-specific)
  { id: "l10", productId: "p4", retailerId: "r4", price: 79.9 },
  // p5 - Coca-Cola 2L
  { id: "l11", productId: "p5", retailerId: "r1", price: 22.99 },
  { id: "l12", productId: "p5", retailerId: "r2", price: 20.99 },
  { id: "l13", productId: "p5", retailerId: "r3", price: 23.49 },
  { id: "l14", productId: "p5", retailerId: "r6", price: 21.99 },
  // p6 - Albany Bread
  { id: "l15", productId: "p6", retailerId: "r1", price: 19.99 },
  { id: "l16", productId: "p6", retailerId: "r2", price: 18.5 },
  { id: "l17", productId: "p6", retailerId: "r3", price: 20.49 },
  // p7 - Clover Milk
  { id: "l18", productId: "p7", retailerId: "r1", price: 35.99 },
  { id: "l19", productId: "p7", retailerId: "r2", price: 34.5 },
  { id: "l20", productId: "p7", retailerId: "r3", price: 36.99 },
  // p8 - Doom Insect Spray
  { id: "l21", productId: "p8", retailerId: "r2", price: 45.99 },
  { id: "l22", productId: "p8", retailerId: "r3", price: 47.5 },
  // p9 - Steers Burger Meal (fast food)
  { id: "l23", productId: "p9", retailerId: "r1", price: 89.9 },
  // p10 - Mageu
  { id: "l24", productId: "p10", retailerId: "r4", price: 12.99 },
  { id: "l25", productId: "p10", retailerId: "r1", price: 13.99 },
  { id: "l26", productId: "p10", retailerId: "r5", price: 14.5 },
  // p11 - Pampers
  { id: "l27", productId: "p11", retailerId: "r3", price: 179.99 },
  { id: "l28", productId: "p11", retailerId: "r2", price: 175.0 },
  // p12 - Vaseline Lotion
  { id: "l29", productId: "p12", retailerId: "r1", price: 44.99 },
  { id: "l30", productId: "p12", retailerId: "r2", price: 42.5 },
  { id: "l31", productId: "p12", retailerId: "r3", price: 45.99 },
];

export const staffUsers: StaffUser[] = [
  {
    id: "u1",
    name: "Sipho Dlamini",
    phone: "071 234 5678",
    email: "sipho@example.com",
    role: "shopper",
    status: "approved",
    businessAreaId: "ba5",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "u2",
    name: "Zanele Mthembu",
    phone: "082 345 6789",
    email: "zanele@example.com",
    role: "driver",
    status: "approved",
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "u3",
    name: "Bongani Nkosi",
    phone: "064 456 7890",
    email: "bongani@example.com",
    role: "shopper",
    status: "pending",
    businessAreaId: "ba1",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "u4",
    name: "Nomvula Zulu",
    phone: "083 567 8901",
    email: "nomvula@example.com",
    role: "operator",
    status: "approved",
    pickupPointId: "pp1",
    createdAt: "2026-01-20T11:00:00Z",
  },
  {
    id: "u5",
    name: "Thabo Mokoena",
    phone: "079 678 9012",
    email: "thabo@example.com",
    role: "driver",
    status: "pending",
    createdAt: "2026-02-05T12:00:00Z",
  },
  {
    id: "u6",
    name: "Lindiwe Khumalo",
    phone: "061 789 0123",
    email: "lindiwe@example.com",
    role: "driver",
    status: "rejected",
    createdAt: "2026-01-25T13:00:00Z",
  },
];

const now = new Date();
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 86400000).toISOString();

export const sampleOrders: Order[] = [
  {
    id: "ord001",
    customerId: "cust1",
    customerName: "Ntombi Cele",
    customerPhone: "072 111 2222",
    items: [
      {
        productId: "p1",
        productName: "Ace Instant Porridge (1kg)",
        price: 24.99,
        quantity: 2,
      },
      {
        productId: "p6",
        productName: "Albany Superior White Bread",
        price: 18.99,
        quantity: 1,
      },
      {
        productId: "p7",
        productName: "Clover Full Cream Milk (2L)",
        price: 35.99,
        quantity: 1,
      },
    ],
    total: 104.96,
    status: "pending",
    deliveryType: "pickup_point",
    pickupPointId: "pp1",
    pickupPointName: "KwaMashu Community Centre",
    townId: "t1",
    businessAreaId: "ba5",
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: "ord002",
    customerId: "cust2",
    customerName: "Musa Ndlovu",
    customerPhone: "083 222 3333",
    items: [
      {
        productId: "p4",
        productName: "Nando's Peri-Peri Chicken (Quarter)",
        price: 79.9,
        quantity: 1,
      },
      {
        productId: "p5",
        productName: "Coca-Cola 2L",
        price: 21.99,
        quantity: 1,
      },
    ],
    total: 101.89,
    status: "accepted_by_shopper",
    deliveryType: "pickup_point",
    pickupPointId: "pp2",
    pickupPointName: "Umlazi Pick-up Point",
    townId: "t1",
    businessAreaId: "ba3",
    shopperId: "u1",
    shopperName: "Sipho Dlamini",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
  },
  {
    id: "ord003",
    customerId: "cust3",
    customerName: "Ayanda Shabalala",
    customerPhone: "064 333 4444",
    items: [
      {
        productId: "p9",
        productName: "Steers Burger Meal",
        price: 89.9,
        quantity: 2,
      },
      {
        productId: "p11",
        productName: "Pampers Active Baby Diapers (M, 44s)",
        price: 179.99,
        quantity: 1,
      },
    ],
    total: 359.79,
    status: "ready_for_collection",
    deliveryType: "home_delivery",
    pickupPointId: "pp1",
    pickupPointName: "KwaMashu Community Centre",
    homeAddress: "45 Mhlanga Road, KwaMashu",
    townId: "t1",
    businessAreaId: "ba1",
    shopperId: "u1",
    shopperName: "Sipho Dlamini",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    id: "ord004",
    customerId: "cust4",
    customerName: "Precious Mkhize",
    customerPhone: "082 444 5555",
    items: [
      {
        productId: "p12",
        productName: "Vaseline Intensive Care Lotion (400ml)",
        price: 44.99,
        quantity: 2,
      },
      {
        productId: "p8",
        productName: "Doom Insect Spray (300ml)",
        price: 45.99,
        quantity: 1,
      },
      {
        productId: "p3",
        productName: "Sunlight Dishwashing Liquid (750ml)",
        price: 22.99,
        quantity: 2,
      },
    ],
    total: 181.95,
    status: "out_for_delivery",
    deliveryType: "pickup_point",
    pickupPointId: "pp1",
    pickupPointName: "KwaMashu Community Centre",
    townId: "t1",
    businessAreaId: "ba2",
    shopperId: "u1",
    shopperName: "Sipho Dlamini",
    driverId: "u2",
    driverName: "Zanele Mthembu",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(0),
  },
  {
    id: "ord005",
    customerId: "cust1",
    customerName: "Ntombi Cele",
    customerPhone: "072 111 2222",
    items: [
      {
        productId: "p2",
        productName: "Koo Baked Beans (410g)",
        price: 16.5,
        quantity: 3,
      },
      {
        productId: "p14",
        productName: "Robertsons Braai & Grill Spice (200g)",
        price: 29.99,
        quantity: 1,
      },
      {
        productId: "p13",
        productName: "Chicken Feet (1kg — Fresh)",
        price: 28.99,
        quantity: 2,
      },
    ],
    total: 134.97,
    status: "delivered",
    deliveryType: "home_delivery",
    pickupPointId: "pp2",
    pickupPointName: "Umlazi Pick-up Point",
    homeAddress: "12 Dube Village, Umlazi",
    townId: "t1",
    businessAreaId: "ba4",
    shopperId: "u1",
    shopperName: "Sipho Dlamini",
    driverId: "u2",
    driverName: "Zanele Mthembu",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: "ord006",
    customerId: "walkin1",
    customerName: "Walk-in Customer",
    customerPhone: "000 000 0000",
    items: [
      {
        productId: "p10",
        productName: "Mageu (1L) — Amahle Brand",
        price: 12.99,
        quantity: 2,
      },
      {
        productId: "p15",
        productName: "Ultramel Custard (500ml)",
        price: 19.99,
        quantity: 1,
      },
    ],
    total: 45.97,
    status: "collected",
    deliveryType: "pickup_point",
    pickupPointId: "pp1",
    pickupPointName: "KwaMashu Community Centre",
    townId: "t1",
    businessAreaId: "ba4",
    shopperId: "u1",
    shopperName: "Sipho Dlamini",
    driverId: "u2",
    driverName: "Zanele Mthembu",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    isWalkIn: true,
  },
];

export const sampleWallet: NomayiniWallet = {
  totalEarned: 342.5,
  unlockedBalance: 87.3,
  lockedShortTerm: 128.6,
  lockedLongTerm: 126.6,
  transactions: [
    {
      id: "tx1",
      type: "earned",
      amount: 45.2,
      description: "Order ORD-001 reward (10%)",
      date: "2026-02-15T10:00:00Z",
      unlockDate: "2026-05-15T10:00:00Z",
    },
    {
      id: "tx2",
      type: "earned",
      amount: 18.7,
      description: "Order ORD-002 reward (10%)",
      date: "2026-02-20T11:00:00Z",
      unlockDate: "2026-05-20T11:00:00Z",
    },
    {
      id: "tx3",
      type: "spent",
      amount: 30.0,
      description: "Used for order ORD-003",
      date: "2026-03-01T09:00:00Z",
    },
    {
      id: "tx4",
      type: "sent",
      amount: 20.0,
      description: "Sent to Zanele Mthembu",
      date: "2026-03-03T14:00:00Z",
    },
    {
      id: "tx5",
      type: "received",
      amount: 15.0,
      description: "Received from Sipho Dlamini",
      date: "2026-03-04T16:00:00Z",
    },
    {
      id: "tx6",
      type: "earned",
      amount: 89.9,
      description: "Order ORD-004 reward (10%)",
      date: "2026-03-05T08:00:00Z",
      unlockDate: "2030-03-05T08:00:00Z",
    },
  ],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting Shopper",
  accepted_by_shopper: "Accepted by Shopper",
  shopping_in_progress: "Shopping in Progress",
  ready_for_collection: "Ready for Collection",
  accepted_by_driver: "Accepted by Driver",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  collected: "Collected",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "pending",
  "accepted_by_shopper",
  "shopping_in_progress",
  "ready_for_collection",
  "accepted_by_driver",
  "out_for_delivery",
  "delivered",
];

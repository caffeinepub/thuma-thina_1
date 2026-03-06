import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type BusinessArea,
  type CartItem,
  type DemoRole,
  type NomayiniWallet,
  type Order,
  type OrderStatus,
  type PickupPoint,
  type Product,
  type ProductListing,
  type Retailer,
  type StaffUser,
  type Town,
  businessAreas as initialBusinessAreas,
  productListings as initialListings,
  pickupPoints as initialPickupPoints,
  products as initialProducts,
  retailers as initialRetailers,
  staffUsers as initialStaffUsers,
  towns as initialTowns,
  sampleOrders,
  sampleWallet,
} from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppContextValue {
  // Role/Auth
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  currentUser: { id: string; name: string; phone: string } | null;

  // Cart
  cart: CartItem[];
  addToCart: (productId: string) => void;
  addToCartWithListing: (
    productId: string,
    listingId: string,
    retailerId: string,
    price: number,
  ) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;

  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  placeOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => string;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    extra?: Partial<Order>,
  ) => void;

  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;

  // Retailers & Listings
  retailers: Retailer[];
  setRetailers: React.Dispatch<React.SetStateAction<Retailer[]>>;
  listings: ProductListing[];
  setListings: React.Dispatch<React.SetStateAction<ProductListing[]>>;

  // Locations
  towns: Town[];
  setTowns: React.Dispatch<React.SetStateAction<Town[]>>;
  businessAreas: BusinessArea[];
  setBusinessAreas: React.Dispatch<React.SetStateAction<BusinessArea[]>>;
  pickupPoints: PickupPoint[];
  setPickupPoints: React.Dispatch<React.SetStateAction<PickupPoint[]>>;

  // Staff
  staffUsers: StaffUser[];
  setStaffUsers: React.Dispatch<React.SetStateAction<StaffUser[]>>;

  // Nomayini Wallet
  nomayiniWallet: NomayiniWallet;
  setNomayiniWallet: React.Dispatch<React.SetStateAction<NomayiniWallet>>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [demoRole, setDemoRoleState] = useState<DemoRole>(() => {
    try {
      return (localStorage.getItem("tt_role") as DemoRole) || "customer";
    } catch {
      return "customer";
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("tt_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [retailers, setRetailers] = useState<Retailer[]>(initialRetailers);
  const [listings, setListings] = useState<ProductListing[]>(initialListings);
  const [towns, setTowns] = useState<Town[]>(initialTowns);
  const [businessAreas, setBusinessAreas] =
    useState<BusinessArea[]>(initialBusinessAreas);
  const [pickupPoints, setPickupPoints] =
    useState<PickupPoint[]>(initialPickupPoints);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(initialStaffUsers);
  const [nomayiniWallet, setNomayiniWallet] =
    useState<NomayiniWallet>(sampleWallet);

  // Persist role
  const setDemoRole = useCallback((role: DemoRole) => {
    setDemoRoleState(role);
    try {
      localStorage.setItem("tt_role", role);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem("tt_cart", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const currentUser = React.useMemo(() => {
    const users: Record<DemoRole, { id: string; name: string; phone: string }> =
      {
        customer: { id: "cust1", name: "Ntombi Cele", phone: "072 111 2222" },
        shopper: { id: "u1", name: "Sipho Dlamini", phone: "071 234 5678" },
        driver: { id: "u2", name: "Zanele Mthembu", phone: "082 345 6789" },
        operator: { id: "u4", name: "Nomvula Zulu", phone: "083 567 8901" },
        admin: { id: "admin1", name: "Admin User", phone: "000 000 0000" },
        guest: { id: "", name: "Guest", phone: "" },
      };
    return users[demoRole] || null;
  }, [demoRole]);

  const addToCart = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }, []);

  const addToCartWithListing = useCallback(
    (
      productId: string,
      listingId: string,
      retailerId: string,
      price: number,
    ) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  listingId,
                  chosenRetailerId: retailerId,
                  chosenPrice: price,
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId,
            quantity: 1,
            listingId,
            chosenRetailerId: retailerId,
            chosenPrice: price,
          },
        ];
      });
    },
    [],
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity: qty } : i,
        ),
      );
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const placeOrder = useCallback(
    (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): string => {
      const id = `ord${Date.now()}`;
      const now = new Date().toISOString();
      const newOrder: Order = {
        ...orderData,
        id,
        createdAt: now,
        updatedAt: now,
      };
      setOrders((prev) => [newOrder, ...prev]);

      // Award 10% Nomayini tokens
      const earnedTokens = Math.round(orderData.total * 0.1 * 100) / 100;
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      const newTx = {
        id: `tx_${Date.now()}`,
        type: "earned" as const,
        amount: earnedTokens,
        description: "Order reward (10%)",
        date: now,
        unlockDate: threeMonthsFromNow.toISOString(),
      };
      setNomayiniWallet((prev) => ({
        ...prev,
        totalEarned: Math.round((prev.totalEarned + earnedTokens) * 100) / 100,
        lockedShortTerm:
          Math.round((prev.lockedShortTerm + earnedTokens) * 100) / 100,
        transactions: [newTx, ...prev.transactions],
      }));

      return id;
    },
    [],
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, extra?: Partial<Order>) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                updatedAt: new Date().toISOString(),
                ...(extra || {}),
              }
            : o,
        ),
      );
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        demoRole,
        setDemoRole,
        currentUser,
        cart,
        addToCart,
        addToCartWithListing,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartCount,
        orders,
        setOrders,
        placeOrder,
        updateOrderStatus,
        products,
        setProducts,
        retailers,
        setRetailers,
        listings,
        setListings,
        towns,
        setTowns,
        businessAreas,
        setBusinessAreas,
        pickupPoints,
        setPickupPoints,
        staffUsers,
        setStaffUsers,
        nomayiniWallet,
        setNomayiniWallet,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

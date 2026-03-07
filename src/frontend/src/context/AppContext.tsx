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

// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationTargetRole =
  | "customer"
  | "shopper"
  | "driver"
  | "operator"
  | "admin"
  | "all";

export interface AppNotification {
  id: string;
  type: "order" | "approval" | "delivery" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  targetRole: NotificationTargetRole;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppContextValue {
  // Role/Auth
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  isSuperAdmin: boolean;
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

  // Notifications
  notifications: AppNotification[];
  addNotification: (
    n: Omit<AppNotification, "id" | "createdAt" | "read">,
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
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

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  const isSuperAdmin = demoRole === "admin";

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

  // ─── Notifications ──────────────────────────────────────────────────────────

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      const newNotification: AppNotification = {
        ...n,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    [],
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

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

      // Notify shoppers of new order
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: "order",
          title: "New Order Available",
          message:
            "A new order has been placed. Ready for a shopper to accept.",
          read: false,
          createdAt: now,
          targetRole: "shopper",
        },
        ...prev,
      ]);

      return id;
    },
    [],
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, extra?: Partial<Order>) => {
      const now = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                updatedAt: now,
                ...(extra || {}),
              }
            : o,
        ),
      );

      // Fire role-targeted notifications based on new status
      const makeNotif = (
        type: AppNotification["type"],
        title: string,
        message: string,
        targetRole: NotificationTargetRole,
      ): AppNotification => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        title,
        message,
        read: false,
        createdAt: now,
        targetRole,
      });

      switch (status) {
        case "accepted_by_shopper":
          setNotifications((prev) => [
            makeNotif(
              "order",
              "Shopper Assigned",
              "A personal shopper has accepted your order and is heading to the store.",
              "customer",
            ),
            ...prev,
          ]);
          break;
        case "ready_for_collection":
          setNotifications((prev) => [
            makeNotif(
              "order",
              "Order Ready for Pickup",
              "An order has been purchased and is ready for a driver to collect.",
              "driver",
            ),
            ...prev,
          ]);
          break;
        case "accepted_by_driver":
          setNotifications((prev) => [
            makeNotif(
              "delivery",
              "Driver On The Way",
              "A driver has collected your order and is on the way.",
              "customer",
            ),
            ...prev,
          ]);
          break;
        case "delivered":
          setNotifications((prev) => [
            makeNotif(
              "delivery",
              "Order Delivered!",
              "Your order has been delivered. Enjoy!",
              "customer",
            ),
            ...prev,
          ]);
          break;
        default:
          break;
      }
    },
    [],
  );

  const unreadCount = notifications.filter(
    (n) => !n.read && (n.targetRole === demoRole || n.targetRole === "all"),
  ).length;

  return (
    <AppContext.Provider
      value={{
        demoRole,
        setDemoRole,
        isSuperAdmin,
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
        notifications,
        addNotification,
        markNotificationRead,
        markAllRead,
        unreadCount,
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

import type React from "react";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { AppUserRole, type UserProfile } from "../backend.d";
import type {
  BusinessArea,
  CartItem,
  DeliveryType,
  DemoRole,
  NomayiniWallet,
  OperatingHours,
  Order,
  OrderItem,
  OrderStatus,
  PickupPoint,
  Product,
  ProductCategory,
  ProductListing,
  Retailer,
  RetailerProduct,
  StaffUser,
  Town,
} from "../data/mockData";
import { useActor } from "../hooks/useActor";
import { splitCartIntoSubOrders } from "../utils/orderSplit";
import { useAuth } from "./AuthContext";

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
  // Current user (derived from AuthContext or demo mode)
  currentUser: { id: string; name: string; phone: string } | null;
  setCurrentUser: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; phone: string } | null>
  >;

  // Data loading state
  dataLoading: boolean;

  // Cart
  cart: CartItem[];
  addToCart: (productId: string) => void;
  addToCartWithListing: (
    productId: string,
    listingId: string,
    retailerId: string,
    price: number,
  ) => void;
  addRetailerProductToCart: (
    retailerProductId: string,
    retailerId: string,
    price: number,
    productName: string,
  ) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;

  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  placeOrder: (
    order: Omit<Order, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    extra?: Partial<Order>,
  ) => Promise<void>;

  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;

  // Retailer Products
  retailerProducts: RetailerProduct[];
  setRetailerProducts: React.Dispatch<React.SetStateAction<RetailerProduct[]>>;

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

  // Shopper assignments (principal text → retailer IDs)
  shopperAssignments: Map<string, string[]>;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseImages(imagesJson?: string): string[] | undefined {
  if (!imagesJson) return undefined;
  try {
    const parsed = JSON.parse(imagesJson);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function parseOperatingHours(hoursJson?: string): OperatingHours | undefined {
  if (!hoursJson) return undefined;
  try {
    return JSON.parse(hoursJson);
  } catch {
    return undefined;
  }
}

// Type alias to avoid import() in function signatures
type BackendOrder = import("../backend.d").Order;

/**
 * Map a backend Order (with itemsJson) to a frontend Order (with items array).
 */
function mapBackendOrder(backendOrder: BackendOrder): Order {
  let items: OrderItem[] = [];
  try {
    items = JSON.parse(backendOrder.itemsJson);
  } catch {
    items = [];
  }

  let deliveryAreas: string[] | undefined;
  if (backendOrder.deliveryAreasJson) {
    try {
      deliveryAreas = JSON.parse(backendOrder.deliveryAreasJson);
    } catch {
      deliveryAreas = undefined;
    }
  }

  return {
    id: backendOrder.id,
    customerId: backendOrder.customerId,
    customerName: backendOrder.customerName,
    customerPhone: backendOrder.customerPhone,
    items,
    total: backendOrder.total,
    status: backendOrder.status as OrderStatus,
    deliveryType: backendOrder.deliveryType as DeliveryType,
    pickupPointId: backendOrder.pickupPointId,
    pickupPointName: backendOrder.pickupPointName,
    homeAddress: backendOrder.homeAddress,
    townId: backendOrder.townId,
    businessAreaId: backendOrder.businessAreaId,
    deliveryAreas,
    shopperId: backendOrder.shopperId,
    shopperName: backendOrder.shopperName,
    driverId: backendOrder.driverId,
    driverName: backendOrder.driverName,
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt,
    isWalkIn: backendOrder.isWalkIn,
    parentOrderId: backendOrder.parentOrderId,
    dedicatedRetailerId: backendOrder.dedicatedRetailerId,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated, isAdmin, userRole, principalText } = useAuth();

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);

  const [dataLoading, setDataLoading] = useState(false);
  const lastLoadedPrincipal = useRef<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("tt_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [retailerProducts, setRetailerProducts] = useState<RetailerProduct[]>(
    [],
  );
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [shopperAssignments, setShopperAssignments] = useState<
    Map<string, string[]>
  >(new Map());
  const [nomayiniWallet, setNomayiniWallet] = useState<NomayiniWallet>({
    totalEarned: 0,
    unlockedBalance: 0,
    lockedShortTerm: 0,
    lockedLongTerm: 0,
    transactions: [],
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem("tt_cart", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  // ─── Load orders from backend ─────────────────────────────────────────────────

  const loadOrdersFromBackend = useCallback(async () => {
    if (!actor || actorFetching) return;

    try {
      let rawOrders: BackendOrder[] = [];

      if (isAdmin) {
        // Admin sees all orders
        rawOrders = await actor.getOrders();
      } else if (userRole === AppUserRole.customer && principalText) {
        // Customer sees their own orders
        rawOrders = await actor.getMyOrders(principalText);
      } else if (userRole === AppUserRole.shopper) {
        // Shopper sees pending orders + their accepted orders
        const [pendingOrders, acceptedOrders] = await Promise.all([
          actor.getOrdersByStatus("pending"),
          actor.getOrdersByStatus("accepted_by_shopper"),
        ]);
        const shoppingOrders = await actor.getOrdersByStatus(
          "shopping_in_progress",
        );
        const readyOrders = await actor.getOrdersByStatus(
          "ready_for_collection",
        );

        // Filter accepted/shopping/ready orders to only ones belonging to this shopper
        const myAccepted = [
          ...acceptedOrders,
          ...shoppingOrders,
          ...readyOrders,
        ].filter((o) => o.shopperId === principalText);

        // Deduplicate
        const seen = new Set<string>();
        for (const o of [...pendingOrders, ...myAccepted]) {
          if (!seen.has(o.id)) {
            seen.add(o.id);
            rawOrders.push(o);
          }
        }
      } else if (userRole === AppUserRole.driver) {
        // Driver sees ready-for-collection orders + their accepted deliveries
        const [readyOrders, acceptedByDriver] = await Promise.all([
          actor.getOrdersByStatus("ready_for_collection"),
          actor.getOrdersByStatus("accepted_by_driver"),
        ]);
        const outForDelivery =
          await actor.getOrdersByStatus("out_for_delivery");

        const myDeliveries = [...acceptedByDriver, ...outForDelivery].filter(
          (o) => o.driverId === principalText,
        );

        const seen = new Set<string>();
        for (const o of [...readyOrders, ...myDeliveries]) {
          if (!seen.has(o.id)) {
            seen.add(o.id);
            rawOrders.push(o);
          }
        }
      } else if (userRole === AppUserRole.operator && principalText) {
        // Operator sees orders they placed (walk-in orders)
        rawOrders = await actor.getOrdersByCustomerId(principalText);
      }

      setOrders(rawOrders.map(mapBackendOrder));
    } catch (err) {
      console.error("Failed to load orders:", err);
      // Don't toast here — it's called silently after mutations
    }
  }, [actor, actorFetching, isAdmin, userRole, principalText]);

  // ─── Load all backend data ────────────────────────────────────────────────────

  const loadAllData = useCallback(async () => {
    if (!actor || actorFetching) return;

    setDataLoading(true);
    try {
      // Load all public/shared data (does NOT include admin-only endpoints)
      const [
        rawTowns,
        rawBusinessAreas,
        rawPickupPoints,
        rawRetailers,
        rawProducts,
        rawListings,
        rawRetailerProducts,
      ] = await Promise.all([
        actor.getTowns(),
        actor.getBusinessAreas(),
        actor.getPickupPoints(),
        actor.getRetailers(),
        actor.getProducts(),
        actor.getListings(),
        actor.getRetailerProducts(),
      ]);

      // Map backend types → frontend types
      setTowns(rawTowns as Town[]);

      setBusinessAreas(
        rawBusinessAreas.map((ba) => ({
          id: ba.id,
          name: ba.name,
          townId: ba.townId,
          type: ba.areaType as BusinessArea["type"],
        })),
      );

      setPickupPoints(rawPickupPoints as PickupPoint[]);

      setRetailers(
        rawRetailers.map((r) => ({
          id: r.id,
          name: r.name,
          townId: r.townId,
          address: r.address,
          businessAreaId: r.businessAreaId,
          operatingHours: parseOperatingHours(r.operatingHoursJson),
        })),
      );

      setProducts(
        rawProducts
          .filter((p) => p.approved || !p.isSuggestion)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category as ProductCategory,
            imageEmoji: p.imageEmoji,
            images: parseImages(p.imagesJson),
            inStock: p.inStock,
            isSuggestion: p.isSuggestion,
            suggestedBy: p.suggestedBy,
            approved: p.approved,
          })),
      );

      setListings(
        rawListings.map((l) => ({
          id: l.id,
          productId: l.productId,
          retailerId: l.retailerId,
          price: l.price,
          outOfStock: l.outOfStock,
        })),
      );

      setRetailerProducts(
        rawRetailerProducts.map((rp) => ({
          id: rp.id,
          retailerId: rp.retailerId,
          name: rp.name,
          description: rp.description,
          category: rp.category as ProductCategory,
          price: rp.price,
          imageEmoji: rp.imageEmoji,
          images: parseImages(rp.imagesJson),
          inStock: rp.inStock,
        })),
      );

      // Admin-only: load shopper assignments and all users
      if (isAdmin) {
        try {
          const rawShopperAssignments = await actor.getAllShopperAssignments();
          const assignMap = new Map<string, string[]>();
          for (const [principal, retailerIds] of rawShopperAssignments) {
            assignMap.set(principal.toString(), retailerIds);
          }
          setShopperAssignments(assignMap);

          // Load all users for staff list
          const allUsers = await actor.getAllUsers();
          const mapped: StaffUser[] = allUsers
            .filter((u) => u.role !== AppUserRole.customer)
            .map((u: UserProfile) => ({
              id: u.principal.toString(),
              name: u.displayName,
              phone: u.phone,
              email: "",
              role: u.role as DemoRole,
              status:
                u.registrationStatus === "active"
                  ? ("approved" as const)
                  : u.registrationStatus === "pending"
                    ? ("pending" as const)
                    : ("rejected" as const),
              createdAt: new Date().toISOString(),
              businessAreaId: u.businessAreaId ?? undefined,
              assignedRetailerIds: assignMap.get(u.principal.toString()) ?? [],
            }));
          setStaffUsers(mapped);
        } catch {
          // ignore if admin-only calls fail
        }
      } else {
        // For non-admin authenticated users, try to load staff info for self
        try {
          const allUsers = await actor.getAllUsers();
          const mapped: StaffUser[] = allUsers
            .filter((u) => u.role !== AppUserRole.customer)
            .map((u: UserProfile) => ({
              id: u.principal.toString(),
              name: u.displayName,
              phone: u.phone,
              email: "",
              role: u.role as DemoRole,
              status:
                u.registrationStatus === "active"
                  ? ("approved" as const)
                  : u.registrationStatus === "pending"
                    ? ("pending" as const)
                    : ("rejected" as const),
              createdAt: new Date().toISOString(),
              businessAreaId: u.businessAreaId ?? undefined,
              assignedRetailerIds: [],
            }));
          setStaffUsers(mapped);
        } catch {
          // Non-admin users won't be able to call getAllUsers — that's OK
        }
      }

      // Load orders for the current user/role
      await loadOrdersFromBackend();
    } catch (err) {
      console.error("Failed to load backend data:", err);
      toast.error("Failed to load data. Please refresh.");
    } finally {
      setDataLoading(false);
    }
  }, [actor, actorFetching, isAdmin, loadOrdersFromBackend]);

  // Load data when actor becomes available
  useEffect(() => {
    if (actor && !actorFetching) {
      // Use a stable key to avoid double-loading
      const actorKey = isAuthenticated
        ? `auth_${principalText ?? "unknown"}`
        : "anon";
      if (lastLoadedPrincipal.current !== actorKey) {
        lastLoadedPrincipal.current = actorKey;
        loadAllData();
      }
    }
  }, [actor, actorFetching, isAuthenticated, principalText, loadAllData]);

  // ─── Cart ─────────────────────────────────────────────────────────────────────

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

  const addRetailerProductToCart = useCallback(
    (
      retailerProductId: string,
      retailerId: string,
      price: number,
      _productName: string,
    ) => {
      setCart((prev) => {
        const existing = prev.find(
          (i) => i.retailerProductId === retailerProductId,
        );
        if (existing) {
          return prev.map((i) =>
            i.retailerProductId === retailerProductId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId: `rp_${retailerProductId}`,
            quantity: 1,
            retailerProductId,
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

  // ─── placeOrder ──────────────────────────────────────────────────────────────

  const placeOrder = useCallback(
    async (
      orderData: Omit<Order, "id" | "createdAt" | "updatedAt">,
    ): Promise<string> => {
      const parentOrderId = `ord${Date.now()}`;
      const now = new Date().toISOString();

      const cartSnapshot = cart;
      const splitGroups = splitCartIntoSubOrders(
        cartSnapshot,
        retailers,
        retailerProducts,
        staffUsers,
        businessAreas,
        listings,
      );

      const effectiveGroups =
        splitGroups.length > 0
          ? splitGroups
          : [
              {
                dedicatedRetailerId: undefined,
                retailerName: undefined,
                items: cartSnapshot,
                businessAreaId: orderData.businessAreaId,
              },
            ];

      const grandTotal = orderData.total;
      const subOrderCount = effectiveGroups.length;
      const perSubDeliveryFee =
        subOrderCount > 1
          ? Math.round((grandTotal / subOrderCount) * 100) / 100
          : 0;

      // Build sub-orders in memory first (we need them for notifications)
      const newOrders: Order[] = effectiveGroups.map((group, index) => {
        const subId =
          subOrderCount === 1
            ? parentOrderId
            : `${parentOrderId}_sub${index + 1}`;

        const groupItemTotal = group.items.reduce((sum, ci) => {
          return sum + (ci.chosenPrice ?? 0) * ci.quantity;
        }, 0);

        const orderItems: OrderItem[] = group.items.map((ci) => {
          const matchedItem = orderData.items.find(
            (oi) =>
              oi.productId === ci.productId ||
              (ci.retailerProductId &&
                oi.productId === `rp_${ci.retailerProductId}`),
          );
          return {
            productId: ci.retailerProductId
              ? `rp_${ci.retailerProductId}`
              : ci.productId,
            productName: matchedItem?.productName ?? ci.productId,
            price: ci.chosenPrice ?? 0,
            quantity: ci.quantity,
          };
        });

        const subTotal =
          subOrderCount === 1
            ? grandTotal
            : Math.round((groupItemTotal + perSubDeliveryFee) * 100) / 100;

        return {
          ...orderData,
          id: subId,
          parentOrderId,
          dedicatedRetailerId: group.dedicatedRetailerId,
          items: orderItems,
          total: subTotal,
          businessAreaId: group.businessAreaId,
          createdAt: now,
          updatedAt: now,
        };
      });

      // Persist each sub-order to the backend
      if (actor && !actorFetching) {
        try {
          await Promise.all(
            newOrders.map((subOrder) =>
              actor.placeOrder(
                subOrder.id,
                subOrder.customerId,
                subOrder.customerName,
                subOrder.customerPhone,
                JSON.stringify(subOrder.items),
                subOrder.total,
                subOrder.deliveryType,
                subOrder.pickupPointId,
                subOrder.pickupPointName,
                subOrder.homeAddress ?? null,
                subOrder.townId,
                subOrder.businessAreaId,
                subOrder.deliveryAreas
                  ? JSON.stringify(subOrder.deliveryAreas)
                  : null,
                subOrder.createdAt,
                subOrder.isWalkIn ?? false,
                subOrder.parentOrderId ?? null,
                subOrder.dedicatedRetailerId ?? null,
              ),
            ),
          );
          // Reload orders from backend after placing
          await loadOrdersFromBackend();
        } catch (err) {
          console.error("Failed to persist orders to backend:", err);
          toast.error("Order may not have been saved. Please try again.");
          // Fall back to in-memory update so user isn't left empty-handed
          setOrders((prev) => [...newOrders, ...prev]);
        }
      } else {
        // Actor not available — update in memory
        setOrders((prev) => [...newOrders, ...prev]);
      }

      // Update Nomayini wallet (in-memory for now)
      const earnedTokens = Math.round(grandTotal * 0.1 * 100) / 100;
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

      // Create notifications (in-memory)
      const newNotifications: AppNotification[] = newOrders.map((subOrder) => {
        const isDedicated = !!subOrder.dedicatedRetailerId;
        const retailerName = isDedicated
          ? (retailers.find((r) => r.id === subOrder.dedicatedRetailerId)
              ?.name ?? "retailer")
          : null;
        return {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: "order" as const,
          title: isDedicated ? "New Dedicated Order" : "New Order Available",
          message: isDedicated
            ? `New order for ${retailerName} — ready for your assigned shopper.`
            : "A new order has been placed. Ready for a shopper to accept.",
          read: false,
          createdAt: now,
          targetRole: "shopper" as const,
        };
      });

      setNotifications((prev) => [...newNotifications, ...prev]);

      return parentOrderId;
    },
    [
      cart,
      retailers,
      retailerProducts,
      staffUsers,
      businessAreas,
      listings,
      actor,
      actorFetching,
      loadOrdersFromBackend,
    ],
  );

  // ─── updateOrderStatus ───────────────────────────────────────────────────────

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      extra?: Partial<Order>,
    ): Promise<void> => {
      const now = new Date().toISOString();

      if (actor && !actorFetching) {
        try {
          await actor.updateOrderStatus(
            orderId,
            status,
            extra?.shopperId ?? null,
            extra?.shopperName ?? null,
            extra?.driverId ?? null,
            extra?.driverName ?? null,
            now,
          );
          // Reload orders from backend after updating
          await loadOrdersFromBackend();
        } catch (err) {
          console.error("Failed to update order status on backend:", err);
          toast.error("Failed to update order status. Please try again.");
          // Fall back to optimistic in-memory update
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? { ...o, status, updatedAt: now, ...(extra || {}) }
                : o,
            ),
          );
        }
      } else {
        // Actor not available — update in memory
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status, updatedAt: now, ...(extra || {}) }
              : o,
          ),
        );
      }

      // Notification logic (always in-memory)
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
    [actor, actorFetching, loadOrdersFromBackend],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        dataLoading,
        cart,
        addToCart,
        addToCartWithListing,
        addRetailerProductToCart,
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
        retailerProducts,
        setRetailerProducts,
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
        shopperAssignments,
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

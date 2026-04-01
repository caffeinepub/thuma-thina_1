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
import { getSecretParameter } from "../utils/urlParams";
import { useAuth } from "./AuthContext";

// Special shopper marker — used as a sentinel retailer ID to designate special product shoppers
export const SPECIAL_SHOPPER_MARKER = "__SPECIAL_PRODUCTS_SHOPPER__";

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

  // Shopper own area + assignments (for non-admin shoppers)
  shopperOwnAreaId: string | undefined;
  shopperAssignedRetailerIds: string[];

  // Nomayini Wallet
  nomayiniWallet: NomayiniWallet;
  setNomayiniWallet: React.Dispatch<React.SetStateAction<NomayiniWallet>>;
  sendNomayiniTokens: (recipientPhone: string, amount: number) => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  addNotification: (
    n: Omit<AppNotification, "id" | "createdAt" | "read">,
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;

  // Custom categories (persisted to backend)
  customCategories: string[];
  addCustomCategory: (name: string) => Promise<void>;

  // Special product helpers
  addSpecialToCart: (
    productId: string,
    listingId: string,
    retailerId: string,
    price: number,
    entryId: string,
  ) => void;
  updateMeterInput: (
    productId: string,
    entryId: string,
    field: "meterNumber" | "slipImage",
    value: string,
  ) => void;
  updateMeterPurchaseAmount: (
    productId: string,
    entryId: string,
    amount: number,
  ) => void;
  removeMeterEntry: (productId: string, entryId: string) => void;
  addShopperProof: (orderId: string, proofImages: string[]) => Promise<void>;
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
    shopperProofImages: (() => {
      try {
        const raw = (backendOrder as any).shopperProofImagesJson;
        if (!raw) return undefined;
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    })(),
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated, isAdmin, userRole, principalText, userProfile } =
    useAuth();

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
  // Shopper's own area (from their UserProfile) and their assigned retailer IDs
  const [shopperOwnAreaId, setShopperOwnAreaId] = useState<string | undefined>(
    undefined,
  );
  const [shopperAssignedRetailerIds, setShopperAssignedRetailerIds] = useState<
    string[]
  >([]);

  const [nomayiniWallet, setNomayiniWallet] = useState<NomayiniWallet>({
    totalEarned: 0,
    unlockedBalance: 0,
    lockedShortTerm: 0,
    lockedLongTerm: 0,
    transactions: [],
  });
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Set shopperOwnAreaId from user profile when role/profile changes
  useEffect(() => {
    if (userRole === AppUserRole.shopper && userProfile?.businessAreaId) {
      setShopperOwnAreaId(userProfile.businessAreaId);
    } else {
      setShopperOwnAreaId(undefined);
    }
  }, [userRole, userProfile]);

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
        // Shopper sees pending orders + their accepted orders + completed history
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
        // Fetch all post-ready statuses so shopper completed history stays visible
        const [
          deliveredOrders,
          acceptedByDriverOrders,
          outForDeliveryOrders,
          collectedOrders,
        ] = await Promise.all([
          actor
            .getOrdersByStatus("delivered")
            .catch(() => [] as typeof pendingOrders),
          actor
            .getOrdersByStatus("accepted_by_driver")
            .catch(() => [] as typeof pendingOrders),
          actor
            .getOrdersByStatus("out_for_delivery")
            .catch(() => [] as typeof pendingOrders),
          actor
            .getOrdersByStatus("collected")
            .catch(() => [] as typeof pendingOrders),
        ]);

        const unwrapShopperId = (o: (typeof pendingOrders)[0]) => {
          const sid = o.shopperId;
          return Array.isArray(sid) ? (sid[0] ?? null) : (sid ?? null);
        };

        const myAccepted = [
          ...acceptedOrders,
          ...shoppingOrders,
          ...readyOrders,
        ].filter((o) => unwrapShopperId(o) === principalText);
        const myCompleted = [
          ...deliveredOrders,
          ...acceptedByDriverOrders,
          ...outForDeliveryOrders,
          ...collectedOrders,
        ].filter((o) => unwrapShopperId(o) === principalText);

        const seen = new Set<string>();
        for (const o of [...pendingOrders, ...myAccepted, ...myCompleted]) {
          if (!seen.has(o.id)) {
            seen.add(o.id);
            rawOrders.push(o);
          }
        }
      } else if (userRole === AppUserRole.driver) {
        // Driver sees ready-for-collection orders + their accepted/completed deliveries
        const [readyOrders, acceptedByDriver] = await Promise.all([
          actor.getOrdersByStatus("ready_for_collection"),
          actor.getOrdersByStatus("accepted_by_driver"),
        ]);
        const outForDelivery =
          await actor.getOrdersByStatus("out_for_delivery");
        const deliveredOrders = await actor
          .getOrdersByStatus("delivered")
          .catch(() => [] as typeof readyOrders);
        const collectedOrders = await actor
          .getOrdersByStatus("collected")
          .catch(() => [] as typeof readyOrders);

        const myDeliveries = [...acceptedByDriver, ...outForDelivery].filter(
          (o) => o.driverId === principalText,
        );
        const myCompleted = [...deliveredOrders, ...collectedOrders].filter(
          (o) => o.driverId === principalText,
        );

        const seen = new Set<string>();
        for (const o of [...readyOrders, ...myDeliveries, ...myCompleted]) {
          if (!seen.has(o.id)) {
            seen.add(o.id);
            rawOrders.push(o);
          }
        }
      } else if (userRole === AppUserRole.operator && principalText) {
        // Operator sees orders they placed (walk-in orders)
        rawOrders = await actor.getOrdersByCustomerId(principalText);
      }
      // For unauthenticated users or users with no role yet, leave rawOrders empty

      setOrders(rawOrders.map(mapBackendOrder));
    } catch (err) {
      console.error("Failed to load orders:", err);
      // Don't toast here — it's called silently and orders are optional
    }
  }, [actor, actorFetching, isAdmin, userRole, principalText]);

  // ─── Load Nomayini wallet from backend ────────────────────────────────────────
  const loadWalletFromBackend = useCallback(async () => {
    if (!actor || actorFetching || !principalText) return;
    try {
      const [balance, txs] = await Promise.all([
        actor.getNomayiniBalance(),
        actor.getNomayiniTransactions(),
      ]);
      setNomayiniWallet({
        totalEarned: balance.totalEarned,
        unlockedBalance: balance.unlockedBalance,
        lockedShortTerm: balance.lockedShortTerm,
        lockedLongTerm: balance.lockedLongTerm,
        transactions: txs.map((tx) => ({
          id: tx.id,
          type: tx.txType as "earned" | "spent" | "sent" | "received",
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          unlockDate: tx.unlockDate,
        })),
      });
    } catch {
      // Wallet load failures are non-critical
    }
  }, [actor, actorFetching, principalText]);

  // ─── Load shopper's own assignments ──────────────────────────────────────────
  const loadShopperAssignments = useCallback(async () => {
    if (!actor || actorFetching || !principalText) return;
    if (userRole !== AppUserRole.shopper) return;
    try {
      const { principal } = await import("@icp-sdk/core/principal").then(
        (m) => ({ principal: m.Principal.fromText(principalText) }),
      );
      const retailerIds = await actor.getShopperRetailerIds(principal);
      setShopperAssignedRetailerIds(retailerIds);
    } catch {
      // Non-critical
    }
  }, [actor, actorFetching, principalText, userRole]);

  // ─── Load all backend data ────────────────────────────────────────────────────

  const loadAllData = useCallback(async () => {
    if (!actor || actorFetching) return;

    setDataLoading(true);
    try {
      // ── Step 1: Load all public data (no auth required) ──────────────────────
      // These backend functions are open query calls — no authorization guard.
      // They must NEVER fail due to auth issues.
      const results = await Promise.allSettled([
        actor.getTowns(),
        actor.getBusinessAreas(),
        actor.getPickupPoints(),
        actor.getRetailers(),
        actor.getProducts(),
        actor.getListings(),
        actor.getRetailerProducts(),
      ]);

      const [
        townsRes,
        areasRes,
        pickupsRes,
        retailersRes,
        productsRes,
        listingsRes,
        retailerProductsRes,
      ] = results;

      const rawTowns = townsRes.status === "fulfilled" ? townsRes.value : [];
      const rawBusinessAreas =
        areasRes.status === "fulfilled" ? areasRes.value : [];
      const rawPickupPoints =
        pickupsRes.status === "fulfilled" ? pickupsRes.value : [];
      const rawRetailers =
        retailersRes.status === "fulfilled" ? retailersRes.value : [];
      const rawProducts =
        productsRes.status === "fulfilled" ? productsRes.value : [];
      const rawListings =
        listingsRes.status === "fulfilled" ? listingsRes.value : [];
      const rawRetailerProducts =
        retailerProductsRes.status === "fulfilled"
          ? retailerProductsRes.value
          : [];

      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        lastLoadedPrincipal.current = null;
        toast.error("Failed to load data. Please refresh.");
        setDataLoading(false);
        return;
      }
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.warn(
            `Data load: call ${i} failed`,
            (r as PromiseRejectedResult).reason,
          );
        }
      });

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
            isSpecial: (p as any).isSpecial,
            serviceFee: (p as any).serviceFee,
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

      // ── Step 2: Admin-only data (silently skip on failure) ────────────────────
      if (isAdmin) {
        try {
          const rawShopperAssignments = await actor.getAllShopperAssignments();
          const assignMap = new Map<string, string[]>();
          for (const [principal, retailerIds] of rawShopperAssignments) {
            assignMap.set(principal.toString(), retailerIds);
          }
          setShopperAssignments(assignMap);

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
          // Silently ignore — admin-only calls may fail for non-admin or unregistered users
        }
      }
      // NOTE: Non-admin users do NOT call getAllUsers(). That endpoint requires
      // admin permission and would throw for everyone else. Staff users only
      // need their own profile, which is handled in AuthContext.
    } catch (err) {
      // Public data load failed — clear the cached key so the next
      // trigger (e.g. a page refresh or re-render) will retry.
      lastLoadedPrincipal.current = null;
      console.error("Failed to load public backend data:", err);
      toast.error("Failed to load data. Please refresh.");
      setDataLoading(false);
      return; // Exit early — don't attempt orders load
    }

    // ── Step 3: Orders (isolated — failure here does NOT affect catalogue) ─────
    // This runs outside the public-data try/catch so a failed order fetch
    // (e.g. new user with no profile yet) never prevents products from showing.
    try {
      await loadOrdersFromBackend();
    } catch (err) {
      console.error("Failed to load orders:", err);
      // Don't show a toast — orders failing silently is acceptable
    }

    // ── Step 4: Per-user optional data ───────────────────────────────────────
    if (principalText) {
      // Load wallet for authenticated users
      try {
        await loadWalletFromBackend();
      } catch {
        /* non-critical */
      }
      // Load shopper's own retailer assignments
      try {
        await loadShopperAssignments();
      } catch {
        /* non-critical */
      }
    }

    // Load custom categories (available to all users)
    try {
      const cats = await actor.getCategories();
      if (cats && cats.length > 0) setCustomCategories(cats);
    } catch {
      /* ignore */
    }

    setDataLoading(false);
  }, [
    actor,
    actorFetching,
    isAdmin,
    loadOrdersFromBackend,
    loadWalletFromBackend,
    loadShopperAssignments,
    principalText,
  ]);

  // Load data when actor becomes available
  useEffect(() => {
    if (actor && !actorFetching) {
      const actorKey = isAuthenticated
        ? `auth_${principalText ?? "unknown"}_${userRole ?? "norole"}`
        : "anon";
      if (lastLoadedPrincipal.current !== actorKey) {
        lastLoadedPrincipal.current = actorKey;
        loadAllData();
      }
    }
  }, [
    actor,
    actorFetching,
    isAuthenticated,
    principalText,
    userRole,
    loadAllData,
  ]);

  // Re-register admin in access control after every deployment
  useEffect(() => {
    if (actor && isAdmin) {
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      actor._initializeAccessControlWithSecret(adminToken).catch(console.error);
    }
  }, [actor, isAdmin]);

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
      // Block adding regular products if cart already has special products (and vice versa)
      setCart((prev) => {
        const hasSpecial = prev.some((i) => i.meterInputs !== undefined);
        if (hasSpecial) return prev; // silently block — caller shows toast
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
        const hasSpecial = prev.some((i) => i.meterInputs !== undefined);
        if (hasSpecial) return prev; // silently block — caller shows toast
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

  // ─── Special product cart helpers ────────────────────────────────────────────

  const addSpecialToCart = useCallback(
    (
      productId: string,
      listingId: string,
      retailerId: string,
      price: number,
      entryId: string,
    ) => {
      setCart((prev) => {
        const hasRegular = prev.some((i) => i.meterInputs === undefined);
        if (hasRegular) return prev; // block mixing
        const existing = prev.find((i) => i.productId === productId);
        const newEntry = {
          entryId,
          meterNumber: undefined,
          slipImage: undefined,
        };
        if (existing) {
          return prev.map((i) =>
            i.productId === productId
              ? { ...i, meterInputs: [...(i.meterInputs ?? []), newEntry] }
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
            meterInputs: [newEntry],
          },
        ];
      });
    },
    [],
  );

  const updateMeterInput = useCallback(
    (
      productId: string,
      entryId: string,
      field: "meterNumber" | "slipImage",
      value: string,
    ) => {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                meterInputs: (i.meterInputs ?? []).map((m) =>
                  m.entryId === entryId ? { ...m, [field]: value } : m,
                ),
              }
            : i,
        ),
      );
    },
    [],
  );

  const updateMeterPurchaseAmount = useCallback(
    (productId: string, entryId: string, amount: number) => {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                meterInputs: (i.meterInputs ?? []).map((m) =>
                  m.entryId === entryId ? { ...m, purchaseAmount: amount } : m,
                ),
              }
            : i,
        ),
      );
    },
    [],
  );

  const removeMeterEntry = useCallback((productId: string, entryId: string) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const remaining = (i.meterInputs ?? []).filter(
            (m) => m.entryId !== entryId,
          );
          if (remaining.length === 0) return null;
          return { ...i, meterInputs: remaining, quantity: remaining.length };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null),
    );
  }, []);

  // ─── addShopperProof ─────────────────────────────────────────────────────────

  const addShopperProof = useCallback(
    async (orderId: string, proofImages: string[]) => {
      if (!actor || actorFetching) throw new Error("Not connected");
      await (actor as any).addShopperProof(
        orderId,
        JSON.stringify(proofImages),
      );
      await loadOrdersFromBackend();
    },
    [actor, actorFetching, loadOrdersFromBackend],
  );

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

  // ─── Custom Categories ──────────────────────────────────────────────────────
  const addCustomCategory = useCallback(
    async (name: string) => {
      if (!name.trim()) return;
      try {
        if (actor) await actor.addCategory(name.trim());
        setCustomCategories((prev) =>
          prev.includes(name.trim()) ? prev : [...prev, name.trim()],
        );
      } catch (e) {
        console.error("Failed to save category:", e);
        // Still add locally even if backend fails
        setCustomCategories((prev) =>
          prev.includes(name.trim()) ? prev : [...prev, name.trim()],
        );
      }
    },
    [actor],
  );

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
      const actualDeliveryFee = (orderData as any).deliveryFee ?? 0;
      const perSubDeliveryFee =
        subOrderCount > 1
          ? Math.round((actualDeliveryFee / subOrderCount) * 100) / 100
          : 0;

      // Build sub-orders in memory first (we need them for notifications)
      const newOrders: Order[] = effectiveGroups.map((group, index) => {
        const subId =
          subOrderCount === 1
            ? parentOrderId
            : `${parentOrderId}_sub${index + 1}`;

        const groupItemTotal = group.items.reduce((sum, ci) => {
          const basePrice = (ci.chosenPrice ?? 0) * ci.quantity;
          const meterPurchase = ((ci as any).meterInputs ?? []).reduce(
            (s: number, m: any) => s + (m.purchaseAmount ?? 0),
            0,
          );
          return sum + basePrice + meterPurchase;
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
            meterInputs: ci.meterInputs,
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
          // Set all new sub-orders to awaiting_payment so shoppers don't see them until operator confirms payment
          try {
            await Promise.all(
              newOrders.map((subOrder) =>
                actor.updateOrderStatus(
                  subOrder.id,
                  "awaiting_payment",
                  null,
                  null,
                  null,
                  null,
                  new Date().toISOString(),
                ),
              ),
            );
            await loadOrdersFromBackend();
          } catch (statusErr) {
            console.warn("Could not set awaiting_payment status:", statusErr);
          }
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

      // Update Nomayini wallet — 50% short-term (3 months), 50% long-term (4 years)
      const earnedTokens = Math.round(grandTotal * 0.1 * 100) / 100;
      const halfTokens = Math.round(earnedTokens * 0.5 * 100) / 100;
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
          Math.round((prev.lockedShortTerm + halfTokens) * 100) / 100,
        lockedLongTerm:
          Math.round(((prev.lockedLongTerm ?? 0) + halfTokens) * 100) / 100,
        transactions: [newTx, ...prev.transactions],
      }));

      // Notify operator that payment is awaiting (shoppers notified after payment confirmed)
      const ppName = newOrders[0]?.pickupPointName ?? "the pick-up point";
      const operatorNotif: AppNotification = {
        id: `notif_${Date.now()}_op`,
        type: "order" as const,
        title: "Payment Awaiting",
        message: `New order awaiting cash payment at ${ppName}.`,
        read: false,
        createdAt: now,
        targetRole: "operator" as const,
      };
      setNotifications((prev) => [operatorNotif, ...prev]);

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
          // Reload wallet so customer sees their new token balance
          try {
            await loadWalletFromBackend();
          } catch {
            /* non-critical */
          }
          break;
        default:
          break;
      }
    },
    [actor, actorFetching, loadOrdersFromBackend, loadWalletFromBackend],
  );

  // ─── sendNomayiniTokens ──────────────────────────────────────────────────────
  const sendNomayiniTokens = useCallback(
    async (recipientPhone: string, amount: number) => {
      if (!actor || actorFetching) throw new Error("Not connected");
      const now = new Date().toISOString();
      await actor.sendNomayiniTokens(recipientPhone, amount, now);
      await loadWalletFromBackend();
    },
    [actor, actorFetching, loadWalletFromBackend],
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
        shopperOwnAreaId,
        shopperAssignedRetailerIds,
        nomayiniWallet,
        setNomayiniWallet,
        sendNomayiniTokens,
        notifications,
        addNotification,
        markNotificationRead,
        markAllRead,
        unreadCount,
        customCategories,
        addCustomCategory,
        addSpecialToCart,
        updateMeterInput,
        updateMeterPurchaseAmount,
        removeMeterEntry,
        addShopperProof,
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

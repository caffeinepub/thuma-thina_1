import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Check,
  Clock,
  MapPin,
  Search,
  Share2,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import type { Retailer, RetailerProduct } from "../../data/mockData";
import { getNextOpeningText, isRetailerOpen } from "../../data/mockData";

// ─── Countdown helpers (shared pattern) ─────────────────────────────────────

function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (targetMs === null) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getCountdownTarget(
  retailer: Retailer,
): { kind: "closing" | "opening"; targetMs: number } | null {
  if (!retailer.operatingHours) return null;
  const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const now = new Date();
  const todayKey = DAYS[now.getDay()];
  const schedule = retailer.operatingHours[todayKey];
  const nowMs = now.getTime();
  const THREE_HOURS = 3 * 60 * 60 * 1000;

  const todayAt = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };

  if (!schedule || schedule.closed) {
    // Closed today — check tomorrow
    const tomorrowKey = DAYS[(now.getDay() + 1) % 7];
    const tomorrowSchedule = retailer.operatingHours[tomorrowKey];
    if (tomorrowSchedule && !tomorrowSchedule.closed) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [h, m] = tomorrowSchedule.open.split(":").map(Number);
      tomorrow.setHours(h, m, 0, 0);
      const openMs = tomorrow.getTime();
      if (openMs - nowMs <= THREE_HOURS) {
        return { kind: "opening", targetMs: openMs };
      }
    }
    return null;
  }

  const closeMs = todayAt(schedule.close);
  const openMs = todayAt(schedule.open);
  if (nowMs >= openMs && nowMs < closeMs && closeMs - nowMs <= THREE_HOURS) {
    return { kind: "closing", targetMs: closeMs };
  }
  if (nowMs < openMs && openMs - nowMs <= THREE_HOURS) {
    return { kind: "opening", targetMs: openMs };
  }
  return null;
}

function RetailerStatusBadge({ retailer }: { retailer: Retailer }) {
  const countdownInfo = useMemo(() => getCountdownTarget(retailer), [retailer]);
  const remaining = useCountdown(countdownInfo?.targetMs ?? null);
  const isOpen = isRetailerOpen(retailer);

  if (countdownInfo && remaining !== null && remaining > 0) {
    if (countdownInfo.kind === "closing") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-2.5 w-2.5" />
          Closes in {formatCountdown(remaining)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
        <Clock className="h-2.5 w-2.5" />
        Opens in {formatCountdown(remaining)}
      </span>
    );
  }

  return isOpen ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
      Open
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
      Closed
    </span>
  );
}

const BEVERAGE_KEYWORDS = [
  "beverage",
  "alcohol",
  "liquor",
  "beer",
  "wine",
  "spirits",
  "drink",
  "cider",
  "brandy",
  "whiskey",
  "vodka",
  "rum",
];

function isBeverageCategory(cat?: string): boolean {
  if (!cat) return false;
  const lower = cat.toLowerCase();
  return BEVERAGE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function CataloguePage() {
  const { isAuthenticated } = useAuth();
  const {
    products,
    cart,
    addToCartWithListing,
    addSpecialToCart,
    addRetailerProductToCart,
    removeFromCart,
    listings,
    retailers,
    businessAreas,
    retailerProducts,
    towns,
    customCategories,
  } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>("all");
  // Track selected listing per product
  const [selectedListings, setSelectedListings] = useState<
    Record<string, string>
  >({});
  // Town filter—default to _all
  const [selectedTownId, setSelectedTownId] = useState<string>("_all");
  // Category search
  const [catSearch, setCatSearch] = useState("");

  // Size/color/flavor/weight selection dialog for exclusive products
  const [sizeColorDialog, setSizeColorDialog] = useState(false);
  const [pendingRP, setPendingRP] = useState<RetailerProduct | null>(null);
  const [chosenSize, setChosenSize] = useState("");
  const [chosenColor, setChosenColor] = useState("");
  const [chosenFlavor, setChosenFlavor] = useState("");
  const [chosenWeight, setChosenWeight] = useState("");

  // Build dynamic categories list from backend
  const dynamicCategories = useMemo(() => {
    const all = [{ value: "All", label: "All" }];
    const custom = (customCategories ?? []).map((c: string) => ({
      value: c,
      label: c,
    }));
    return [...all, ...custom];
  }, [customCategories]);

  // Filtered category chips based on category search
  const visibleCategories = useMemo(() => {
    if (!catSearch) return dynamicCategories;
    const lower = catSearch.toLowerCase();
    return dynamicCategories.filter((c) =>
      c.label.toLowerCase().includes(lower),
    );
  }, [dynamicCategories, catSearch]);

  const available = products.filter((p) => !p.isSuggestion || p.approved);

  // Filtered universal products
  const filteredUniversal = useMemo(() => {
    const townRetailerIds =
      selectedTownId !== "_all"
        ? new Set(
            retailers
              .filter((r) => r.townId === selectedTownId)
              .map((r) => r.id),
          )
        : null;
    return available.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      if (!matchCat || !matchSearch) return false;
      // Town filter: product must have a listing in this town
      if (townRetailerIds) {
        if (
          !listings.some(
            (l) => l.productId === p.id && townRetailerIds.has(l.retailerId),
          )
        )
          return false;
      }
      // Retailer filter
      if (selectedRetailerId !== "all") {
        return listings.some(
          (l) => l.productId === p.id && l.retailerId === selectedRetailerId,
        );
      }
      return true;
    });
  }, [
    available,
    search,
    category,
    selectedRetailerId,
    listings,
    selectedTownId,
    retailers,
  ]);

  // Filtered retailer exclusive products
  // Products from exported retailers are now stored directly under their retailer ID.
  // We keep the parentRetailerId fallback for backward compatibility.
  const filteredRetailerProducts = useMemo(() => {
    const directTownRetailerIds =
      selectedTownId !== "_all"
        ? new Set(
            retailers
              .filter((r) => r.townId === selectedTownId)
              .map((r) => r.id),
          )
        : null;

    // Extended set: also include original retailer IDs for any legacy parentRetailerId products
    const extendedTownRetailerIds: Set<string> | null = directTownRetailerIds
      ? (() => {
          const ids = new Set(directTownRetailerIds);
          for (const r of retailers) {
            if (r.townId === selectedTownId && r.parentRetailerId) {
              ids.add(r.parentRetailerId);
            }
          }
          return ids;
        })()
      : null;

    return retailerProducts
      .filter((p) => {
        const matchCat = category === "All" || p.category === category;
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase());
        if (!matchCat || !matchSearch) return false;
        if (
          extendedTownRetailerIds &&
          !extendedTownRetailerIds.has(p.retailerId)
        )
          return false;
        if (selectedRetailerId !== "all") {
          return p.retailerId === selectedRetailerId;
        }
        return true;
      })
      .map((p) => {
        // Legacy: resolve parentRetailerId to exported copy
        if (directTownRetailerIds && !directTownRetailerIds.has(p.retailerId)) {
          const exportedRetailer = retailers.find(
            (r) =>
              r.townId === selectedTownId &&
              r.parentRetailerId === p.retailerId,
          );
          if (exportedRetailer) {
            return { ...p, retailerId: exportedRetailer.id };
          }
        }
        return p;
      });
  }, [
    retailerProducts,
    search,
    category,
    selectedRetailerId,
    selectedTownId,
    retailers,
  ]);

  // Shuffle universal products on each filter change
  const shuffledUniversal = useMemo(() => {
    const arr = [...filteredUniversal];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUniversal]);

  // Shuffle retailer exclusive products on each filter change
  const shuffledRetailerProducts = useMemo(() => {
    const arr = [...filteredRetailerProducts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRetailerProducts]);

  // Retailers that have listings or exclusive products, filtered by selected town
  const activeRetailers = useMemo(() => {
    const listingRetailerIds = listings.map((l) => l.retailerId);
    const rpRetailerIds = retailerProducts.map((p) => p.retailerId);
    const ids = new Set([...listingRetailerIds, ...rpRetailerIds]);
    return retailers.filter((r) => {
      if (!ids.has(r.id)) return false;
      if (selectedTownId !== "_all") return r.townId === selectedTownId;
      return true;
    });
  }, [listings, retailerProducts, retailers, selectedTownId]);

  const handleAddSpecial = (product: (typeof products)[0]) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add items to your cart");
      return;
    }
    // Check if cart has regular (non-special) items
    const hasRegular = cart.some((i) => i.meterInputs === undefined);
    if (hasRegular) {
      toast.error(
        "Special service products must be ordered separately. Please checkout your current cart first.",
      );
      return;
    }
    const entryId = `${Date.now()}`;
    addSpecialToCart(product.id, "", "", product.serviceFee ?? 20, entryId);
    toast.success(
      `${product.name} added to cart — add your meter details in the cart`,
    );
  };

  const getCartQty = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity || 0;

  const getRetailerProductCartQty = (rpId: string) =>
    cart.find((i) => i.retailerProductId === rpId)?.quantity || 0;

  const getProductListings = (productId: string) =>
    listings.filter((l) => l.productId === productId);

  const getRetailerForListing = (retailerId: string) =>
    retailers.find((r) => r.id === retailerId);

  const getListingLabel = (listing: {
    retailerId: string;
    price: number;
    outOfStock?: boolean;
  }) => {
    const retailer = getRetailerForListing(listing.retailerId);
    const area = businessAreas.find((a) => a.id === retailer?.businessAreaId);
    const areaLabel = area ? ` (${area.name})` : "";
    return `${retailer?.name ?? "Unknown"}${areaLabel} — R${listing.price.toFixed(2)}`;
  };

  const isListingDisabled = (listing: {
    retailerId: string;
    outOfStock?: boolean;
  }) => {
    const retailer = getRetailerForListing(listing.retailerId);
    if (!retailer) return false;
    return !isRetailerOpen(retailer) || !!listing.outOfStock;
  };

  const handleSelectListing = (productId: string, listingId: string) => {
    setSelectedListings((prev) => ({ ...prev, [productId]: listingId }));
  };

  const handleAdd = (productId: string, productName: string) => {
    const productListingList = getProductListings(productId);
    if (productListingList.length === 0) {
      return;
    }
    const chosenListingId = selectedListings[productId];
    if (!chosenListingId) {
      toast.error("Please select a retailer first");
      return;
    }
    const chosenListing = productListingList.find(
      (l) => l.id === chosenListingId,
    );
    if (!chosenListing) return;
    if (isListingDisabled(chosenListing)) {
      toast.error("This retailer is currently unavailable");
      return;
    }
    addToCartWithListing(
      productId,
      chosenListing.id,
      chosenListing.retailerId,
      chosenListing.price,
    );
    toast.success(`${productName} added to cart`);
  };

  const getMinPrice = (productId: string) => {
    const pl = getProductListings(productId);
    if (pl.length === 0) return null;
    return Math.min(...pl.map((l) => l.price));
  };

  const getChosenPrice = (productId: string) => {
    const chosenListingId = selectedListings[productId];
    if (!chosenListingId) return null;
    const listing = listings.find((l) => l.id === chosenListingId);
    return listing?.price ?? null;
  };

  // Handle add exclusive product to cart (with size/color/flavor/weight if required)
  const handleAddRetailerProduct = (rp: RetailerProduct) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add items to your cart");
      return;
    }
    const needsOptions = !!(
      rp.availableSizes ||
      rp.availableColors ||
      rp.availableFlavors ||
      rp.availableWeights
    );
    if (needsOptions) {
      setPendingRP(rp);
      setChosenSize("");
      setChosenColor("");
      setChosenFlavor("");
      setChosenWeight("");
      setSizeColorDialog(true);
      return;
    }
    addRetailerProductToCart(rp.id, rp.retailerId, rp.price, rp.name);
    toast.success(`${rp.name} added to cart`);
  };

  const confirmSizeColorAdd = () => {
    if (!pendingRP) return;
    if (pendingRP.availableSizes && !chosenSize) {
      toast.error("Please select a size");
      return;
    }
    if (pendingRP.availableColors && !chosenColor) {
      toast.error("Please select a colour");
      return;
    }
    if (pendingRP.availableFlavors && !chosenFlavor) {
      toast.error("Please select a flavour");
      return;
    }
    if (pendingRP.availableWeights && !chosenWeight) {
      toast.error("Please select a weight");
      return;
    }
    addRetailerProductToCart(
      pendingRP.id,
      pendingRP.retailerId,
      pendingRP.price,
      pendingRP.name,
      chosenSize || undefined,
      chosenColor || undefined,
      chosenFlavor || undefined,
      chosenWeight || undefined,
    );
    toast.success(`${pendingRP.name} added to cart`);
    setSizeColorDialog(false);
    setPendingRP(null);
  };

  const totalCount = filteredUniversal.length + filteredRetailerProducts.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!isAuthenticated && (
        <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary flex items-center gap-2">
          <span>📍</span>
          <span>
            Browsing products available in <strong>Osizweni</strong>. Log in to
            add items to your cart.
          </span>
        </div>
      )}
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">
          Browse Catalogue
        </h1>
        <p className="text-muted-foreground text-sm">
          {available.filter((p) => p.inStock).length +
            retailerProducts.filter((p) => p.inStock).length}{" "}
          items available from local stores and markets
        </p>
      </div>

      {/* Town toggle */}
      {towns.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setSelectedTownId("_all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedTownId === "_all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="catalogue.town.all_tab"
          >
            All Towns
          </button>
          {towns.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setSelectedTownId(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedTownId === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="catalogue.town.tab"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="pl-9"
          data-ocid="catalogue.search_input"
        />
      </div>

      {/* Category search + scrollable chips */}
      <div className="mb-3">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            placeholder="Filter categories…"
            className="pl-8 h-8 text-xs"
            data-ocid="catalogue.category_search_input"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {visibleCategories.map((cat) => (
            <button
              type="button"
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                category === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              data-ocid="catalogue.filter.tab"
            >
              <span>{cat.label}</span>
            </button>
          ))}
          {visibleCategories.length === 0 && (
            <p className="text-xs text-muted-foreground py-1.5 px-1">
              No matching categories
            </p>
          )}
        </div>
      </div>

      {/* Retailer filter chips */}
      {activeRetailers.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setSelectedRetailerId("all")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              selectedRetailerId === "all"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            data-ocid="catalogue.retailer_filter.tab"
          >
            All Retailers
          </button>
          {activeRetailers.map((retailer) => (
            <button
              type="button"
              key={retailer.id}
              onClick={() => setSelectedRetailerId(retailer.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedRetailerId === retailer.id
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              data-ocid="catalogue.retailer_filter.tab"
            >
              {retailer.name}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {totalCount} product{totalCount !== 1 ? "s" : ""}
          {category !== "All" ? ` in ${category}` : ""}
          {selectedRetailerId !== "all"
            ? ` from ${retailers.find((r) => r.id === selectedRetailerId)?.name}`
            : ""}
        </p>
        {cart.length > 0 && (
          <a href="/cart">
            <Badge className="gap-1 cursor-pointer hover:bg-primary/80">
              <ShoppingCart className="h-3 w-3" />
              {cart.reduce((s, i) => s + i.quantity, 0)} in cart
            </Badge>
          </a>
        )}
      </div>

      {/* Grid */}
      {totalCount === 0 ? (
        <div className="text-center py-16" data-ocid="catalogue.empty_state">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-display font-semibold text-lg mb-1">
            No products found
          </p>
          <p className="text-muted-foreground text-sm">
            Try a different search or category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* Universal products — shuffled */}
          {shuffledUniversal.map((product, i) => {
            const qty = getCartQty(product.id);
            const inCart = qty > 0;
            const productListingList = getProductListings(product.id);
            const hasListings = productListingList.length > 0;
            const chosenListingId = selectedListings[product.id];
            const chosenPrice = getChosenPrice(product.id);
            const minPrice = getMinPrice(product.id);
            const chosenListing = productListingList.find(
              (l) => l.id === chosenListingId,
            );
            const selectedIsDisabled = chosenListing
              ? isListingDisabled(chosenListing)
              : false;
            const canAdd =
              hasListings && !!chosenListingId && !selectedIsDisabled;
            const isBeverage = isBeverageCategory(product.category);

            // Special service product — render separately
            if (product.isSpecial) {
              const specialInCart = cart.some(
                (ci) => ci.productId === product.id,
              );
              return (
                <Card
                  key={product.id}
                  className="card-glow border-yellow-400/50 overflow-hidden transition-all hover:shadow-md relative"
                  data-ocid={`catalogue.item.${i + 1}`}
                >
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="text-[10px] gap-0.5 bg-yellow-500/90 text-yellow-950 border-0 shadow">
                      <Zap className="h-2.5 w-2.5" />
                      Special Service
                    </Badge>
                  </div>
                  <button
                    type="button"
                    className="absolute top-2 right-2 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy shareable link"
                    data-ocid={`catalogue.share.button.${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `${window.location.origin}${window.location.pathname}#/listing/special_${product.id}`;
                      navigator.clipboard
                        .writeText(url)
                        .then(() => toast.success("Link copied!"));
                    }}
                  >
                    <Share2 className="h-3 w-3" />
                  </button>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center h-24 sm:h-32 text-4xl sm:text-5xl overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      "⚡"
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {product.description}
                    </p>
                    <div className="mb-2">
                      <span className="font-display font-bold text-yellow-700 dark:text-yellow-400 text-sm">
                        R{(product.serviceFee ?? 20).toFixed(2)} service fee
                      </span>
                    </div>
                    {product.inStock ? (
                      <Button
                        size="sm"
                        onClick={() => handleAddSpecial(product)}
                        className="h-7 w-full text-xs gap-1 bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                        data-ocid={`catalogue.add.button.${i + 1}`}
                      >
                        <Zap className="h-3 w-3" />
                        {specialInCart ? "Add Another Meter" : "Order Service"}
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Out of stock
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card
                key={product.id}
                className={`card-glow border-border/60 overflow-hidden transition-all ${
                  !product.inStock ? "opacity-60" : "hover:shadow-md"
                }`}
                data-ocid={`catalogue.item.${i + 1}`}
              >
                <div className="bg-muted/40 flex items-center justify-center h-24 sm:h-32 text-4xl sm:text-5xl overflow-hidden relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    product.imageEmoji
                  )}
                  {/* 18+ badge */}
                  {isBeverage && (
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="text-[9px] px-1.5 py-0 bg-red-600 text-white border-0 gap-0.5 shadow-sm">
                        <AlertTriangle className="h-2 w-2" />
                        18+
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 relative">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                      title="Copy shareable link"
                      data-ocid={`catalogue.share.button.${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}${window.location.pathname}#/listing/${chosenListingId ?? product.id}`;
                        navigator.clipboard
                          .writeText(url)
                          .then(() => toast.success("Link copied!"));
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {product.description}
                  </p>

                  {/* Age restriction warning */}
                  {isBeverage && (
                    <p className="text-[10px] text-red-600 font-medium mb-1.5 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                      Age restriction: 18+ only
                    </p>
                  )}

                  {/* Price display */}
                  <div className="mb-2">
                    {!hasListings ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        Not available
                      </Badge>
                    ) : chosenPrice !== null ? (
                      <span className="font-display font-bold text-primary text-sm">
                        R{chosenPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-display font-bold text-primary text-sm">
                        from R{minPrice?.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Retailer selector */}
                  {hasListings && product.inStock && (
                    <div className="mb-2">
                      <Select
                        value={chosenListingId || ""}
                        onValueChange={(v) =>
                          handleSelectListing(product.id, v)
                        }
                      >
                        <SelectTrigger
                          className="h-7 text-[11px]"
                          data-ocid={`catalogue.retailer.select.${i + 1}`}
                        >
                          <SelectValue placeholder="Select retailer" />
                        </SelectTrigger>
                        <SelectContent>
                          {productListingList.map((listing) => {
                            const retailer = getRetailerForListing(
                              listing.retailerId,
                            );
                            const isClosed = retailer
                              ? !isRetailerOpen(retailer)
                              : false;
                            const isOOS = !!listing.outOfStock;
                            const disabled = isClosed || isOOS;
                            return (
                              <SelectItem
                                key={listing.id}
                                value={listing.id}
                                className="text-xs"
                                disabled={disabled}
                              >
                                <span className="flex items-center gap-1.5 flex-wrap">
                                  <span>{getListingLabel(listing)}</span>
                                  {isClosed && (
                                    <span className="text-red-600 font-medium">
                                      · Closed
                                      {retailer
                                        ? ` (${getNextOpeningText(retailer)})`
                                        : ""}
                                    </span>
                                  )}
                                  {!isClosed && isOOS && (
                                    <span className="text-amber-600 font-medium">
                                      · Out of Stock
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {/* Show status badge for selected listing */}
                      {chosenListing &&
                        selectedIsDisabled &&
                        (() => {
                          const retailer = getRetailerForListing(
                            chosenListing.retailerId,
                          );
                          const isClosed = retailer
                            ? !isRetailerOpen(retailer)
                            : false;
                          return isClosed ? (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-red-600">
                              <Clock className="h-3 w-3" />
                              <span>
                                {retailer
                                  ? getNextOpeningText(retailer)
                                  : "Closed"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600">
                              <span>⚠ Out of stock at this retailer</span>
                            </div>
                          );
                        })()}
                    </div>
                  )}

                  {/* Add to cart controls */}
                  <div className="flex items-center justify-between gap-1">
                    {!product.inStock || !hasListings ? (
                      <div />
                    ) : !canAdd && !inCart ? (
                      <p className="text-[10px] text-muted-foreground">
                        Select retailer to add
                      </p>
                    ) : inCart ? (
                      <div className="flex items-center gap-1 w-full justify-between">
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs hover:bg-muted"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdd(product.id, product.name)}
                          className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs"
                          data-ocid={`catalogue.add.button.${i + 1}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAdd(product.id, product.name)}
                        disabled={!canAdd}
                        className="h-7 w-full text-xs gap-1"
                        data-ocid={`catalogue.add.button.${i + 1}`}
                      >
                        <Check className="h-3 w-3" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Retailer exclusive products — shuffled */}
          {shuffledRetailerProducts.map((rp, i) => {
            const retailer = retailers.find((r) => r.id === rp.retailerId);
            const area = businessAreas.find(
              (a) => a.id === retailer?.businessAreaId,
            );
            const town = retailer
              ? towns.find((t) => t.id === retailer.townId)
              : null;
            const rpQty = getRetailerProductCartQty(rp.id);
            const rpInCart = rpQty > 0;
            const rpRetailerClosed = retailer
              ? !isRetailerOpen(retailer)
              : false;
            const rpUnavailable = !rp.inStock || rpRetailerClosed;
            const isBeverage = isBeverageCategory(rp.category);

            return (
              <Card
                key={rp.id}
                className={`card-glow border-amber-200/60 overflow-hidden transition-all ${
                  rpUnavailable ? "opacity-60" : "hover:shadow-md"
                }`}
                data-ocid={`catalogue.exclusive.item.${i + 1}`}
              >
                <div className="relative bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-center h-24 sm:h-32 text-4xl sm:text-5xl overflow-hidden">
                  {rp.images?.[0] ? (
                    <img
                      src={rp.images[0]}
                      alt={rp.name}
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    rp.imageEmoji
                  )}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 items-end">
                    <Badge className="text-[9px] px-1.5 py-0 bg-amber-500 text-white border-0 gap-0.5 shadow-sm">
                      <Star className="h-2 w-2 fill-white" />
                      Exclusive
                    </Badge>
                    {!rpRetailerClosed && !rp.inStock && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-amber-600 text-white border-0 shadow-sm">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  {/* 18+ badge for beverages */}
                  {isBeverage && (
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="text-[9px] px-1.5 py-0 bg-red-600 text-white border-0 gap-0.5 shadow-sm">
                        <AlertTriangle className="h-2 w-2" />
                        18+
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
                    {rp.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">
                    {rp.description}
                  </p>
                  {/* Retailer + area info */}
                  {retailer && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mb-0.5 truncate">
                      {retailer.name}
                      {area ? ` (${area.name})` : ""}
                    </p>
                  )}
                  {/* Retailer status with countdown */}
                  {retailer && (
                    <div className="mb-1">
                      <RetailerStatusBadge retailer={retailer} />
                    </div>
                  )}
                  {/* Town badge */}
                  {town && (
                    <div className="flex items-center gap-0.5 mb-1">
                      <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground">
                        {town.name}
                      </span>
                    </div>
                  )}
                  {/* Size/color/flavor/weight badges if available */}
                  {(rp.availableSizes ||
                    rp.availableColors ||
                    rp.availableFlavors ||
                    rp.availableWeights) && (
                    <div className="text-[10px] text-muted-foreground mb-1 space-y-0.5">
                      {rp.availableSizes && <p>Sizes: {rp.availableSizes}</p>}
                      {rp.availableColors && (
                        <p>Colors: {rp.availableColors}</p>
                      )}
                      {rp.availableFlavors && (
                        <p>Flavours: {rp.availableFlavors}</p>
                      )}
                      {rp.availableWeights && (
                        <p>Weights: {rp.availableWeights}</p>
                      )}
                    </div>
                  )}
                  {/* Age restriction */}
                  {isBeverage && (
                    <p className="text-[10px] text-red-600 font-medium mb-1 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                      Age restriction: 18+ only
                    </p>
                  )}

                  {/* Price — fixed, no dropdown */}
                  <div className="mb-2">
                    <span className="font-display font-bold text-primary text-sm">
                      R{rp.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Add to cart */}
                  <div className="flex items-center justify-between gap-1">
                    {rpRetailerClosed ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 text-red-600 border-red-200"
                      >
                        Retailer Closed
                      </Badge>
                    ) : !rp.inStock ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 text-amber-600"
                      >
                        Out of stock
                      </Badge>
                    ) : rpInCart ? (
                      <div className="flex items-center gap-1 w-full justify-between">
                        <button
                          type="button"
                          onClick={() => removeFromCart(`rp_${rp.id}`)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs hover:bg-muted"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold w-4 text-center">
                          {rpQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddRetailerProduct(rp)}
                          className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs"
                          data-ocid={`catalogue.exclusive.add.button.${i + 1}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddRetailerProduct(rp)}
                        className="h-7 w-full text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white border-0"
                        data-ocid={`catalogue.exclusive.add.button.${i + 1}`}
                      >
                        <Check className="h-3 w-3" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Size/Color/Flavor/Weight Selection Dialog */}
      <Dialog open={sizeColorDialog} onOpenChange={setSizeColorDialog}>
        <DialogContent
          className="max-w-sm"
          data-ocid="catalogue.size_color.dialog"
        >
          <DialogHeader>
            <DialogTitle>Choose Options</DialogTitle>
          </DialogHeader>
          {pendingRP && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center text-2xl overflow-hidden shrink-0">
                  {pendingRP.images?.[0] ? (
                    <img
                      src={pendingRP.images[0]}
                      alt={pendingRP.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    pendingRP.imageEmoji
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{pendingRP.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R{pendingRP.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {pendingRP.availableSizes &&
                (() => {
                  const oosSet = new Set(
                    (pendingRP.outOfStockSizes ?? "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  );
                  return (
                    <div className="space-y-1.5">
                      <Label>Size</Label>
                      <div className="flex flex-wrap gap-2">
                        {pendingRP.availableSizes
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((s) => {
                            const isOOS = oosSet.has(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={isOOS}
                                onClick={() => !isOOS && setChosenSize(s)}
                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                  isOOS
                                    ? "opacity-40 cursor-not-allowed bg-muted border-border line-through text-muted-foreground"
                                    : chosenSize === s
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-card border-border hover:border-primary/50"
                                }`}
                                title={isOOS ? "Out of stock" : undefined}
                                data-ocid={`catalogue.size_option.${s}`}
                              >
                                {s}
                                {isOOS && (
                                  <span className="ml-1 text-[10px]">
                                    (OOS)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}

              {pendingRP.availableColors &&
                (() => {
                  const oosSet = new Set(
                    (pendingRP.outOfStockColors ?? "")
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean),
                  );
                  return (
                    <div className="space-y-1.5">
                      <Label>Colour</Label>
                      <div className="flex flex-wrap gap-2">
                        {pendingRP.availableColors
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean)
                          .map((c) => {
                            const isOOS = oosSet.has(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                disabled={isOOS}
                                onClick={() => !isOOS && setChosenColor(c)}
                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                  isOOS
                                    ? "opacity-40 cursor-not-allowed bg-muted border-border line-through text-muted-foreground"
                                    : chosenColor === c
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-card border-border hover:border-primary/50"
                                }`}
                                title={isOOS ? "Out of stock" : undefined}
                                data-ocid={`catalogue.color_option.${c}`}
                              >
                                {c}
                                {isOOS && (
                                  <span className="ml-1 text-[10px]">
                                    (OOS)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}

              {pendingRP.availableFlavors &&
                (() => {
                  const oosSet = new Set(
                    (pendingRP.outOfStockFlavors ?? "")
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean),
                  );
                  return (
                    <div className="space-y-1.5">
                      <Label>Flavour</Label>
                      <div className="flex flex-wrap gap-2">
                        {pendingRP.availableFlavors
                          .split(",")
                          .map((f) => f.trim())
                          .filter(Boolean)
                          .map((f) => {
                            const isOOS = oosSet.has(f);
                            return (
                              <button
                                key={f}
                                type="button"
                                disabled={isOOS}
                                onClick={() => !isOOS && setChosenFlavor(f)}
                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                  isOOS
                                    ? "opacity-40 cursor-not-allowed bg-muted border-border line-through text-muted-foreground"
                                    : chosenFlavor === f
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-card border-border hover:border-primary/50"
                                }`}
                                title={isOOS ? "Out of stock" : undefined}
                                data-ocid={`catalogue.flavor_option.${f}`}
                              >
                                {f}
                                {isOOS && (
                                  <span className="ml-1 text-[10px]">
                                    (OOS)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}

              {pendingRP.availableWeights &&
                (() => {
                  const oosSet = new Set(
                    (pendingRP.outOfStockWeights ?? "")
                      .split(",")
                      .map((w) => w.trim())
                      .filter(Boolean),
                  );
                  return (
                    <div className="space-y-1.5">
                      <Label>Weight</Label>
                      <div className="flex flex-wrap gap-2">
                        {pendingRP.availableWeights
                          .split(",")
                          .map((w) => w.trim())
                          .filter(Boolean)
                          .map((w) => {
                            const isOOS = oosSet.has(w);
                            return (
                              <button
                                key={w}
                                type="button"
                                disabled={isOOS}
                                onClick={() => !isOOS && setChosenWeight(w)}
                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                  isOOS
                                    ? "opacity-40 cursor-not-allowed bg-muted border-border line-through text-muted-foreground"
                                    : chosenWeight === w
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-card border-border hover:border-primary/50"
                                }`}
                                title={isOOS ? "Out of stock" : undefined}
                                data-ocid={`catalogue.weight_option.${w}`}
                              >
                                {w}
                                {isOOS && (
                                  <span className="ml-1 text-[10px]">
                                    (OOS)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSizeColorDialog(false)}
              data-ocid="catalogue.size_color.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSizeColorAdd}
              disabled={
                !!(
                  (pendingRP?.availableSizes && !chosenSize) ||
                  (pendingRP?.availableColors && !chosenColor) ||
                  (pendingRP?.availableFlavors && !chosenFlavor) ||
                  (pendingRP?.availableWeights && !chosenWeight)
                )
              }
              data-ocid="catalogue.size_color.confirm_button"
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Coins,
  MapPin,
  Newspaper,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  type OrderStatus,
  type Retailer,
  getNextOpeningText,
  isRetailerOpen,
} from "../data/mockData";
import { useActor } from "../hooks/useActor";

// ─── Constant data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Personal Shopping",
    desc: "Our vetted shoppers physically purchase your items from local stores, malls, and markets.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Truck,
    title: "Community Delivery",
    desc: "Reliable drivers deliver to your pick-up point or straight to your home address.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: MapPin,
    title: "Pick-up Points",
    desc: "Visit your nearest community pick-up point. Walk-in and place orders right there.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Coins,
    title: "Nomayini Rewards",
    desc: "Earn up to 20% back in Nomayini tokens on every order. Spend, send to friends, or exchange for digital assets.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse & Order",
    desc: "Choose your items from our community catalogue — groceries, household, fast food and more.",
  },
  {
    step: "02",
    title: "Shopper Collects",
    desc: "A personal shopper accepts your order and heads to the store to purchase your items.",
  },
  {
    step: "03",
    title: "Driver Delivers",
    desc: "Your order is handed to a driver who delivers it to your chosen pick-up point or home.",
  },
  {
    step: "04",
    title: "You Collect",
    desc: "Receive your order at the pick-up point or relax at home and wait for your delivery.",
  },
];

// ─── Category badge colors ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "bg-green-100 text-green-800 border-green-200",
  Household: "bg-blue-100 text-blue-800 border-blue-200",
  "Fast Food": "bg-orange-100 text-orange-800 border-orange-200",
  Beverages: "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Personal Care": "bg-pink-100 text-pink-800 border-pink-200",
  "Baby & Kids": "bg-purple-100 text-purple-800 border-purple-200",
};

// ─── Product Card Component ──────────────────────────────────────────────────

interface TownListing {
  id: string;
  retailerName: string;
  businessAreaName: string;
  price: number;
  retailerId: string;
  listingId: string;
  outOfStock?: boolean;
  retailer?: Retailer;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    category: string;
    imageEmoji: string;
    images?: string[];
    inStock: boolean;
  };
  townListings: TownListing[];
  index: number;
  onAddToCart: (
    productId: string,
    listingId: string,
    retailerId: string,
    price: number,
    productName: string,
  ) => void;
}

function ProductCard({
  product,
  townListings,
  index,
  onAddToCart,
}: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState(
    townListings[0]?.listingId ?? "",
  );

  const availableListings = useMemo(
    () =>
      townListings.filter((l) => {
        const retailer = l.retailer;
        if (!retailer) return true;
        return isRetailerOpen(retailer) && !l.outOfStock;
      }),
    [townListings],
  );

  const lowestPrice = useMemo(
    () =>
      townListings.reduce(
        (min, l) => (l.price < min ? l.price : min),
        Number.POSITIVE_INFINITY,
      ),
    [townListings],
  );

  const selectedListing = townListings.find(
    (l) => l.listingId === selectedListingId,
  );

  const selectedIsUnavailable = useMemo(() => {
    if (!selectedListing) return false;
    const retailer = selectedListing.retailer;
    if (!retailer) return false;
    return !isRetailerOpen(retailer) || !!selectedListing.outOfStock;
  }, [selectedListing]);

  const handleConfirm = useCallback(() => {
    if (!selectedListing) return;
    if (selectedIsUnavailable) return;
    onAddToCart(
      product.id,
      selectedListing.listingId,
      selectedListing.retailerId,
      selectedListing.price,
      product.name,
    );
    setExpanded(false);
    setSelectedListingId(townListings[0]?.listingId ?? "");
  }, [
    selectedListing,
    selectedIsUnavailable,
    product,
    onAddToCart,
    townListings,
  ]);

  const categoryColor =
    CATEGORY_COLORS[product.category] ??
    "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div
      className="flex-shrink-0 w-[260px] sm:w-[280px]"
      data-ocid={`home.product_card.item.${index}`}
    >
      <Card className="h-full overflow-hidden border border-border/70 card-glow hover:shadow-md transition-shadow duration-200">
        {/* Product image */}
        <div className="relative h-40 bg-secondary/40 flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-6xl select-none">{product.imageEmoji}</span>
          )}
          {/* Category badge */}
          <span
            className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryColor}`}
          >
            {product.category}
          </span>
        </div>

        <CardContent className="p-4">
          {!expanded ? (
            <>
              <h3 className="font-display font-bold text-sm leading-snug mb-1 line-clamp-2 text-foreground">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                From{" "}
                <span className="font-semibold text-primary">
                  R{lowestPrice.toFixed(2)}
                </span>{" "}
                · {townListings.length}{" "}
                {townListings.length === 1 ? "store" : "stores"}
              </p>
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs"
                data-ocid={`home.add_to_cart.button.${index}`}
                onClick={() => setExpanded(true)}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Add to Cart
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">
                  Choose store
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setExpanded(false)}
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <select
                className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                data-ocid={`home.retailer.select.${index}`}
              >
                {townListings.map((l) => {
                  const retailer = l.retailer;
                  const isClosed = retailer ? !isRetailerOpen(retailer) : false;
                  const isOOS = !!l.outOfStock;
                  const disabled = isClosed || isOOS;
                  let suffix = "";
                  if (isClosed && retailer) {
                    suffix = ` (Closed · ${getNextOpeningText(retailer)})`;
                  } else if (isOOS) {
                    suffix = " (Out of Stock)";
                  }
                  return (
                    <option
                      key={l.listingId}
                      value={l.listingId}
                      disabled={disabled}
                    >
                      {l.retailerName}
                      {l.businessAreaName ? ` (${l.businessAreaName})` : ""} — R
                      {l.price.toFixed(2)}
                      {suffix}
                    </option>
                  );
                })}
              </select>
              {selectedIsUnavailable &&
                selectedListing?.retailer &&
                (() => {
                  const retailer = selectedListing.retailer;
                  const isClosed = !isRetailerOpen(retailer);
                  return isClosed ? (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <span>🕐</span>
                      {getNextOpeningText(retailer)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600">
                      ⚠ Out of stock at this store
                    </p>
                  );
                })()}
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs bg-success hover:bg-success/90 text-success-foreground"
                data-ocid={`home.confirm_add.button.${index}`}
                onClick={handleConfirm}
                disabled={
                  selectedIsUnavailable || availableListings.length === 0
                }
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {selectedIsUnavailable
                  ? "Unavailable"
                  : `Confirm — R${selectedListing?.price.toFixed(2) ?? "0.00"}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Exclusive Product Card (retailer-specific, fixed price) ─────────────────

interface ExclusiveProductCardProps {
  retailerProduct: {
    id: string;
    name: string;
    category: string;
    imageEmoji: string;
    images?: string[];
    inStock: boolean;
    price: number;
    retailerId: string;
  };
  retailer?: Retailer;
  areaName: string;
  index: number;
  onAddToCart: (
    retailerProductId: string,
    retailerId: string,
    price: number,
    productName: string,
  ) => void;
}

function ExclusiveProductCard({
  retailerProduct,
  retailer,
  areaName,
  index,
  onAddToCart,
}: ExclusiveProductCardProps) {
  const categoryColor =
    CATEGORY_COLORS[retailerProduct.category] ??
    "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div
      className="flex-shrink-0 w-[260px] sm:w-[280px]"
      data-ocid={`home.product_card.item.${index}`}
    >
      <Card className="h-full overflow-hidden border border-amber-200/60 card-glow hover:shadow-md transition-shadow duration-200">
        {/* Product image */}
        <div className="relative h-40 bg-secondary/40 flex items-center justify-center overflow-hidden">
          {retailerProduct.images && retailerProduct.images.length > 0 ? (
            <img
              src={retailerProduct.images[0]}
              alt={retailerProduct.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-6xl select-none">
              {retailerProduct.imageEmoji}
            </span>
          )}
          {/* Category badge */}
          <span
            className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryColor}`}
          >
            {retailerProduct.category}
          </span>
          {/* Exclusive badge */}
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
            Exclusive
          </span>
        </div>

        <CardContent className="p-4">
          <h3 className="font-display font-bold text-sm leading-snug mb-1 line-clamp-2 text-foreground">
            {retailerProduct.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">
              {retailer?.name ?? "Store"}
            </span>
            {areaName ? ` · ${areaName}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-semibold text-primary">
              R{retailerProduct.price.toFixed(2)}
            </span>
          </p>
          <Button
            size="sm"
            className="w-full gap-1.5 text-xs"
            data-ocid={`home.add_to_cart.button.${index}`}
            onClick={() =>
              onAddToCart(
                retailerProduct.id,
                retailerProduct.retailerId,
                retailerProduct.price,
                retailerProduct.name,
              )
            }
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Popular In Town Section ─────────────────────────────────────────────────

function PopularInTownSection() {
  const {
    products,
    retailers,
    listings,
    towns,
    businessAreas,
    retailerProducts,
    addToCartWithListing,
    addRetailerProductToCart,
    cartCount,
  } = useApp();
  const { isAuthenticated } = useAuth();

  const [selectedTownId, setSelectedTownId] = useState(towns[0]?.id ?? "t1");

  useEffect(() => {
    if (towns.length === 0) return;
    const isValidTown = towns.some((t) => t.id === selectedTownId);
    if (!isValidTown) {
      const osizweni = towns.find((t) =>
        t.name.toLowerCase().includes("osizweni"),
      );
      setSelectedTownId(osizweni?.id ?? towns[0].id);
    }
  }, [towns, selectedTownId]);

  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedTown = towns.find((t) => t.id === selectedTownId);

  // Get retailers in selected town
  const townRetailerIds = useMemo(
    () =>
      new Set(
        retailers.filter((r) => r.townId === selectedTownId).map((r) => r.id),
      ),
    [retailers, selectedTownId],
  );

  // Build filtered universal product list with their town-specific listings
  const productsWithListings = useMemo(() => {
    return products
      .filter((p) => p.inStock && !p.isSuggestion)
      .map((p) => {
        const townListings = listings
          .filter(
            (l) => l.productId === p.id && townRetailerIds.has(l.retailerId),
          )
          .map((l) => {
            const retailer = retailers.find((r) => r.id === l.retailerId);
            const area = businessAreas.find(
              (a) => a.id === retailer?.businessAreaId,
            );
            return {
              id: l.id,
              listingId: l.id,
              retailerId: l.retailerId,
              retailerName: retailer?.name ?? "Unknown Store",
              businessAreaName: area?.name ?? "",
              price: l.price,
              outOfStock: l.outOfStock,
              retailer,
            };
          });
        return { product: p, townListings };
      })
      .filter((item) => item.townListings.length > 0);
  }, [products, listings, retailers, townRetailerIds, businessAreas]);

  // Build exclusive (retailer-specific) products for the selected town
  const exclusiveProductsInTown = useMemo(() => {
    return retailerProducts
      .filter((rp) => rp.inStock && townRetailerIds.has(rp.retailerId))
      .map((rp) => {
        const retailer = retailers.find((r) => r.id === rp.retailerId);
        const area = businessAreas.find(
          (a) => a.id === retailer?.businessAreaId,
        );
        return { retailerProduct: rp, retailer, areaName: area?.name ?? "" };
      });
  }, [retailerProducts, retailers, townRetailerIds, businessAreas]);

  // Shuffle carousel so customers see different products each visit
  const universalSlice = useMemo(() => {
    const arr = [...productsWithListings];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 20);
  }, [productsWithListings]);
  const exclusiveSlice = useMemo(() => {
    const arr = [...exclusiveProductsInTown];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.max(0, 20 - universalSlice.length));
  }, [exclusiveProductsInTown, universalSlice.length]);

  // Total count for display
  const totalCarouselCount =
    productsWithListings.length + exclusiveProductsInTown.length;

  const navigate = useNavigate();

  const handleAddToCart = useCallback(
    (
      productId: string,
      listingId: string,
      retailerId: string,
      price: number,
      productName: string,
    ) => {
      if (!isAuthenticated) {
        toast.info("Please log in or create an account to add items to cart", {
          action: {
            label: "Log In",
            onClick: () => navigate({ to: "/login" }),
          },
        });
        return;
      }
      addToCartWithListing(productId, listingId, retailerId, price);
      toast.success(`${productName} added to cart`, {
        description: `R${price.toFixed(2)} · Cart has ${cartCount + 1} item${cartCount + 1 !== 1 ? "s" : ""}`,
      });
    },
    [isAuthenticated, addToCartWithListing, cartCount, navigate],
  );

  const handleAddExclusiveToCart = useCallback(
    (
      retailerProductId: string,
      retailerId: string,
      price: number,
      productName: string,
    ) => {
      if (!isAuthenticated) {
        toast.info("Please log in or create an account to add items to cart", {
          action: {
            label: "Log In",
            onClick: () => navigate({ to: "/login" }),
          },
        });
        return;
      }
      addRetailerProductToCart(
        retailerProductId,
        retailerId,
        price,
        productName,
      );
      toast.success(`${productName} added to cart`, {
        description: `R${price.toFixed(2)} · Cart has ${cartCount + 1} item${cartCount + 1 !== 1 ? "s" : ""}`,
      });
    },
    [isAuthenticated, addRetailerProductToCart, cartCount, navigate],
  );

  const scrollCarousel = useCallback((direction: "prev" | "next") => {
    const el = carouselRef.current;
    if (!el) return;
    // Scroll by 3 card widths (280px + 16px gap = 296px each)
    const scrollAmount = 296 * 3;
    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  if (totalCarouselCount === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14 bg-background border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Popular in{" "}
              <span className="text-primary">
                {selectedTown?.name ?? "Your Town"}
              </span>
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Browse and add to cart — available at local stores right now
            </p>
          </div>
          <Link to="/catalogue" data-ocid="home.catalogue.link">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              View full catalogue
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Town selector pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {towns.map((town) => (
            <button
              type="button"
              key={town.id}
              onClick={() => setSelectedTownId(town.id)}
              data-ocid="home.town_selector.tab"
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedTownId === town.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              {town.name}
            </button>
          ))}
        </div>

        {/* Carousel container */}
        <div className="relative" data-ocid="home.products_carousel.panel">
          {/* Scroll left */}
          <button
            type="button"
            onClick={() => scrollCarousel("prev")}
            data-ocid="home.carousel.prev_button"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Scroll right */}
          <button
            type="button"
            onClick={() => scrollCarousel("next")}
            data-ocid="home.carousel.next_button"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Scrollable track */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {universalSlice.map(({ product, townListings }, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                townListings={townListings}
                index={idx + 1}
                onAddToCart={handleAddToCart}
              />
            ))}
            {exclusiveSlice.map(
              ({ retailerProduct, retailer, areaName }, idx) => (
                <ExclusiveProductCard
                  key={retailerProduct.id}
                  retailerProduct={retailerProduct}
                  retailer={retailer}
                  areaName={areaName}
                  index={universalSlice.length + idx + 1}
                  onAddToCart={handleAddExclusiveToCart}
                />
              ),
            )}
          </div>
        </div>

        {/* Scroll hint fade edges */}
        <style>{`
          [data-ocid="home.products_carousel.panel"] > div::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </section>
  );
}

// ─── News Carousel Section ───────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  imagesJson: string | null;
  authorPrincipal: string;
  createdAt: number;
  published: boolean;
}

interface ArticleCategory {
  id: string;
  name: string;
}

function NewsCarouselSection() {
  const { actor } = useActor();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      (actor as any).getArticles().catch(() => []),
      (actor as any).getArticleCategories().catch(() => []),
    ]).then(([arts, cats]) => {
      const published = (arts as Article[]).filter((a) => a.published);
      // Shuffle randomly
      for (let i = published.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [published[i], published[j]] = [published[j], published[i]];
      }
      setArticles(published);
      setCategories(cats as ArticleCategory[]);
      setLoading(false);
    });
  }, [actor]);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "News";

  const getImageUrl = (imagesJson: string | null): string | null => {
    if (!imagesJson) return null;
    try {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      return null;
    } catch {
      return null;
    }
  };

  const scrollCarousel = useCallback((direction: "prev" | "next") => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "next" ? 900 : -900,
      behavior: "smooth",
    });
  }, []);

  // Don't render if no articles and not loading
  if (!loading && articles.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-muted/20 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Newspaper className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                News & Updates
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Latest from the Thuma Thina community
            </p>
          </div>
          <Link to="/news" data-ocid="home.news.link">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              View All News
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative" data-ocid="home.news_carousel.panel">
          <button
            type="button"
            onClick={() => scrollCarousel("prev")}
            data-ocid="home.news_carousel.prev_button"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel("next")}
            data-ocid="home.news_carousel.next_button"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading
              ? Array.from({ length: 4 }, (_, i) => i).map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-72 rounded-xl border border-border/50 bg-card overflow-hidden"
                  >
                    <div className="h-40 bg-muted animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-muted animate-pulse rounded w-16" />
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-muted animate-pulse rounded w-24" />
                    </div>
                  </div>
                ))
              : articles.map((article, idx) => {
                  const imgUrl = getImageUrl(article.imagesJson);
                  return (
                    <Link
                      key={article.id}
                      to="/news/$articleId"
                      params={{ articleId: article.id }}
                      data-ocid={`home.news.item.${idx + 1}`}
                      className="flex-shrink-0 w-72 rounded-xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                    >
                      {/* Image */}
                      <div className="h-40 bg-muted/60 overflow-hidden flex items-center justify-center relative">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                            <Newspaper className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-2">
                          {getCategoryName(article.categoryId)}
                        </span>
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.createdAt).toLocaleDateString(
                            "en-ZA",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Track My Order Section ──────────────────────────────────────────────────

function TrackMyOrderSection() {
  const { orders } = useApp();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundOrderId, setFoundOrderId] = useState<string | null>(null);

  const foundOrder = useMemo(
    () => (foundOrderId ? orders.find((o) => o.id === foundOrderId) : null),
    [orders, foundOrderId],
  );

  const handleTrack = useCallback(() => {
    const query = orderId.trim().toLowerCase();
    if (!query) return;
    const match = orders.find((o) => o.id.toLowerCase() === query);
    setFoundOrderId(match?.id ?? null);
    setSearched(true);
  }, [orderId, orders]);

  const currentStepIndex = foundOrder
    ? ORDER_STATUS_STEPS.indexOf(foundOrder.status as OrderStatus)
    : -1;

  // Determine display steps based on delivery type
  const displaySteps = useMemo(() => {
    if (!foundOrder) return ORDER_STATUS_STEPS;
    if (foundOrder.deliveryType === "pickup_point") {
      return ORDER_STATUS_STEPS.filter(
        (s) => s !== "out_for_delivery" && s !== "delivered",
      );
    }
    return ORDER_STATUS_STEPS.filter((s) => s !== "collected");
  }, [foundOrder]);

  return (
    <section className="py-12 sm:py-16 bg-muted/30 border-b border-border/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary font-medium mb-4">
            <Package className="h-4 w-4" />
            Order Tracking
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Track Your Order
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Enter your order ID to see a live status update on where your order
            is right now.
          </p>
        </div>

        {/* Search box */}
        <div className="flex gap-2 max-w-lg mx-auto mb-6">
          <Input
            placeholder="e.g. ord123456"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              if (searched) setSearched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            className="font-mono text-sm"
            data-ocid="track.order_id.input"
          />
          <Button
            onClick={handleTrack}
            className="gap-2 shrink-0"
            data-ocid="track.submit.button"
          >
            <Search className="h-4 w-4" />
            Track
          </Button>
        </div>

        {/* Not found */}
        {searched && !foundOrder && (
          <div
            className="text-center py-6 text-muted-foreground"
            data-ocid="track.not_found.error_state"
          >
            <div className="text-4xl mb-2">🔍</div>
            <p className="font-semibold text-sm">No order found with that ID</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Check the ID and try again. Order IDs are shown in your
              confirmation.
            </p>
          </div>
        )}

        {/* Found order */}
        {foundOrder && (
          <Card
            className="card-glow border border-primary/20 overflow-hidden"
            data-ocid="track.result.panel"
          >
            {/* Order summary header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-primary/5">
              <div>
                <p className="font-display font-bold text-sm text-foreground">
                  Order #{foundOrder.id}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(foundOrder.createdAt).toLocaleString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-primary text-sm">
                  R{foundOrder.total.toFixed(2)}
                </span>
                <StatusBadge status={foundOrder.status} />
              </div>
            </div>

            {/* Status timeline */}
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Order Progress
              </p>
              <div className="flex flex-col">
                {displaySteps.map((step, i) => {
                  const globalIdx = ORDER_STATUS_STEPS.indexOf(step);
                  const isDone = currentStepIndex >= globalIdx;
                  const isCurrent =
                    foundOrder.status === step ||
                    (i === displaySteps.length - 1 &&
                      currentStepIndex >= globalIdx);
                  const isLast = i === displaySteps.length - 1;
                  return (
                    <div key={step} className="flex gap-3">
                      {/* Circle + connector */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[9px] font-bold z-10 relative",
                              isDone
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border/60 bg-background text-muted-foreground",
                            )}
                          >
                            {isDone ? "✓" : i + 1}
                          </div>
                          {isCurrent && isDone && (
                            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40" />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={cn(
                              "w-px flex-1 min-h-[20px] my-0.5",
                              isDone ? "bg-primary/40" : "bg-border/40",
                            )}
                          />
                        )}
                      </div>
                      {/* Label */}
                      <div
                        className={cn("flex-1 pb-3 pt-0.5", isLast && "pb-0")}
                      >
                        <span
                          className={cn(
                            "text-sm",
                            isCurrent
                              ? "font-semibold text-foreground"
                              : isDone
                                ? "text-muted-foreground"
                                : "text-muted-foreground/50",
                          )}
                        >
                          {ORDER_STATUS_LABELS[step]}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  {foundOrder.pickupPointName}
                  {foundOrder.deliveryType === "home_delivery" && (
                    <span className="text-primary font-medium ml-1">
                      → Home Delivery
                    </span>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() =>
                    navigate({
                      to: "/orders/$orderId",
                      params: { orderId: foundOrder.id },
                    })
                  }
                >
                  Full Details
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

// ─── Floating Cart Button ────────────────────────────────────────────────────

function FloatingCartButton() {
  const { cartCount } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cartCount === 0) return null;

  const handleCartClick = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to view your cart and checkout", {
        action: {
          label: "Log In",
          onClick: () => navigate({ to: "/login" }),
        },
      });
      return;
    }
    navigate({ to: "/cart" });
  };

  return (
    <button
      type="button"
      onClick={handleCartClick}
      data-ocid="home.cart_float.button"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all duration-200 font-semibold text-sm animate-in slide-in-from-bottom-2"
      aria-label={`View cart with ${cartCount} items`}
    >
      <ShoppingCart className="h-4 w-4" />
      View Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
    </button>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────

export function LandingPage() {
  useApp(); // keep context alive

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative hero-gradient kente-bg overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white/80 mb-6">
              <Star className="h-3 w-3 fill-current" />
              Serving Communities Across South Africa
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Thuma Thina
            </h1>
            <p className="text-xl sm:text-2xl text-white font-bold mb-1 italic">
              Yonke into, Yonki ndawo, Ngaso Sonke Iskhathi
            </p>
            <p className="text-white/70 text-sm sm:text-base mb-3 font-medium tracking-wide uppercase">
              Everything, everywhere, all the time
            </p>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
              Community empowerment and development working together — bringing
              access, opportunity, and convenience to every neighbourhood. Order
              online or walk into your nearest pick-up point.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register/customer"
                data-ocid="auth.register.primary_button"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-foreground hover:bg-white/90 font-semibold gap-2"
                >
                  Start Ordering
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                to="/register/staff"
                data-ocid="auth.apply.secondary_button"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 gap-2"
                >
                  <Users className="h-4 w-4" />
                  Join Our Team
                </Button>
              </Link>
              <Link to="/login" data-ocid="auth.login.button">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto text-white/80 hover:text-white hover:bg-white/10"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Mode Quick-Access */}
      <section className="bg-muted/40 border-y border-border/40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            <span className="text-muted-foreground font-medium shrink-0">
              🔐 Login to access your dashboard:
            </span>
            <div className="flex flex-wrap gap-2">
              <Link to="/login" data-ocid="nav.login.link">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Log In
                </Button>
              </Link>
              <Link
                to="/register/customer"
                data-ocid="nav.register_customer.link"
              >
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Register as Customer
                </Button>
              </Link>
              <Link to="/register/staff" data-ocid="nav.register_staff.link">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Join Our Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular In Your Town — Shop section */}
      <PopularInTownSection />

      {/* News & Updates Carousel */}
      <NewsCarouselSection />

      {/* Track My Order */}
      <TrackMyOrderSection />

      {/* Features */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Shopping made simple
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From your phone or the nearest pick-up point — Thuma Thina is here
            for every community member.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="card-glow border-border/60">
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}
                >
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Nomayini Token Rewards Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        {/* Gold/amber background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-300 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-yellow-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-sm text-amber-800 font-medium mb-4">
              <Coins className="h-4 w-4" />
              Exclusive Rewards Program
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-amber-900">
              Nomayini Token Rewards
            </h2>
            <p className="text-amber-700 text-lg max-w-2xl mx-auto">
              Every purchase earns you Nomayini tokens — our community digital
              currency that grows in value over time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Reward details */}
            <div className="space-y-6">
              <div className="flex gap-4 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🪙</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900 mb-1">
                    Earn up to 20% back
                  </h3>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    For every qualifying order you place on Thuma Thina, earn up
                    to 20% of the order value back in Nomayini tokens.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">⏰</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900 mb-1">
                    Unlock schedule
                  </h3>
                  <p className="text-amber-700 text-sm leading-relaxed mb-3">
                    Tokens are locked for a vesting period to reward long-term
                    community members:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-amber-800">
                        <strong>50%</strong> unlocks after{" "}
                        <strong>3 months</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-amber-800">
                        <strong>50%</strong> unlocks after{" "}
                        <strong>4 years</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💸</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-amber-900 mb-1">
                    Use your tokens
                  </h3>
                  <div className="space-y-1.5 mt-1">
                    {[
                      "🛒 Shop on Thuma Thina",
                      "🤝 Send to friends & family",
                      "🔄 Exchange for other digital assets",
                    ].map((use) => (
                      <div
                        key={use}
                        className="flex items-center gap-2 text-sm text-amber-800"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        {use}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Token showcase card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-3xl p-8 text-white shadow-xl shadow-amber-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Coins className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">
                      Nomayini Token
                    </h3>
                    <p className="text-white/70 text-sm">Community Currency</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/15 rounded-xl p-4">
                    <p className="text-white/70 text-xs mb-1">
                      Average order earn
                    </p>
                    <p className="font-display font-bold text-2xl">~R45</p>
                    <p className="text-white/60 text-xs">per R225 order</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-4">
                    <p className="text-white/70 text-xs mb-1">Max earn rate</p>
                    <p className="font-display font-bold text-2xl">20%</p>
                    <p className="text-white/60 text-xs">back in tokens</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/80 text-xs font-medium mb-3">
                    Token unlock timeline
                  </p>
                  <div className="relative h-2 bg-white/20 rounded-full mb-3">
                    <div className="absolute left-0 top-0 h-2 w-[20%] bg-green-400 rounded-full" />
                    <div className="absolute left-[20%] top-0 h-2 w-[30%] bg-yellow-300 rounded-full" />
                    <div className="absolute left-0 top-4 text-[10px] text-white/70">
                      Now
                    </div>
                    <div className="absolute left-[20%] top-4 text-[10px] text-white/70">
                      3 mo
                    </div>
                    <div className="absolute right-0 top-4 text-[10px] text-white/70">
                      4 yr
                    </div>
                  </div>
                  <div className="mt-6 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      50% unlocks at 3 months
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <div className="w-2 h-2 rounded-full bg-yellow-300" />
                      50% unlocks at 4 years
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative coin */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-300 border-4 border-white shadow-lg flex items-center justify-center">
                <Coins className="h-7 w-7 text-amber-700" />
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/register/customer"
              data-ocid="nomayini.register.primary_button"
            >
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2 shadow-lg shadow-amber-200"
              >
                <Coins className="h-4 w-4" />
                Start Earning Nomayini Tokens
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg">
              From order to door in four simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-border -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg flex items-center justify-center mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-display font-semibold text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Serving your community
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Currently active in Osizweni, Madadeni, and Newcastle — with more
              towns being added as we grow together with our communities.
            </p>

            {/* Social benefits */}
            <div className="space-y-4">
              {[
                {
                  icon: "💼",
                  title: "Job Creation",
                  desc: "Every order creates work for local shoppers, drivers, and pick-up point operators in your community.",
                },
                {
                  icon: "🏘️",
                  title: "Community Circulation",
                  desc: "Money spent on Thuma Thina stays local — supporting nearby retailers and small businesses.",
                },
                {
                  icon: "📱",
                  title: "Digital Inclusion",
                  desc: "Walk-in pick-up points ensure everyone can access the service, even without a smartphone or data.",
                },
                {
                  icon: "🌱",
                  title: "Economic Growth",
                  desc: "As we expand, new towns gain access to formal retail networks and sustainable income opportunities.",
                },
              ].map((benefit) => (
                <div key={benefit.title} className="flex gap-3 items-start">
                  <span className="text-2xl shrink-0">{benefit.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{benefit.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-gradient rounded-2xl p-8 text-white">
            <h3 className="font-display text-2xl font-bold mb-6">
              Join our growing team
            </h3>
            <div className="space-y-4">
              {[
                {
                  emoji: "🛍️",
                  title: "Personal Shoppers",
                  desc: "Shop on behalf of community members from local stores",
                },
                {
                  emoji: "🚗",
                  title: "Delivery Drivers",
                  desc: "Deliver orders to pick-up points and homes",
                },
                {
                  emoji: "📦",
                  title: "Pickup Operators",
                  desc: "Run a community pick-up point in your area",
                },
              ].map((role) => (
                <div key={role.title} className="flex gap-3">
                  <span className="text-2xl">{role.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{role.title}</p>
                    <p className="text-white/70 text-xs">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/register/staff"
              className="block mt-6"
              data-ocid="auth.staff_apply.button"
            >
              <Button className="w-full bg-white text-foreground hover:bg-white/90 font-semibold">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="font-display font-bold text-foreground mb-1">
            Thuma Thina
          </div>
          <p className="text-xs text-muted-foreground italic mb-1">
            Yonke into, Yonki ndawo, Ngaso Sonke Iskhathi
          </p>
          <p className="text-xs text-muted-foreground/60 mb-3">
            A Mthandeni Umuntu Association initiative
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Floating cart button */}
      <FloatingCartButton />
    </div>
  );
}

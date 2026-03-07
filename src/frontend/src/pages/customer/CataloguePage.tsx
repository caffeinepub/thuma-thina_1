import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Search, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { ProductCategory } from "../../data/mockData";

const CATEGORIES: {
  value: ProductCategory | "All";
  label: string;
  emoji: string;
}[] = [
  { value: "All", label: "All", emoji: "🏪" },
  { value: "Groceries", label: "Groceries", emoji: "🌾" },
  { value: "Household", label: "Household", emoji: "🏠" },
  { value: "Fast Food", label: "Fast Food", emoji: "🍔" },
  { value: "Beverages", label: "Beverages", emoji: "🥤" },
  { value: "Personal Care", label: "Personal Care", emoji: "🧴" },
  { value: "Baby & Kids", label: "Baby & Kids", emoji: "👶" },
];

export function CataloguePage() {
  const {
    products,
    cart,
    addToCartWithListing,
    removeFromCart,
    listings,
    retailers,
    businessAreas,
  } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  // Track selected listing per product
  const [selectedListings, setSelectedListings] = useState<
    Record<string, string>
  >({});

  const available = products.filter((p) => !p.isSuggestion || p.approved);

  const filtered = useMemo(() => {
    return available.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [available, search, category]);

  const getCartQty = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity || 0;

  const getProductListings = (productId: string) =>
    listings.filter((l) => l.productId === productId);

  const getListingLabel = (listing: { retailerId: string; price: number }) => {
    const retailer = retailers.find((r) => r.id === listing.retailerId);
    const area = businessAreas.find((a) => a.id === retailer?.businessAreaId);
    const areaLabel = area ? ` (${area.name})` : "";
    return `${retailer?.name ?? "Unknown"}${areaLabel} — R${listing.price.toFixed(2)}`;
  };

  const handleSelectListing = (productId: string, listingId: string) => {
    setSelectedListings((prev) => ({ ...prev, [productId]: listingId }));
  };

  const handleAdd = (productId: string, productName: string) => {
    const productListingList = getProductListings(productId);
    if (productListingList.length === 0) {
      // No listings: edge case, don't add
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">
          Browse Catalogue
        </h1>
        <p className="text-muted-foreground text-sm">
          {available.filter((p) => p.inStock).length} items available from local
          stores and markets
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="pl-9"
          data-ocid="catalogue.search_input"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => (
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
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {category !== "All" ? ` in ${category}` : ""}
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
      {filtered.length === 0 ? (
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
          {filtered.map((product, i) => {
            const qty = getCartQty(product.id);
            const inCart = qty > 0;
            const productListingList = getProductListings(product.id);
            const hasListings = productListingList.length > 0;
            const chosenListingId = selectedListings[product.id];
            const chosenPrice = getChosenPrice(product.id);
            const minPrice = getMinPrice(product.id);
            const canAdd = hasListings && !!chosenListingId;

            return (
              <Card
                key={product.id}
                className={`card-glow border-border/60 overflow-hidden transition-all ${
                  !product.inStock ? "opacity-60" : "hover:shadow-md"
                }`}
                data-ocid={`catalogue.item.${i + 1}`}
              >
                <div className="bg-muted/40 flex items-center justify-center h-24 sm:h-32 text-4xl sm:text-5xl overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    product.imageEmoji
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {product.description}
                  </p>

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
                          {productListingList.map((listing) => (
                            <SelectItem
                              key={listing.id}
                              value={listing.id}
                              className="text-xs"
                            >
                              {getListingLabel(listing)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
        </div>
      )}
    </div>
  );
}

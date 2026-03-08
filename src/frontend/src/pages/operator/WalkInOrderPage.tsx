import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Clock, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { CartItem } from "../../data/mockData";
import { getNextOpeningText, isRetailerOpen } from "../../data/mockData";

export function OperatorWalkInOrderPage() {
  const {
    products,
    placeOrder,
    staffUsers,
    currentUser,
    pickupPoints,
    businessAreas,
    listings,
    retailers,
  } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [walkInCart, setWalkInCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  // Track selected listing per product
  const [selectedListings, setSelectedListings] = useState<
    Record<string, string>
  >({});

  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const myPickupPoint = pickupPoints.find(
    (pp) => pp.id === staffUser?.pickupPointId,
  );

  const available = products.filter((p) => !p.isSuggestion || p.approved);
  const filtered = useMemo(() => {
    if (!search) return available.filter((p) => p.inStock);
    return available.filter(
      (p) => p.inStock && p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [available, search]);

  const getQty = (productId: string) =>
    walkInCart.find((i) => i.productId === productId)?.quantity || 0;

  const getProductListings = (productId: string) =>
    listings.filter((l) => l.productId === productId);

  const getListingLabel = (listing: {
    retailerId: string;
    price: number;
    outOfStock?: boolean;
  }) => {
    const retailer = retailers.find((r) => r.id === listing.retailerId);
    const area = businessAreas.find((a) => a.id === retailer?.businessAreaId);
    const areaLabel = area ? ` (${area.name})` : "";
    return `${retailer?.name ?? "Unknown"}${areaLabel} — R${listing.price.toFixed(2)}`;
  };

  const isListingUnavailable = (listing: {
    retailerId: string;
    outOfStock?: boolean;
  }) => {
    const retailer = retailers.find((r) => r.id === listing.retailerId);
    if (!retailer) return false;
    return !isRetailerOpen(retailer) || !!listing.outOfStock;
  };

  const handleSelectListing = (productId: string, listingId: string) => {
    setSelectedListings((prev) => ({ ...prev, [productId]: listingId }));
  };

  const addItem = (productId: string) => {
    const chosenListingId = selectedListings[productId];
    const productListingList = getProductListings(productId);
    if (productListingList.length > 0 && !chosenListingId) {
      toast.error("Please select a retailer first");
      return;
    }
    const chosenListing = productListingList.find(
      (l) => l.id === chosenListingId,
    );
    if (chosenListing && isListingUnavailable(chosenListing)) {
      toast.error("This retailer is currently unavailable");
      return;
    }
    setWalkInCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing)
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [
        ...prev,
        {
          productId,
          quantity: 1,
          listingId: chosenListing?.id,
          chosenRetailerId: chosenListing?.retailerId,
          chosenPrice: chosenListing?.price,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setWalkInCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1)
        return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  };

  const cartItems = walkInCart
    .map((ci) => ({
      ...ci,
      product: products.find((p) => p.id === ci.productId),
      retailerName: ci.chosenRetailerId
        ? retailers.find((r) => r.id === ci.chosenRetailerId)?.name
        : undefined,
    }))
    .filter((ci) => ci.product);

  const subtotal = cartItems.reduce(
    (sum, ci) => sum + (ci.chosenPrice ?? 0) * ci.quantity,
    0,
  );
  const total = subtotal + 35;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walkInCart.length === 0) {
      toast.error("Add at least one item to the order");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const businessAreaId = businessAreas[0]?.id || "ba4";

    const orderId = placeOrder({
      customerId: `walkin_${Date.now()}`,
      customerName,
      customerPhone: customerPhone || "000 000 0000",
      items: cartItems.map((ci) => ({
        productId: ci.productId,
        productName: ci.product!.name,
        price: ci.chosenPrice ?? 0,
        quantity: ci.quantity,
      })),
      total,
      status: "pending",
      deliveryType: "pickup_point",
      pickupPointId: myPickupPoint?.id || "pp1",
      pickupPointName: myPickupPoint?.name || "Pick-up Point",
      townId: myPickupPoint?.townId || "t1",
      businessAreaId,
      isWalkIn: true,
    });

    toast.success("Walk-in order placed successfully! 🎉");
    setWalkInCart([]);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");
    setSelectedListings({});
    navigate({ to: `/orders/${orderId}` });
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">Walk-in Order</h1>
        <p className="text-sm text-muted-foreground">
          Place an order on behalf of a walk-in customer at{" "}
          <span className="font-medium text-foreground">
            {myPickupPoint?.name || "your pick-up point"}
          </span>
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* Customer Info */}
        <Card className="card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Customer Name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                data-ocid="operator.customer_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07x xxx xxxx"
                data-ocid="operator.customer_phone.input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card className="card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Add Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9"
                data-ocid="operator.search_input"
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filtered.map((product) => {
                const qty = getQty(product.id);
                const productListingList = getProductListings(product.id);
                const hasListings = productListingList.length > 0;
                const chosenListingId = selectedListings[product.id];
                const chosenListing = productListingList.find(
                  (l) => l.id === chosenListingId,
                );
                const displayPrice = chosenListing
                  ? chosenListing.price
                  : hasListings
                    ? Math.min(...productListingList.map((l) => l.price))
                    : null;
                const chosenIsUnavailable = chosenListing
                  ? isListingUnavailable(chosenListing)
                  : false;

                return (
                  <div
                    key={product.id}
                    className="p-2 rounded-lg hover:bg-muted/40 space-y-1.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.name}
                        </p>
                        {displayPrice !== null ? (
                          <p className="text-xs text-primary font-display font-bold">
                            {chosenListing
                              ? `R${displayPrice.toFixed(2)}`
                              : `from R${displayPrice.toFixed(2)}`}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No listings
                          </p>
                        )}
                        {chosenIsUnavailable &&
                          (() => {
                            const retailer = retailers.find(
                              (r) => r.id === chosenListing?.retailerId,
                            );
                            const isClosed = retailer
                              ? !isRetailerOpen(retailer)
                              : false;
                            return isClosed ? (
                              <p className="text-[10px] text-red-600 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {retailer
                                  ? getNextOpeningText(retailer)
                                  : "Closed"}
                              </p>
                            ) : (
                              <p className="text-[10px] text-amber-600">
                                ⚠ Out of stock
                              </p>
                            );
                          })()}
                      </div>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-4 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addItem(product.id)}
                            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addItem(product.id)}
                          disabled={
                            (hasListings && !chosenListingId) ||
                            chosenIsUnavailable
                          }
                          className="h-7 w-7 p-0 rounded-full"
                          data-ocid="operator.add.button"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {hasListings && (
                      <Select
                        value={chosenListingId || ""}
                        onValueChange={(v) =>
                          handleSelectListing(product.id, v)
                        }
                      >
                        <SelectTrigger className="h-7 text-[11px]">
                          <SelectValue placeholder="Select retailer & price" />
                        </SelectTrigger>
                        <SelectContent>
                          {productListingList.map((listing) => {
                            const retailer = retailers.find(
                              (r) => r.id === listing.retailerId,
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
                                <span>
                                  {getListingLabel(listing)}
                                  {isClosed && (
                                    <span className="text-red-600 font-medium">
                                      {" "}
                                      · Closed
                                      {retailer
                                        ? ` (${getNextOpeningText(retailer)})`
                                        : ""}
                                    </span>
                                  )}
                                  {!isClosed && isOOS && (
                                    <span className="text-amber-600 font-medium">
                                      {" "}
                                      · Out of Stock
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cart summary */}
        {walkInCart.length > 0 && (
          <Card className="card-glow" data-ocid="operator.cart.list">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center justify-between">
                Order Summary
                <Badge>
                  {walkInCart.reduce((s, i) => s + i.quantity, 0)} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-3">
                {cartItems.map((ci, i) => (
                  <div
                    key={ci.productId}
                    className="flex items-center gap-2"
                    data-ocid={`operator.item.${i + 1}`}
                  >
                    <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center text-base shrink-0 overflow-hidden">
                      {ci.product?.images?.[0] ? (
                        <img
                          src={ci.product.images[0]}
                          alt={ci.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        ci.product?.imageEmoji
                      )}
                    </div>
                    <div className="flex-1 text-sm min-w-0">
                      <span className="truncate block">{ci.product?.name}</span>
                      {ci.retailerName && (
                        <span className="text-xs text-muted-foreground">
                          {ci.retailerName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ×{ci.quantity}
                    </span>
                    <span className="font-display font-bold text-sm text-primary w-16 text-right">
                      R{((ci.chosenPrice ?? 0) * ci.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setWalkInCart((prev) =>
                          prev.filter(
                            (item) => item.productId !== ci.productId,
                          ),
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                      data-ocid={`operator.delete.delete_button.${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-display font-bold mt-2">
                <span>Total (incl. R35 fee)</span>
                <span className="text-primary">R{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-semibold gap-2"
          disabled={loading || walkInCart.length === 0}
          data-ocid="operator.place_order.submit_button"
        >
          {loading ? (
            "Placing order…"
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Place Walk-in Order
              {walkInCart.length > 0 ? ` — R${total.toFixed(2)}` : ""}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

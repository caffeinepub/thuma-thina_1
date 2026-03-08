import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Coins, Home, MapPin, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { DeliveryType } from "../../data/mockData";
import { calculateDeliveryFee } from "../../utils/deliveryFee";

export function CheckoutPage() {
  const {
    cart,
    products,
    retailers,
    towns,
    pickupPoints,
    businessAreas,
    currentUser,
    placeOrder,
    clearCart,
    retailerProducts,
    orders,
  } = useApp();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("pickup_point");
  const [selectedTownId, setSelectedTownId] = useState("t1");
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const cartItems = cart
    .map((ci) => {
      // Retailer exclusive product
      if (ci.retailerProductId) {
        const rp = retailerProducts.find((p) => p.id === ci.retailerProductId);
        if (!rp) return null;
        const retailer = retailers.find((r) => r.id === rp.retailerId);
        return {
          ...ci,
          product: {
            id: rp.id,
            name: rp.name,
            imageEmoji: rp.imageEmoji,
            images: rp.images,
          },
          retailerName: retailer?.name,
          isRetailerProduct: true,
        };
      }
      // Universal product
      return {
        ...ci,
        product: products.find((p) => p.id === ci.productId),
        retailerName: ci.chosenRetailerId
          ? retailers.find((r) => r.id === ci.chosenRetailerId)?.name
          : undefined,
        isRetailerProduct: false,
      };
    })
    .filter(
      (ci): ci is NonNullable<typeof ci> =>
        ci !== null && ci.product !== undefined,
    );

  const subtotal = cartItems.reduce(
    (sum, ci) => sum + (ci.chosenPrice ?? 0) * ci.quantity,
    0,
  );

  // Recalculates immediately when deliveryType changes
  const feeBreakdown = calculateDeliveryFee(
    cart,
    retailers,
    businessAreas,
    deliveryType,
    retailerProducts,
  );
  const deliveryFee = feeBreakdown.total;
  const total = subtotal + deliveryFee;

  const townPickupPoints = pickupPoints.filter(
    (pp) => pp.townId === selectedTownId,
  );
  const selectedPickup = pickupPoints.find((pp) => pp.id === selectedPickupId);

  const businessAreaId =
    feeBreakdown.deliveryAreaIds[0] || businessAreas[0]?.id || "";

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickupId) {
      toast.error("Please select a pick-up point");
      return;
    }
    if (deliveryType === "home_delivery" && !homeAddress.trim()) {
      toast.error("Please enter your home address");
      return;
    }

    setLoading(true);

    const orderId = await placeOrder({
      customerId: currentUser?.id || "cust1",
      customerName: currentUser?.name || "Customer",
      customerPhone: currentUser?.phone || "",
      items: cartItems.map((ci) => ({
        productId: ci.productId,
        productName: ci.product?.name ?? "",
        price: ci.chosenPrice ?? 0,
        quantity: ci.quantity,
      })),
      total,
      status: "pending",
      deliveryType,
      pickupPointId: selectedPickupId,
      pickupPointName: selectedPickup?.name || "",
      homeAddress: deliveryType === "home_delivery" ? homeAddress : undefined,
      townId: selectedTownId,
      businessAreaId,
      deliveryAreas: feeBreakdown.deliveryAreaIds,
    });

    clearCart();
    const earnedTokens = Math.round(total * 0.1 * 100) / 100;

    // Count sub-orders created for this checkout
    const subOrders = orders.filter((o) => o.parentOrderId === orderId);
    const subOrderCount = subOrders.length;

    if (subOrderCount > 1) {
      toast.success(
        `Order placed and split into ${subOrderCount} sub-orders! 🎉 You earned ${earnedTokens.toFixed(2)} Nomayini tokens`,
      );
    } else {
      toast.success(
        `Order placed! 🎉 You earned ${earnedTokens.toFixed(2)} Nomayini tokens`,
      );
    }

    navigate({ to: `/orders/${orderId}` });
    setLoading(false);
  };

  if (cartItems.length === 0) {
    navigate({ to: "/catalogue" });
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* Order Items */}
        <Card className="card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cartItems.map((ci) => (
              <div key={ci.productId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {ci.product?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ×{ci.quantity}
                    {ci.retailerName && ` · ${ci.retailerName}`}
                  </p>
                </div>
                <span className="font-display font-bold text-sm text-primary">
                  R{((ci.chosenPrice ?? 0) * ci.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Type */}
        <Card className="card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Delivery Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={deliveryType}
              onValueChange={(v) => setDeliveryType(v as DeliveryType)}
              className="space-y-3"
              data-ocid="checkout.delivery.radio"
            >
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/30">
                <RadioGroupItem
                  value="pickup_point"
                  id="pickup"
                  className="mt-0.5"
                />
                <Label htmlFor="pickup" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Pick-up Point</span>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Collect at your nearest community pick-up point
                  </p>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/30">
                <RadioGroupItem
                  value="home_delivery"
                  id="home"
                  className="mt-0.5"
                />
                <Label htmlFor="home" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Home Delivery</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                      +R5.00 surcharge
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Delivered to your door (linked to nearest pick-up point as
                    fallback)
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Delivery Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Town</Label>
              <Select
                value={selectedTownId}
                onValueChange={(v) => {
                  setSelectedTownId(v);
                  setSelectedPickupId("");
                }}
              >
                <SelectTrigger data-ocid="checkout.town.select">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  {towns.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                {deliveryType === "pickup_point"
                  ? "Pick-up Point"
                  : "Nearest Pick-up Point (for fallback)"}
              </Label>
              <Select
                value={selectedPickupId}
                onValueChange={setSelectedPickupId}
              >
                <SelectTrigger data-ocid="checkout.pickup.select">
                  <SelectValue placeholder="Select pick-up point" />
                </SelectTrigger>
                <SelectContent>
                  {townPickupPoints.map((pp) => (
                    <SelectItem key={pp.id} value={pp.id}>
                      {pp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPickup && (
                <p className="text-xs text-muted-foreground">
                  {selectedPickup.address}
                </p>
              )}
            </div>

            {deliveryType === "home_delivery" && (
              <div className="space-y-1.5">
                <Label htmlFor="homeAddress">Home Address</Label>
                <Input
                  id="homeAddress"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="Enter your full home address"
                  data-ocid="checkout.address.input"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Fee Breakdown Card */}
        <Card
          className="border-amber-200/70 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10"
          data-ocid="checkout.delivery_fee.section"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Delivery Fee Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feeBreakdown.areaBreakdown.map((area, idx) => (
              <div
                key={area.areaName}
                className="flex justify-between items-start gap-2"
              >
                <span className="text-sm text-muted-foreground leading-snug">
                  <span className="font-medium text-foreground/80">
                    {idx === 0 ? "1st area" : "+Area"}
                  </span>{" "}
                  — {area.areaName}
                  {area.retailerNames.length > 0 && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      (
                      {area.retailerNames.length > 2
                        ? `${area.retailerNames.slice(0, 2).join(", ")} +${area.retailerNames.length - 2} more`
                        : area.retailerNames.join(", ")}
                      )
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400 shrink-0">
                  {idx === 0 ? "R40.00" : "+R15.00"}
                </span>
              </div>
            ))}

            {deliveryType === "home_delivery" && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  Home delivery surcharge
                </span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +R5.00
                </span>
              </div>
            )}

            <Separator className="border-amber-200/60 dark:border-amber-800/40" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Total delivery fee</span>
              <span className="font-bold text-base text-amber-700 dark:text-amber-400">
                R{deliveryFee.toFixed(2)}
              </span>
            </div>

            <div className="pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Order subtotal</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="font-bold font-display text-base">
                  Total to pay
                </span>
                <span className="font-bold font-display text-lg text-primary">
                  R{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Nomayini Token Reward Estimate */}
            <div
              className="mt-1 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 px-3 py-2.5 flex items-center gap-3"
              data-ocid="checkout.token_reward.section"
            >
              <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  You'll earn{" "}
                  <span className="font-bold">
                    {(Math.round(total * 0.1 * 100) / 100).toFixed(2)} Nomayini
                    tokens
                  </span>
                </p>
                <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70 mt-0.5">
                  10% reward · 50% unlocked after 3 months, 50% after 4 years
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                  ~{(Math.round(total * 0.05 * 100) / 100).toFixed(2)} now
                </p>
                <p className="text-xs text-yellow-600/60 dark:text-yellow-500/60">
                  +{(Math.round(total * 0.05 * 100) / 100).toFixed(2)} later
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold gap-2"
          disabled={loading}
          data-ocid="checkout.place_order.submit_button"
        >
          {loading ? (
            "Placing order…"
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Place Order — R{total.toFixed(2)}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

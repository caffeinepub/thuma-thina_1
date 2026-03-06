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
import { CheckCircle, Home, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { DeliveryType } from "../../data/mockData";

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
  } = useApp();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("pickup_point");
  const [selectedTownId, setSelectedTownId] = useState("t1");
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const cartItems = cart
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
  const deliveryFee = 35;
  const total = subtotal + deliveryFee;

  const townPickupPoints = pickupPoints.filter(
    (pp) => pp.townId === selectedTownId,
  );
  const selectedPickup = pickupPoints.find((pp) => pp.id === selectedPickupId);

  const businessAreaId = businessAreas[0]?.id || "";

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
    await new Promise((r) => setTimeout(r, 800));

    const orderId = placeOrder({
      customerId: currentUser?.id || "cust1",
      customerName: currentUser?.name || "Customer",
      customerPhone: currentUser?.phone || "",
      items: cartItems.map((ci) => ({
        productId: ci.productId,
        productName: ci.product!.name,
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
    });

    clearCart();
    const earnedTokens = Math.round(total * 0.1 * 100) / 100;
    toast.success(
      `Order placed! 🎉 You earned ${earnedTokens.toFixed(2)} Nomayini tokens`,
    );
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
        {/* Order Summary */}
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
            <div className="flex justify-between font-bold font-display">
              <span>Total (incl. delivery)</span>
              <span className="text-primary">R{total.toFixed(2)}</span>
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

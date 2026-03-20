import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Info,
  ShoppingBag,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { ImageUpload } from "../../components/ImageUpload";
import { useApp } from "../../context/AppContext";
import { calculateDeliveryFee } from "../../utils/deliveryFee";

export function CartPage() {
  const {
    cart,
    products,
    retailers,
    businessAreas,
    updateCartQty,
    removeFromCart,
    clearCart,
    retailerProducts,
    updateMeterInput,
    removeMeterEntry,
    addSpecialToCart,
  } = useApp();

  // Detect special cart
  const isSpecialCart = cart.some((i) => i.meterInputs !== undefined);

  const cartItems = cart
    .map((ci) => {
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

  if (cartItems.length === 0) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center"
        data-ocid="cart.empty_state"
      >
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display font-bold text-2xl mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground mb-6">
          Browse our catalogue to add items to your cart
        </p>
        <Link to="/catalogue" data-ocid="cart.browse.primary_button">
          <Button className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Browse Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // SPECIAL CART
  // ──────────────────────────────────────────────
  if (isSpecialCart) {
    const canCheckout = cart.every((ci) => {
      if (!ci.meterInputs) return true;
      return ci.meterInputs.every(
        (m) => !!(m.meterNumber?.trim() || m.slipImage),
      );
    });

    const totalServiceFee = cart.reduce((sum, ci) => {
      if (!ci.meterInputs) return sum;
      return sum + (ci.chosenPrice ?? 0) * ci.meterInputs.length;
    }, 0);

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h1 className="font-display text-2xl font-bold">
                Special Service Order
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Provide your meter number and/or a recent electricity slip for
              each purchase.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-destructive hover:text-destructive gap-1.5 text-xs"
            data-ocid="cart.clear.delete_button"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          {cartItems.map((ci, itemIdx) => {
            const meterEntries = ci.meterInputs ?? [];
            const fullProduct = products.find((p) => p.id === ci.productId);
            const feePerMeter = ci.chosenPrice ?? fullProduct?.serviceFee ?? 20;

            return (
              <Card
                key={ci.productId}
                className="card-glow border-yellow-400/40"
                data-ocid={`cart.item.${itemIdx + 1}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {ci.product?.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(ci.productId)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      data-ocid={`cart.delete.delete_button.${itemIdx + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R{feePerMeter.toFixed(2)} service fee per meter —{" "}
                    {meterEntries.length} meter
                    {meterEntries.length !== 1 ? "s" : ""} selected
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meterEntries.map((entry, entryIdx) => {
                    const hasInput = !!(
                      entry.meterNumber?.trim() || entry.slipImage
                    );
                    return (
                      <div
                        key={entry.entryId}
                        className={`rounded-lg border p-3 space-y-3 ${
                          hasInput
                            ? "border-green-300/60 bg-green-50/30 dark:bg-green-950/10"
                            : "border-border/60"
                        }`}
                        data-ocid={`cart.meter.item.${itemIdx + 1}.${entryIdx + 1}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Meter #{entryIdx + 1}
                          </p>
                          {meterEntries.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                removeMeterEntry(ci.productId, entry.entryId)
                              }
                              data-ocid={`cart.meter.delete_button.${itemIdx + 1}.${entryIdx + 1}`}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Meter Number{" "}
                            <span className="text-muted-foreground">
                              (recommended)
                            </span>
                          </Label>
                          <Input
                            value={entry.meterNumber ?? ""}
                            onChange={(e) =>
                              updateMeterInput(
                                ci.productId,
                                entry.entryId,
                                "meterNumber",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 12345678"
                            className="h-8 text-sm"
                            data-ocid={`cart.meter_number.input.${itemIdx + 1}.${entryIdx + 1}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Recent Electricity Slip{" "}
                            <span className="text-muted-foreground">
                              (recommended)
                            </span>
                          </Label>
                          <ImageUpload
                            value={entry.slipImage ? [entry.slipImage] : []}
                            onChange={(imgs) =>
                              updateMeterInput(
                                ci.productId,
                                entry.entryId,
                                "slipImage",
                                imgs[0] ?? "",
                              )
                            }
                            maxImages={1}
                            label="Upload slip photo"
                          />
                        </div>
                        {!hasInput && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Info className="h-3 w-3 shrink-0" />
                            At least one of meter number or slip image is
                            required
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs border-yellow-400/60 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                    onClick={() =>
                      addSpecialToCart(
                        ci.productId,
                        "",
                        "",
                        feePerMeter,
                        `${Date.now()}`,
                      )
                    }
                    data-ocid={`cart.add_meter.secondary_button.${itemIdx + 1}`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Add Another Meter
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Service Summary */}
        <Card className="card-glow mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service fee total</span>
              <span className="font-bold text-yellow-700 dark:text-yellow-400">
                R{totalServiceFee.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold font-display">
              <span>Total</span>
              <span className="text-primary text-lg">
                R{totalServiceFee.toFixed(2)}
              </span>
            </div>
            <div className="flex items-start gap-1.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 p-2.5 mt-2">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                No delivery fee — this is a service-only order. Your electricity
                token will be sent to you.
              </p>
            </div>
          </CardContent>
        </Card>

        {!canCheckout && (
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-3 flex items-center justify-center gap-1.5">
            <Info className="h-4 w-4" />
            Please fill in at least one field for each meter entry before
            proceeding.
          </p>
        )}

        <Link to="/checkout" data-ocid="cart.checkout.primary_button">
          <Button
            className="w-full gap-2 h-12 text-base font-semibold bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
            disabled={!canCheckout}
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link
          to="/catalogue"
          className="block mt-3"
          data-ocid="cart.continue.link"
        >
          <Button variant="ghost" className="w-full text-muted-foreground">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // REGULAR CART
  // ──────────────────────────────────────────────
  const subtotal = cartItems.reduce(
    (sum, ci) => sum + (ci.chosenPrice ?? 0) * ci.quantity,
    0,
  );

  const feeBreakdown = calculateDeliveryFee(
    cart,
    retailers,
    businessAreas,
    "pickup_point",
    retailerProducts,
  );
  const deliveryFee = feeBreakdown.total;
  const total = subtotal + deliveryFee;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Your Cart</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-destructive hover:text-destructive gap-1.5 text-xs"
          data-ocid="cart.clear.delete_button"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </div>

      <Card className="card-glow mb-4" data-ocid="cart.list">
        <CardContent className="p-0">
          {cartItems.map((ci, i) => (
            <div key={ci.productId}>
              <div
                className="flex items-center gap-3 p-4"
                data-ocid={`cart.item.${i + 1}`}
              >
                <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {ci.product?.images?.[0] ? (
                    <img
                      src={ci.product.images[0]}
                      alt={ci.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    ci.product?.imageEmoji
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">
                    {ci.product?.name}
                  </p>
                  {ci.retailerName && (
                    <p className="text-xs text-muted-foreground">
                      {ci.retailerName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    R{(ci.chosenPrice ?? 0).toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(ci.productId, ci.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                    data-ocid={`cart.decrease.button.${i + 1}`}
                  >
                    −
                  </button>
                  <span className="text-sm font-bold w-5 text-center">
                    {ci.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(ci.productId, ci.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm"
                    data-ocid={`cart.increase.button.${i + 1}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(ci.productId)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    data-ocid={`cart.delete.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-16 text-right">
                  <span className="font-display font-bold text-sm text-primary">
                    R{((ci.chosenPrice ?? 0) * ci.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
              {i < cartItems.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="card-glow mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({cartItems.length} item
              {cartItems.length !== 1 ? "s" : ""})
            </span>
            <span>R{subtotal.toFixed(2)}</span>
          </div>

          <div
            className="rounded-lg border border-amber-200/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 px-3 py-2.5 space-y-1.5"
            data-ocid="cart.delivery.section"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Delivery Fee
              </span>
            </div>
            {feeBreakdown.areaBreakdown.map((area, idx) => (
              <div
                key={area.areaName}
                className="flex justify-between items-start gap-2"
              >
                <span className="text-xs text-muted-foreground leading-snug">
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
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">
                  {idx === 0 ? "R40.00" : "+R15.00"}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
              <span className="text-xs font-semibold text-foreground">
                Delivery total
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                R{deliveryFee.toFixed(2)}
              </span>
            </div>
            <div className="flex items-start gap-1 pt-0.5">
              <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-snug">
                Pick-up rate shown. Home delivery adds R5.00 — select at
                checkout.
              </p>
            </div>
          </div>

          <Separator />
          <div className="flex justify-between font-bold font-display">
            <span>Total</span>
            <span className="text-primary text-lg">R{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Link to="/checkout" data-ocid="cart.checkout.primary_button">
        <Button className="w-full gap-2 h-12 text-base font-semibold">
          Proceed to Checkout
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Link
        to="/catalogue"
        className="block mt-3"
        data-ocid="cart.continue.link"
      >
        <Button variant="ghost" className="w-full text-muted-foreground">
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
}

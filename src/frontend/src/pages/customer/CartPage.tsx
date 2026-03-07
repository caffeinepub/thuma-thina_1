import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Info, ShoppingBag, Trash2, Truck } from "lucide-react";
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
  } = useApp();

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

  // Cart page shows pick-up rate (type will be selected at checkout)
  const feeBreakdown = calculateDeliveryFee(
    cart,
    retailers,
    businessAreas,
    "pickup_point",
  );
  const deliveryFee = feeBreakdown.total;
  const total = subtotal + deliveryFee;

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

          {/* Delivery Fee Breakdown */}
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

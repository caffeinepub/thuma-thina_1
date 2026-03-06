import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Home,
  MapPin,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  type OrderStatus,
} from "../data/mockData";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailPage() {
  const params = useParams({ from: "/orders/$orderId" });
  const navigate = useNavigate();
  const { orders, products, demoRole } = useApp();

  const order = orders.find((o) => o.id === params.orderId);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-display font-bold text-xl mb-2">Order not found</p>
        <Button
          onClick={() => navigate({ to: "/my-orders" })}
          data-ocid="order.back.button"
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(
    order.status as OrderStatus,
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate({ to: -1 as never })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5"
        data-ocid="order.back.button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl">Order #{order.id}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Nomayini reward banner — shown for customer on newly placed orders */}
      {demoRole === "customer" && order.status === "pending" && (
        <div
          className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 mb-4"
          data-ocid="order.reward.success_state"
        >
          <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-display font-semibold text-sm text-amber-800 dark:text-amber-300">
              🪙 You earned{" "}
              <span className="text-amber-600 dark:text-amber-400">
                {(Math.round(order.total * 0.1 * 100) / 100).toFixed(2)}{" "}
                Nomayini tokens
              </span>{" "}
              (10% reward)
            </p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">
              50% unlocks in 3 months · 50% unlocks in 4 years. Check your
              wallet to see your balance.
            </p>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <Card className="card-glow mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Order Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ORDER_STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold",
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  {i < ORDER_STATUS_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "absolute ml-2 mt-5 w-px h-3 -z-10",
                        isDone ? "bg-primary/40" : "bg-border/40",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      isCurrent
                        ? "font-semibold text-foreground"
                        : isDone
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60",
                    )}
                  >
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="card-glow mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Items Ordered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item, i) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={item.productId}
                  className="flex items-center gap-3"
                  data-ocid={`order.item.${i + 1}`}
                >
                  <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {product?.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      product?.imageEmoji || "📦"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      ×{item.quantity}
                    </p>
                  </div>
                  <span className="font-display font-bold text-sm text-primary">
                    R{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            <Separator />
            <div className="flex justify-between font-display font-bold">
              <span>Total</span>
              <span className="text-primary">R{order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info */}
      <Card className="card-glow mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Delivery Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="font-medium">Pick-up Point</p>
              <p className="text-muted-foreground text-xs">
                {order.pickupPointName}
              </p>
            </div>
          </div>
          {order.deliveryType === "home_delivery" && order.homeAddress && (
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-medium">Home Delivery Address</p>
                <p className="text-muted-foreground text-xs">
                  {order.homeAddress}
                </p>
              </div>
            </div>
          )}
          {order.shopperName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-orange-600 shrink-0" />
              <div>
                <p className="font-medium">Personal Shopper</p>
                <p className="text-muted-foreground text-xs">
                  {order.shopperName}
                </p>
              </div>
            </div>
          )}
          {order.driverName && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <p className="font-medium">Delivery Driver</p>
                <p className="text-muted-foreground text-xs">
                  {order.driverName}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">Last Updated</p>
              <p className="text-muted-foreground text-xs">
                {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

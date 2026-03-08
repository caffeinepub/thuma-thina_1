import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShopperAvailableOrdersPage() {
  const {
    orders,
    updateOrderStatus,
    currentUser,
    staffUsers,
    businessAreas,
    retailers,
  } = useApp();

  // Get this shopper's staff record
  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const shopperAreaId = staffUser?.businessAreaId;
  const shopperArea = businessAreas.find((ba) => ba.id === shopperAreaId);

  // Determine if this shopper is a dedicated shopper
  const shopperRetailerIds = staffUser?.assignedRetailerIds ?? [];
  const isDedicatedShopper = shopperRetailerIds.length > 0;

  // Filter available orders using the closed-lane rule:
  // - Dedicated shoppers only see sub-orders for their assigned retailers
  // - General shoppers see all general (non-dedicated) orders in their area
  const available = orders.filter((o) => {
    if (o.status !== "pending") return false;
    if (isDedicatedShopper) {
      // Only see sub-orders for their assigned retailers
      return (
        o.dedicatedRetailerId != null &&
        shopperRetailerIds.includes(o.dedicatedRetailerId)
      );
    }
    // General shopper: only see general sub-orders in their area, never dedicated ones
    return (
      o.dedicatedRetailerId == null &&
      (!shopperAreaId || o.businessAreaId === shopperAreaId)
    );
  });

  const handleAccept = (orderId: string) => {
    updateOrderStatus(orderId, "accepted_by_shopper", {
      shopperId: currentUser?.id,
      shopperName: currentUser?.name,
    });
    toast.success("Order accepted! Head to the store now.");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">
          Available Orders
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {isDedicatedShopper ? (
            <p className="text-sm text-muted-foreground">
              Showing orders for your assigned{" "}
              {shopperRetailerIds.map((rid) => {
                const r = retailers.find((r) => r.id === rid);
                return r ? (
                  <span
                    key={rid}
                    className="font-medium text-amber-700 dark:text-amber-400"
                  >
                    {r.name}
                  </span>
                ) : null;
              })}{" "}
              retailer(s) only
            </p>
          ) : shopperArea ? (
            <p className="text-sm text-muted-foreground">
              Showing orders in{" "}
              <span className="font-medium text-foreground">
                {shopperArea.name}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Orders waiting for a personal shopper
            </p>
          )}
          {isDedicatedShopper && (
            <Badge
              variant="outline"
              className="border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 text-xs gap-1"
              data-ocid="shopper.dedicated.toggle"
            >
              <Star className="h-3 w-3 fill-current" />
              Dedicated Shopper
            </Badge>
          )}
        </div>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-16" data-ocid="shopper.empty_state">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="font-display font-semibold text-lg mb-1">
            No orders available
          </p>
          <p className="text-muted-foreground text-sm">
            {isDedicatedShopper
              ? "No orders from your assigned retailers right now"
              : "Check back soon — new orders will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {available.map((order, i) => {
            const dedicatedRetailer = order.dedicatedRetailerId
              ? retailers.find((r) => r.id === order.dedicatedRetailerId)
              : null;
            return (
              <Card
                key={order.id}
                className="card-glow border-border/60"
                data-ocid={`shopper.item.${i + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm font-display">
                          #{order.id}
                        </span>
                        {dedicatedRetailer && (
                          <Badge
                            variant="outline"
                            className="border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 text-xs gap-1"
                            data-ocid={`shopper.dedicated_retailer.toggle.${i + 1}`}
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {dedicatedRetailer.name}
                          </Badge>
                        )}
                        {order.parentOrderId &&
                          order.parentOrderId !== order.id && (
                            <span className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                              Sub-order
                            </span>
                          )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {order.customerName} · {order.customerPhone}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="bg-muted/40 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Items to purchase ({order.items.length}):
                    </p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex justify-between text-xs"
                        >
                          <span>
                            × {item.quantity} {item.productName}
                          </span>
                          <span className="font-medium text-primary">
                            R{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.pickupPointName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-primary">
                      R{order.total.toFixed(2)}
                    </span>
                    <Button
                      onClick={() => handleAccept(order.id)}
                      className="gap-2"
                      data-ocid={`shopper.accept.primary_button.${i + 1}`}
                    >
                      Accept Order
                    </Button>
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

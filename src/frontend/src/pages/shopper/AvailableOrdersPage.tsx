import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, ShoppingBag } from "lucide-react";
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
  const { orders, updateOrderStatus, currentUser, staffUsers, businessAreas } =
    useApp();

  // Get this shopper's business area
  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const shopperAreaId = staffUser?.businessAreaId;
  const shopperArea = businessAreas.find((ba) => ba.id === shopperAreaId);

  // Available = pending orders in the shopper's business area
  const available = orders.filter(
    (o) =>
      o.status === "pending" &&
      (!shopperAreaId || o.businessAreaId === shopperAreaId),
  );

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
        <p className="text-sm text-muted-foreground">
          {shopperArea ? (
            <>
              Showing orders in{" "}
              <span className="font-medium text-foreground">
                {shopperArea.name}
              </span>
            </>
          ) : (
            "Orders waiting for a personal shopper"
          )}
        </p>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-16" data-ocid="shopper.empty_state">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="font-display font-semibold text-lg mb-1">
            No orders available
          </p>
          <p className="text-muted-foreground text-sm">
            Check back soon — new orders will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {available.map((order, i) => (
            <Card
              key={order.id}
              className="card-glow border-border/60"
              data-ocid={`shopper.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm font-display">
                        #{order.id}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
          ))}
        </div>
      )}
    </div>
  );
}

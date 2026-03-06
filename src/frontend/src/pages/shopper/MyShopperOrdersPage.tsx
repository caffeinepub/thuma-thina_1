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

export function ShopperMyOrdersPage() {
  const { orders, updateOrderStatus, currentUser } = useApp();

  const myOrders = orders.filter(
    (o) =>
      o.shopperId === currentUser?.id &&
      [
        "accepted_by_shopper",
        "shopping_in_progress",
        "ready_for_collection",
      ].includes(o.status),
  );

  const handleStartShopping = (orderId: string) => {
    updateOrderStatus(orderId, "shopping_in_progress");
    toast.success("Started shopping — go get those items! 🛒");
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, "ready_for_collection");
    toast.success(
      "Marked as ready for collection! A driver will pick it up soon.",
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">My Orders</h1>
        <p className="text-sm text-muted-foreground">
          Orders you've accepted and are working on
        </p>
      </div>

      {myOrders.length === 0 ? (
        <div className="text-center py-16" data-ocid="shopper.empty_state">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-display font-semibold text-lg mb-1">
            No active orders
          </p>
          <p className="text-muted-foreground text-sm">
            Head to Available Orders to accept new orders
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myOrders.map((order, i) => (
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
                      {order.customerName}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="bg-muted/40 rounded-lg p-3 mb-3">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-xs py-0.5"
                    >
                      <span>
                        × {item.quantity} {item.productName}
                      </span>
                      <span className="font-medium">
                        R{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
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
                  <div className="flex gap-2">
                    {order.status === "accepted_by_shopper" && (
                      <Button
                        onClick={() => handleStartShopping(order.id)}
                        variant="outline"
                        size="sm"
                        data-ocid={`shopper.start.secondary_button.${i + 1}`}
                      >
                        Start Shopping
                      </Button>
                    )}
                    {order.status === "shopping_in_progress" && (
                      <Button
                        onClick={() => handleMarkReady(order.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        data-ocid={`shopper.ready.primary_button.${i + 1}`}
                      >
                        Mark Ready ✓
                      </Button>
                    )}
                    {order.status === "ready_for_collection" && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Waiting for driver
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

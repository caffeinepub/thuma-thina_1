import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";

export function DriverMyDeliveriesPage() {
  const { orders, updateOrderStatus, currentUser } = useApp();

  const myDeliveries = orders.filter(
    (o) =>
      o.driverId === currentUser?.id &&
      ["accepted_by_driver", "out_for_delivery"].includes(o.status),
  );

  const handleOutForDelivery = (orderId: string) => {
    updateOrderStatus(orderId, "out_for_delivery");
    toast.success("Marked out for delivery — drive safe! 🚗");
  };

  const handleMarkDelivered = (orderId: string) => {
    updateOrderStatus(orderId, "delivered");
    toast.success("Order delivered! Great work 🎉");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">My Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Deliveries you've accepted
        </p>
      </div>

      {myDeliveries.length === 0 ? (
        <div className="text-center py-16" data-ocid="driver.empty_state">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-display font-semibold text-lg mb-1">
            No active deliveries
          </p>
          <p className="text-muted-foreground text-sm">
            Accept a delivery from the Available Deliveries tab
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myDeliveries.map((order, i) => (
            <Card
              key={order.id}
              className="card-glow border-border/60"
              data-ocid={`driver.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
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

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Collect from:{" "}
                      </span>
                      <span className="font-medium text-sm">
                        {order.pickupPointName}
                      </span>
                    </div>
                  </div>
                  {order.deliveryType === "home_delivery" &&
                  order.homeAddress ? (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Deliver to:{" "}
                        </span>
                        <span className="font-medium text-sm">
                          {order.homeAddress}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Drop at:{" "}
                        </span>
                        <span className="font-medium text-sm">
                          {order.pickupPointName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted/40 rounded-lg p-2 mb-3">
                  {order.items.map((item) => (
                    <p
                      key={item.productId}
                      className="text-xs text-muted-foreground"
                    >
                      × {item.quantity} {item.productName}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-primary">
                    R{order.total.toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    {order.status === "accepted_by_driver" && (
                      <Button
                        onClick={() => handleOutForDelivery(order.id)}
                        variant="outline"
                        size="sm"
                        data-ocid={`driver.out.secondary_button.${i + 1}`}
                      >
                        Out for Delivery
                      </Button>
                    )}
                    {order.status === "out_for_delivery" && (
                      <Button
                        onClick={() => handleMarkDelivered(order.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        data-ocid={`driver.delivered.primary_button.${i + 1}`}
                      >
                        Mark Delivered ✓
                      </Button>
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

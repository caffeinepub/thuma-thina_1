import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Truck, UserCircle } from "lucide-react";
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

export function DriverAvailableDeliveriesPage() {
  const { orders, updateOrderStatus, currentUser, staffUsers } = useApp();
  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  const available = orders.filter((o) => o.status === "ready_for_collection");

  const handleAccept = (orderId: string) => {
    updateOrderStatus(orderId, "accepted_by_driver", {
      driverId: currentUser?.id,
      driverName: currentUser?.name,
    });
    toast.success(
      "Delivery accepted! Head to the pick-up point to collect the order.",
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Driver identity header */}
      <div className="flex items-center gap-3 mb-5 bg-muted/30 rounded-xl p-3">
        <Avatar className="w-10 h-10 ring-2 ring-primary/20 shrink-0">
          <AvatarImage
            src={staffUser?.profileImageUrl}
            alt={currentUser?.name}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{currentUser?.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="h-3 w-3" />
            <span>Delivery Driver</span>
          </div>
        </div>
        {!staffUser?.profileImageUrl && (
          <Link to="/driver/profile" data-ocid="driver.profile.link">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
            >
              <UserCircle className="h-3.5 w-3.5" />
              Add Photo
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">
          Available Deliveries
        </h1>
        <p className="text-sm text-muted-foreground">
          Orders ready for collection — accept one to start delivering
        </p>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-16" data-ocid="driver.empty_state">
          <div className="text-5xl mb-3">🚗</div>
          <p className="font-display font-semibold text-lg mb-1">
            No deliveries available
          </p>
          <p className="text-muted-foreground text-sm">
            Orders will appear here once shoppers mark them ready
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {available.map((order, i) => (
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
                      {order.customerName}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="bg-muted/40 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""} — prepared by{" "}
                    {order.shopperName}
                  </p>
                  <div className="space-y-0.5">
                    {order.items.map((item) => (
                      <p
                        key={item.productId}
                        className="text-xs text-muted-foreground"
                      >
                        × {item.quantity} {item.productName}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Collect:{" "}
                    <span className="font-medium text-foreground ml-0.5">
                      {order.pickupPointName}
                    </span>
                  </div>
                </div>

                {order.deliveryType === "home_delivery" &&
                  order.homeAddress && (
                    <div className="bg-blue-50 rounded-lg p-2 mb-3 text-xs">
                      <span className="font-medium text-blue-700">
                        🏠 Home delivery:
                      </span>
                      <span className="text-blue-600 ml-1">
                        {order.homeAddress}
                      </span>
                    </div>
                  )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
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
                    data-ocid={`driver.accept.primary_button.${i + 1}`}
                  >
                    Accept Delivery
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

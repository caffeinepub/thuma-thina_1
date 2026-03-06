import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { MapPin, Package, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";

export function OperatorIncomingOrdersPage() {
  const { orders, updateOrderStatus, currentUser, staffUsers, pickupPoints } =
    useApp();

  // Get operator's pickup point
  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const myPickupPoint = pickupPoints.find(
    (pp) => pp.id === staffUser?.pickupPointId,
  );
  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OP";

  // Orders assigned to this pickup point that aren't yet collected
  const incoming = orders.filter(
    (o) =>
      o.pickupPointId === myPickupPoint?.id &&
      ["out_for_delivery", "delivered", "accepted_by_driver"].includes(
        o.status,
      ),
  );

  const handleMarkCollected = (orderId: string) => {
    updateOrderStatus(orderId, "collected");
    toast.success("Order marked as collected 📦");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Operator identity header */}
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
          {myPickupPoint && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{myPickupPoint.name}</span>
            </div>
          )}
        </div>
        {!staffUser?.profileImageUrl && (
          <Link to="/operator/profile" data-ocid="operator.profile.link">
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
          Incoming Orders
        </h1>
        {myPickupPoint ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{myPickupPoint.name}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No pick-up point assigned
          </p>
        )}
      </div>

      {incoming.length === 0 ? (
        <div className="text-center py-16" data-ocid="operator.empty_state">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-display font-semibold text-lg mb-1">
            No incoming orders
          </p>
          <p className="text-muted-foreground text-sm">
            Orders will appear here when drivers are on their way
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incoming.map((order, i) => (
            <Card
              key={order.id}
              className="card-glow border-border/60"
              data-ocid={`operator.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm font-display">
                        #{order.id}
                      </span>
                      {order.isWalkIn && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5"
                        >
                          Walk-in
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName} · {order.customerPhone}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="bg-muted/40 rounded-lg p-2 mb-3">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-xs"
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

                <div className="flex items-center text-xs text-muted-foreground mb-3">
                  Driver: {order.driverName || "Not yet assigned"}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-primary">
                    R{order.total.toFixed(2)}
                  </span>
                  {order.status !== "collected" && (
                    <Button
                      onClick={() => handleMarkCollected(order.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-ocid={`operator.collected.primary_button.${i + 1}`}
                    >
                      Mark Collected ✓
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  Banknote,
  ClipboardList,
  MapPin,
  Package,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export function OperatorIncomingOrdersPage() {
  const { orders, updateOrderStatus, currentUser, staffUsers, pickupPoints } =
    useApp();
  const { userProfile } = useAuth();

  // For operators, their pickupPointId is stored as businessAreaId in their profile
  const myPickupPointId =
    userProfile?.businessAreaId ??
    staffUsers.find((u) => u.id === currentUser?.id)?.pickupPointId ??
    null;
  const myPickupPoint = pickupPoints.find((pp) => pp.id === myPickupPointId);
  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OP";

  // Orders awaiting payment at this pickup point
  const awaitingPayment = orders.filter(
    (o) =>
      (o.pickupPointId === myPickupPointId ||
        o.pickupPointId === myPickupPoint?.id) &&
      o.status === "awaiting_payment",
  );

  // Orders assigned to this pickup point that are in-progress (paid, with shopper/driver)
  const incomingStatuses = [
    "pending",
    "accepted_by_shopper",
    "shopping_in_progress",
    "ready_for_collection",
    "accepted_by_driver",
    "out_for_delivery",
  ];
  const incoming = orders.filter(
    (o) =>
      (o.pickupPointId === myPickupPointId ||
        o.pickupPointId === myPickupPoint?.id) &&
      incomingStatuses.includes(o.status),
  );

  // All orders for tracking / history — sorted most recent first
  const allOrders = orders
    .filter(
      (o) =>
        o.pickupPointId === myPickupPointId ||
        o.pickupPointId === myPickupPoint?.id,
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );

  const handleMarkPaymentReceived = (orderId: string) => {
    updateOrderStatus(orderId, "pending");
    toast.success("Payment received — order sent to shoppers 🛒");
  };

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
          Operator Dashboard
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

      <Tabs defaultValue="awaiting_payment">
        <TabsList className="w-full mb-5 h-auto flex-wrap gap-1">
          <TabsTrigger
            value="awaiting_payment"
            className="flex-1"
            data-ocid="operator.awaiting_payment.tab"
          >
            Awaiting Payment
            {awaitingPayment.length > 0 && (
              <Badge
                className="ml-2 h-5 min-w-5 px-1.5 text-[10px]"
                variant="destructive"
              >
                {awaitingPayment.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="incoming"
            className="flex-1"
            data-ocid="operator.incoming.tab"
          >
            In Progress
            {incoming.length > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">
                {incoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex-1"
            data-ocid="operator.all_orders.tab"
          >
            All Orders
            {allOrders.length > 0 && (
              <Badge
                variant="outline"
                className="ml-2 h-5 min-w-5 px-1.5 text-[10px]"
              >
                {allOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Awaiting Payment tab ── */}
        <TabsContent value="awaiting_payment">
          {awaitingPayment.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="operator.awaiting_payment.empty_state"
            >
              <div className="text-5xl mb-3">💳</div>
              <p className="font-display font-semibold text-lg mb-1">
                No pending payments
              </p>
              <p className="text-muted-foreground text-sm">
                Orders waiting for cash payment will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {awaitingPayment.map((order, i) => (
                <Card
                  key={order.id}
                  className="card-glow border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10"
                  data-ocid={`operator.awaiting_payment.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-amber-600" />
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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleString()}
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

                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-primary text-lg">
                        R{order.total.toFixed(2)}
                      </span>
                      <Button
                        onClick={() => handleMarkPaymentReceived(order.id)}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                        data-ocid={`operator.mark_paid.primary_button.${i + 1}`}
                      >
                        <Banknote className="h-3.5 w-3.5" />
                        Mark Payment Received
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── In Progress Orders tab ── */}
        <TabsContent value="incoming">
          {incoming.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="operator.incoming.empty_state"
            >
              <div className="text-5xl mb-3">📦</div>
              <p className="font-display font-semibold text-lg mb-1">
                No orders in progress
              </p>
              <p className="text-muted-foreground text-sm">
                Paid orders being processed by shoppers and drivers will appear
                here
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
                      {order.shopperName && (
                        <span>Shopper: {order.shopperName}</span>
                      )}
                      {order.driverName && (
                        <span className="ml-3">Driver: {order.driverName}</span>
                      )}
                      {!order.shopperName && !order.driverName && (
                        <span>Awaiting shopper assignment</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-primary">
                        R{order.total.toFixed(2)}
                      </span>
                      {["out_for_delivery", "delivered"].includes(
                        order.status,
                      ) && (
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
        </TabsContent>

        {/* ── All Orders tracking tab ── */}
        <TabsContent value="all">
          {allOrders.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="operator.all_orders.empty_state"
            >
              <div className="text-5xl mb-3">📋</div>
              <p className="font-display font-semibold text-lg mb-1">
                No orders yet
              </p>
              <p className="text-muted-foreground text-sm">
                All orders processed at this pick-up point will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">
                <ClipboardList className="inline h-3.5 w-3.5 mr-1" />
                Complete order history for customer enquiries
              </p>
              {allOrders.map((order, i) => (
                <Card
                  key={order.id}
                  className="card-glow border-border/40"
                  data-ocid={`operator.all.item.${i + 1}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm font-display font-mono">
                            #{order.id}
                          </span>
                          <StatusBadge status={order.status} />
                          {order.isWalkIn && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5"
                            >
                              Walk-in
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.customerName} · {order.customerPhone}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {order.shopperName && (
                          <p className="text-xs text-muted-foreground">
                            Shopper: {order.shopperName}
                          </p>
                        )}
                        {order.driverName && (
                          <p className="text-xs text-muted-foreground">
                            Driver: {order.driverName}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-display font-bold text-primary text-sm">
                          R{order.total.toFixed(2)}
                        </span>
                        {["out_for_delivery", "delivered"].includes(
                          order.status,
                        ) && (
                          <div className="mt-2">
                            <Button
                              onClick={() => handleMarkCollected(order.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs h-7"
                              data-ocid={`operator.all.collected.primary_button.${i + 1}`}
                            >
                              Mark Collected
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

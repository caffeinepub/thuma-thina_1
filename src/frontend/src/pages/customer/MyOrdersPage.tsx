import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, ShoppingBag, Star, Zap } from "lucide-react";
import { useState } from "react";
import { OrderCard } from "../../components/OrderCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import type { OrderStatus } from "../../data/mockData";
import { SPECIAL_SHOPPER_MARKER } from "../../utils/orderSplit";

const FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "pending", label: "Pending" },
  { value: "shopping_in_progress", label: "In Progress" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "collected", label: "Collected" },
];

/** Derive an overall status label for a group of sub-orders */
function groupStatus(statuses: OrderStatus[]): string {
  if (statuses.every((s) => s === "delivered" || s === "collected")) {
    return "Completed";
  }
  if (statuses.some((s) => s === "out_for_delivery")) return "Out for Delivery";
  if (statuses.some((s) => s === "accepted_by_driver"))
    return "Driver Assigned";
  if (statuses.some((s) => s === "ready_for_collection"))
    return "Ready for Collection";
  if (statuses.some((s) => s === "shopping_in_progress"))
    return "Shopping in Progress";
  if (statuses.some((s) => s === "accepted_by_shopper"))
    return "Shopper Assigned";
  return "Pending";
}

export function MyOrdersPage() {
  const { orders, currentUser, retailers } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const myOrders = orders.filter((o) => o.customerId === currentUser?.id);

  // Group by parentOrderId
  // Orders without a parentOrderId are standalone; single-sub-order parents are also standalone
  const groupMap = new Map<string, typeof myOrders>();
  const standaloneOrders: typeof myOrders = [];

  for (const order of myOrders) {
    if (!order.parentOrderId) {
      standaloneOrders.push(order);
    } else {
      const existing = groupMap.get(order.parentOrderId) ?? [];
      existing.push(order);
      groupMap.set(order.parentOrderId, existing);
    }
  }

  // Filter logic for standalone
  const filteredStandalone =
    filter === "all"
      ? standaloneOrders
      : standaloneOrders.filter((o) => o.status === filter);

  // Filter logic for groups: show group if any sub-order matches the filter
  const filteredGroups = Array.from(groupMap.entries()).filter(
    ([, subOrders]) => {
      if (filter === "all") return true;
      return subOrders.some((o) => o.status === filter);
    },
  );

  // Combine for display — groups sorted by most recent
  const allGroupParentIds = filteredGroups.map(([parentId]) => parentId);

  const totalCount = filteredStandalone.length + filteredGroups.length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold mb-4">My Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="order.filter.tab"
          >
            {f.label}
          </button>
        ))}
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-16" data-ocid="order.empty_state">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-display font-semibold text-lg mb-1">
            No orders yet
          </p>
          <p className="text-muted-foreground text-sm mb-5">
            Browse the catalogue and place your first order
          </p>
          <Link to="/catalogue" data-ocid="order.browse.primary_button">
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Grouped (split) orders */}
          {allGroupParentIds.map((parentId, groupIdx) => {
            const subOrders = groupMap.get(parentId)!;
            const groupTotal = subOrders.reduce((s, o) => s + o.total, 0);
            const statuses = subOrders.map((o) => o.status as OrderStatus);
            const overallStatus = groupStatus(statuses);
            const mostRecent = subOrders.reduce((a, b) =>
              a.createdAt > b.createdAt ? a : b,
            );

            return (
              <Card
                key={parentId}
                className="card-glow border-primary/20 bg-primary/5"
                data-ocid={`order.item.${groupIdx + 1}`}
              >
                <div>
                  <CardContent className="p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-sm font-display">
                            #{parentId}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs border-primary/40 text-primary bg-primary/10"
                          >
                            {subOrders.length} sub-orders
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(mostRecent.createdAt).toLocaleDateString(
                            "en-ZA",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Overall:{" "}
                          <span className="font-medium text-foreground/80">
                            {overallStatus}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-display font-bold text-primary text-sm">
                          R{groupTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="px-4 pb-4 space-y-2 border-t border-border/40 pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Sub-orders breakdown:
                    </p>
                    {subOrders.map((subOrder, subIdx) => {
                      const dedicatedRetailer = subOrder.dedicatedRetailerId
                        ? retailers.find(
                            (r) => r.id === subOrder.dedicatedRetailerId,
                          )
                        : null;
                      return (
                        <div
                          key={subOrder.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-background/60 border border-border/50 px-3 py-2.5"
                          data-ocid={`order.sub.item.${groupIdx + 1}.${subIdx + 1}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono font-medium text-muted-foreground">
                                #{subOrder.id}
                              </span>
                              {dedicatedRetailer && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 text-xs gap-1 py-0"
                                  data-ocid={`order.dedicated_retailer.toggle.${groupIdx + 1}.${subIdx + 1}`}
                                >
                                  <Star className="h-2.5 w-2.5 fill-current" />
                                  {dedicatedRetailer.name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge status={subOrder.status} />
                            </div>
                            {subOrder.status === "awaiting_payment" && (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/60 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                                <span className="text-base leading-none">
                                  💳
                                </span>
                                <span>
                                  Please visit{" "}
                                  <strong>
                                    {subOrder.pickupPointName ||
                                      "your pick-up point"}
                                  </strong>{" "}
                                  to pay for your order before it can be
                                  processed.
                                </span>
                              </div>
                            )}
                            {subOrder.businessAreaId && (
                              <span className="text-xs text-muted-foreground">
                                📍 {subOrder.businessAreaId}
                              </span>
                            )}
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {subOrder.items.map((item) => (
                                <span key={item.productId} className="block">
                                  × {item.quantity} {item.productName}
                                </span>
                              ))}
                            </div>
                            {subOrder.shopperProofImages &&
                              subOrder.shopperProofImages.length > 0 && (
                                <div className="mt-2 rounded border border-yellow-200/60 bg-yellow-50/30 dark:bg-yellow-950/10 p-2 space-y-1.5">
                                  <div className="flex items-center gap-1 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                                    <Zap className="h-3 w-3" />
                                    Token slip from shopper
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {subOrder.shopperProofImages.map(
                                      (img, pi) => (
                                        <button
                                          key={img.slice(-12)}
                                          type="button"
                                          onClick={() =>
                                            window.open(img, "_blank")
                                          }
                                          className="w-16 h-16 rounded border border-border bg-white overflow-hidden p-0"
                                        >
                                          <img
                                            src={img}
                                            alt={`Token ${pi + 1}`}
                                            className="w-full h-full object-contain"
                                          />
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-display font-bold text-xs text-primary">
                              R{subOrder.total.toFixed(2)}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs gap-1 h-7 px-2"
                              data-ocid={`order.sub.track.button.${groupIdx + 1}.${subIdx + 1}`}
                              onClick={() =>
                                navigate({
                                  to: "/orders/$orderId",
                                  params: { orderId: subOrder.id },
                                })
                              }
                            >
                              <MapPin className="h-3 w-3" />
                              Track
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Standalone orders */}
          {filteredStandalone.map((order, i) => (
            <div key={order.id} className="space-y-2">
              <OrderCard
                order={order}
                index={allGroupParentIds.length + i + 1}
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs gap-1.5"
                    data-ocid={`order.track.button.${allGroupParentIds.length + i + 1}`}
                    onClick={() =>
                      navigate({
                        to: "/orders/$orderId",
                        params: { orderId: order.id },
                      })
                    }
                  >
                    <MapPin className="h-3 w-3" />
                    Track
                  </Button>
                }
              />
              {/* Electricity token proof from shopper */}
              {(order.dedicatedRetailerId === SPECIAL_SHOPPER_MARKER ||
                (order.shopperProofImages &&
                  order.shopperProofImages.length > 0)) &&
                order.shopperProofImages &&
                order.shopperProofImages.length > 0 && (
                  <div
                    className="rounded-lg border border-yellow-300/60 bg-yellow-50/40 dark:bg-yellow-950/10 p-3 space-y-2"
                    data-ocid={`order.electricity_token.panel.${allGroupParentIds.length + i + 1}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                        Electricity Token
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Token/Receipt from Shopper:
                    </p>
                    <div className="space-y-2">
                      {order.shopperProofImages.map((img, pi) => (
                        <img
                          key={img.slice(-20)}
                          src={img}
                          alt={`Token receipt ${pi + 1}`}
                          className="w-full rounded-lg border border-border object-contain max-h-64 bg-white"
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

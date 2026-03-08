import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useState } from "react";
import { OrderCard } from "../../components/OrderCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import type { OrderStatus } from "../../data/mockData";

const FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const toggleGroup = (parentId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

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
            const isOpen = expandedGroups.has(parentId);
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
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleGroup(parentId)}
                >
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-primary/5 rounded-xl transition-colors">
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
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
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
                                <span className="text-xs text-muted-foreground">
                                  {subOrder.items.length} item
                                  {subOrder.items.length !== 1 ? "s" : ""}
                                </span>
                              </div>
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
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          {/* Standalone orders */}
          {filteredStandalone.map((order, i) => (
            <OrderCard
              key={order.id}
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
          ))}
        </div>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import type { OrderStatus } from "../../data/mockData";
import { ORDER_STATUS_LABELS } from "../../data/mockData";

const FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "pending", label: "Pending" },
  { value: "accepted_by_shopper", label: "With Shopper" },
  { value: "shopping_in_progress", label: "Shopping" },
  { value: "ready_for_collection", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "collected", label: "Collected" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminOrdersPage() {
  const { orders, towns } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [openTowns, setOpenTowns] = useState<Set<string>>(new Set(["_first"]));

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = {
    pending: orders.filter((o) =>
      ["awaiting_payment", "pending"].includes(o.status),
    ).length,
    active: orders.filter((o) =>
      [
        "accepted_by_shopper",
        "shopping_in_progress",
        "ready_for_collection",
        "accepted_by_driver",
        "out_for_delivery",
      ].includes(o.status),
    ).length,
    completed: orders.filter((o) =>
      ["delivered", "collected"].includes(o.status),
    ).length,
  };

  // Group filtered orders by town
  const groupedByTown = (() => {
    const map = new Map<string, { townName: string; items: typeof filtered }>();
    const other: typeof filtered = [];
    for (const o of filtered) {
      const town = towns.find((t) => t.id === o.townId);
      if (!town) {
        other.push(o);
        continue;
      }
      if (!map.has(town.id)) {
        map.set(town.id, { townName: town.name, items: [] });
      }
      map.get(town.id)!.items.push(o);
    }
    const result = Array.from(map.entries()).map(([townId, v]) => ({
      townId,
      ...v,
    }));
    if (other.length > 0) {
      result.push({ townId: "_other", townName: "Other", items: other });
    }
    return result;
  })();

  const toggleTown = (townId: string) => {
    setOpenTowns((prev) => {
      const next = new Set(prev);
      if (next.has(townId)) next.delete(townId);
      else next.add(townId);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold mb-5">Orders Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Awaiting / Placed",
            value: stats.pending,
            color: "text-yellow-700 bg-yellow-50",
          },
          {
            label: "Active Orders",
            value: stats.active,
            color: "text-blue-700 bg-blue-50",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-green-700 bg-green-50",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID or customer…"
          className="pl-9"
          data-ocid="admin.order.search_input"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="admin.order.filter.tab"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Town-grouped order list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" data-ocid="admin.orders.empty_state">
          <p className="text-4xl mb-2">📋</p>
          <p className="font-display font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByTown.map((group, gIdx) => {
            const isOpen = openTowns.has(group.townId) || gIdx === 0;
            return (
              <div
                key={group.townId}
                className="rounded-xl border border-border/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleTown(group.townId)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  data-ocid="admin.order.town.toggle"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                      {group.townName}
                    </span>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {group.items.length}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-3 space-y-2">
                    {group.items.map((order, i) => (
                      <button
                        type="button"
                        key={order.id}
                        className="w-full text-left flex items-center gap-3 bg-card border border-border/60 rounded-xl p-3 hover:bg-muted/30 cursor-pointer transition-colors card-glow"
                        onClick={() => navigate({ to: `/orders/${order.id}` })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            navigate({ to: `/orders/${order.id}` });
                        }}
                        data-ocid={`admin.order.item.${gIdx * 100 + i + 1}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-display font-bold text-sm">
                              #{order.id}
                            </span>
                            {order.isWalkIn && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1"
                              >
                                Walk-in
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.customerName} · {order.pickupPointName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-display font-bold text-sm text-primary hidden sm:block">
                            R{order.total.toFixed(2)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

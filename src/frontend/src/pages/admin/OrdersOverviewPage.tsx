import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import type { OrderStatus } from "../../data/mockData";
import { ORDER_STATUS_LABELS } from "../../data/mockData";

const FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
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
  const { orders } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

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
    pending: orders.filter((o) => o.status === "pending").length,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold mb-5">Orders Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Awaiting Shoppers",
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" data-ocid="admin.orders.empty_state">
          <p className="text-4xl mb-2">📋</p>
          <p className="font-display font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order, i) => (
            <button
              type="button"
              key={order.id}
              className="w-full text-left flex items-center gap-3 bg-card border border-border/60 rounded-xl p-3 hover:bg-muted/30 cursor-pointer transition-colors card-glow"
              onClick={() => navigate({ to: `/orders/${order.id}` })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  navigate({ to: `/orders/${order.id}` });
              }}
              data-ocid={`admin.order.item.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-display font-bold text-sm">
                    #{order.id}
                  </span>
                  {order.isWalkIn && (
                    <Badge variant="secondary" className="text-[10px] px-1">
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
}

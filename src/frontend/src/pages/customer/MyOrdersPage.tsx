import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { OrderCard } from "../../components/OrderCard";
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

export function MyOrdersPage() {
  const { orders, currentUser } = useApp();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const myOrders = orders.filter((o) => o.customerId === currentUser?.id);
  const filtered =
    filter === "all" ? myOrders : myOrders.filter((o) => o.status === filter);

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

      {filtered.length === 0 ? (
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
          {filtered.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

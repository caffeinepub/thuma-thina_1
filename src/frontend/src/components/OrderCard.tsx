import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin, ShoppingBag } from "lucide-react";
import type { Order } from "../data/mockData";
import { StatusBadge } from "./StatusBadge";

interface OrderCardProps {
  order: Order;
  actions?: React.ReactNode;
  index?: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderCard({ order, actions, index = 1 }: OrderCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="card-glow border border-border/60"
      data-ocid={`order.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm font-display">
                #{order.id}
              </span>
              {order.isWalkIn && (
                <span className="text-[10px] bg-accent/30 text-accent-foreground px-1.5 py-0.5 rounded-full">
                  Walk-in
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {order.customerName}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{order.pickupPointName}</span>
            {order.deliveryType === "home_delivery" && (
              <span className="text-primary font-medium">→ Home</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
            <span className="ml-2 font-bold text-primary font-display">
              R{order.total.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/orders/${order.id}` })}
              className="text-xs"
              data-ocid={`order.view.button.${index}`}
            >
              View
            </Button>
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

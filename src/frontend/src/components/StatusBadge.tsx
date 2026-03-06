import { cn } from "@/lib/utils";
import type { OrderStatus } from "../data/mockData";
import { ORDER_STATUS_LABELS } from "../data/mockData";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "status-pending",
  accepted_by_shopper: "status-accepted_by_shopper",
  shopping_in_progress: "status-shopping_in_progress",
  ready_for_collection: "status-ready_for_collection",
  accepted_by_driver: "status-accepted_by_driver",
  out_for_delivery: "status-out_for_delivery",
  delivered: "status-delivered",
  collected: "status-collected",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

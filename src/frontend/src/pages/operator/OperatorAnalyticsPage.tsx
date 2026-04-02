import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { LikeDislikeBar } from "../../components/LikeDislikeBar";
import { ReviewsSection } from "../../components/ReviewsSection";
import { useApp } from "../../context/AppContext";
import { ORDER_STATUS_LABELS } from "../../data/mockData";

type TimeRange = "today" | "week" | "month" | "custom";

function getRangeStart(range: TimeRange, customFrom: string): Date {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (customFrom) return new Date(customFrom);
  return new Date(0);
}

function getRangeEnd(range: TimeRange, customTo: string): Date {
  if (range === "custom" && customTo) {
    const d = new Date(customTo);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent: string;
}) {
  return (
    <Card className="card-glow border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className={`font-display text-2xl font-bold mt-1 ${accent}`}>
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <span className="text-2xl mt-0.5">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function OperatorAnalyticsPage() {
  const { orders, currentUser, staffUsers, products } = useApp();

  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const rangeStart = useMemo(
    () => getRangeStart(timeRange, customFrom),
    [timeRange, customFrom],
  );
  const rangeEnd = useMemo(
    () => getRangeEnd(timeRange, customTo),
    [timeRange, customTo],
  );

  // Find this operator's pick-up point
  const myPickupPointId = useMemo(() => {
    const staff = staffUsers.find((u) => u.id === currentUser?.id);
    return staff?.pickupPointId || "pp1";
  }, [staffUsers, currentUser]);

  const myOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (o.pickupPointId !== myPickupPointId) return false;
        const d = new Date(o.createdAt);
        return d >= rangeStart && d <= rangeEnd;
      }),
    [orders, myPickupPointId, rangeStart, rangeEnd],
  );

  const walkInOrders = useMemo(
    () => myOrders.filter((o) => o.isWalkIn === true),
    [myOrders],
  );

  const onlineOrders = useMemo(
    () => myOrders.filter((o) => !o.isWalkIn),
    [myOrders],
  );

  const totalSales = useMemo(
    () => myOrders.reduce((sum, o) => sum + o.total, 0),
    [myOrders],
  );

  // Top products at this pick-up point
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    for (const o of myOrders) {
      for (const item of o.items) {
        if (!map[item.productId]) {
          const prod = products.find((p) => p.id === item.productId);
          map[item.productId] = {
            name: prod?.name || item.productName,
            count: 0,
          };
        }
        map[item.productId].count += item.quantity;
      }
    }
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [myOrders, products]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">My Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {currentUser?.name} · Pick-up Point Operator Dashboard
        </p>
      </div>

      {/* Time Range Filter */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        data-ocid="operator.analytics.timerange.panel"
      >
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRange)}
        >
          <TabsList>
            <TabsTrigger value="today" data-ocid="operator.analytics.today.tab">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" data-ocid="operator.analytics.week.tab">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" data-ocid="operator.analytics.month.tab">
              This Month
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              data-ocid="operator.analytics.custom.tab"
            >
              Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {timeRange === "custom" && (
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-36 text-xs"
              data-ocid="operator.analytics.from_input"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-36 text-xs"
              data-ocid="operator.analytics.to_input"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Walk-in Orders"
          value={walkInOrders.length}
          icon="🚶"
          accent="text-primary"
        />
        <KpiCard
          label="Online Orders"
          value={onlineOrders.length}
          icon="📱"
          accent="text-[oklch(0.5_0.18_260)]"
        />
        <KpiCard
          label="Total Sales"
          value={`R${totalSales.toFixed(2)}`}
          icon="💰"
          accent="text-[oklch(0.55_0.14_150)]"
        />
        <KpiCard
          label="Top Product"
          value={topProducts[0]?.name.split(" ")[0] || "—"}
          sub={topProducts[0] ? `×${topProducts[0].count} sold` : ""}
          icon="🏆"
          accent="text-[oklch(0.55_0.17_42)]"
        />
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card className="card-glow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              🏆 Top Products at Your Point
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const colors = [
                  "#C15A2D",
                  "#D4891A",
                  "#2D7A5A",
                  "#2D5A9A",
                  "#8B2DB5",
                ];
                return (
                  <div
                    key={p.name}
                    className="flex items-center gap-3"
                    data-ocid={`operator.product.item.${i + 1}`}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                      style={{ background: colors[i] || "#888" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">
                      ×{p.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            📋 Orders at My Pick-up Point
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {myOrders.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="operator.history.empty_state"
            >
              No orders in selected range
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-6">Order ID</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right pr-6">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myOrders.map((o, i) => (
                  <TableRow
                    key={o.id}
                    data-ocid={`operator.order.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs pl-6">
                      #{o.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {o.isWalkIn ? "🚶 Walk-in" : "📱 Online"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{o.customerName}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-primary">
                      R{o.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] status-${o.status}`}
                      >
                        {ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground pr-6">
                      {formatDate(o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* My Reviews */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            ⭐ My Reviews & Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LikeDislikeBar
            targetId={currentUser?.id ?? ""}
            targetType="operator"
          />
          <ReviewsSection
            targetId={currentUser?.id ?? ""}
            targetType="operator"
            completedOrderId={
              myOrders.find((o) =>
                ["delivered", "collected", "ready_for_collection"].includes(
                  o.status,
                ),
              )?.id ?? null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

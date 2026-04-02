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

export function DriverAnalyticsPage() {
  const { orders, currentUser } = useApp();

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

  const myOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (o.driverId !== currentUser?.id) return false;
        const d = new Date(o.createdAt);
        return d >= rangeStart && d <= rangeEnd;
      }),
    [orders, currentUser, rangeStart, rangeEnd],
  );

  const completed = useMemo(
    () => myOrders.filter((o) => ["delivered", "collected"].includes(o.status)),
    [myOrders],
  );

  const inProgress = useMemo(
    () =>
      myOrders.filter((o) =>
        ["accepted_by_driver", "out_for_delivery"].includes(o.status),
      ),
    [myOrders],
  );

  const avgDeliveryTime = useMemo(() => {
    if (completed.length === 0) return "—";
    const totalHours = completed.reduce((sum, o) => {
      const diff =
        new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
      return sum + diff / 3600000;
    }, 0);
    return `${(totalHours / completed.length).toFixed(1)}h`;
  }, [completed]);

  const totalEarnings = useMemo(
    () => completed.reduce((sum, o) => sum + o.total * 0.05, 0),
    [completed],
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">My Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {currentUser?.name} · Driver Dashboard
        </p>
      </div>

      {/* Time Range Filter */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        data-ocid="driver.analytics.timerange.panel"
      >
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRange)}
        >
          <TabsList>
            <TabsTrigger value="today" data-ocid="driver.analytics.today.tab">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" data-ocid="driver.analytics.week.tab">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" data-ocid="driver.analytics.month.tab">
              This Month
            </TabsTrigger>
            <TabsTrigger value="custom" data-ocid="driver.analytics.custom.tab">
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
              data-ocid="driver.analytics.from_input"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-36 text-xs"
              data-ocid="driver.analytics.to_input"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Completed"
          value={completed.length}
          icon="🚚"
          accent="text-[oklch(0.55_0.14_150)]"
        />
        <KpiCard
          label="In Progress"
          value={inProgress.length}
          icon="🔄"
          accent="text-[oklch(0.5_0.18_260)]"
        />
        <KpiCard
          label="Avg Delivery Time"
          value={avgDeliveryTime}
          sub="hours per delivery"
          icon="⏱️"
          accent="text-primary"
        />
        <KpiCard
          label="Est. Earnings"
          value={`R${totalEarnings.toFixed(2)}`}
          sub="5% commission"
          icon="💵"
          accent="text-[oklch(0.55_0.17_42)]"
        />
      </div>

      {/* Delivery History */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            🚗 My Delivery History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {myOrders.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="driver.history.empty_state"
            >
              No deliveries in selected range
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-6">Order ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
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
                    data-ocid={`driver.delivery.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs pl-6">
                      #{o.id}
                    </TableCell>
                    <TableCell className="text-sm">{o.customerName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.deliveryType === "home_delivery"
                        ? "🏠 Home"
                        : "📍 Pick-up"}
                    </TableCell>
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
            targetType="driver"
          />
          <ReviewsSection
            targetId={currentUser?.id ?? ""}
            targetType="driver"
            completedOrderId={completed[0]?.id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}

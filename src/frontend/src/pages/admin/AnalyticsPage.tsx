import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../context/AppContext";
import type { Order, OrderStatus } from "../../data/mockData";
import { ORDER_STATUS_LABELS } from "../../data/mockData";
import { useActor } from "../../hooks/useActor";

// ─── Time range helpers ──────────────────────────────────────────────────────

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
  // custom
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

function formatDateShort(date: Date) {
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

interface NomayiniBalanceEntry {
  userId: string;
  totalEarned: number;
  unlockedBalance: number;
  lockedShortTerm: number;
  lockedLongTerm: number;
}

export function AdminAnalyticsPage() {
  const { orders, staffUsers, towns, products } = useApp();
  const { actor } = useActor();
  const [nomayiniBalances, setNomayiniBalances] = useState<
    NomayiniBalanceEntry[]
  >([]);

  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Filter state for order history
  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    "all" | OrderStatus
  >("all");
  const [historyTownFilter, setHistoryTownFilter] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 10;

  // Load platform-wide Nomayini balances
  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getAllNomayiniBalances()
      .then((raw: Array<[string, any]>) => {
        setNomayiniBalances(
          raw.map(([userId, bal]) => ({
            userId,
            totalEarned: Number(bal.totalEarned ?? 0),
            unlockedBalance: Number(bal.unlockedBalance ?? 0),
            lockedShortTerm: Number(bal.lockedShortTerm ?? 0),
            lockedLongTerm: Number(bal.lockedLongTerm ?? 0),
          })),
        );
      })
      .catch(() => {});
  }, [actor]);

  // ── Filtered orders ──────────────────────────────────────────────────────
  const rangeStart = useMemo(
    () => getRangeStart(timeRange, customFrom),
    [timeRange, customFrom],
  );
  const rangeEnd = useMemo(
    () => getRangeEnd(timeRange, customTo),
    [timeRange, customTo],
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= rangeStart && d <= rangeEnd;
      }),
    [orders, rangeStart, rangeEnd],
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.total, 0),
    [filteredOrders],
  );
  const activeShoppers = useMemo(
    () =>
      staffUsers.filter((u) => u.role === "shopper" && u.status === "approved")
        .length,
    [staffUsers],
  );
  const activeDrivers = useMemo(
    () =>
      staffUsers.filter((u) => u.role === "driver" && u.status === "approved")
        .length,
    [staffUsers],
  );

  // ── Daily volume chart ───────────────────────────────────────────────────
  const dailyChartData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const cursor = new Date(rangeStart);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(rangeEnd);
    // For "today" show last 7 days as well; cap chart to max 31 days
    const maxDays = 31;
    let count = 0;
    while (cursor <= end && count < maxDays) {
      const key = cursor.toISOString().slice(0, 10);
      dayMap[key] = 0;
      cursor.setDate(cursor.getDate() + 1);
      count++;
    }
    for (const o of filteredOrders) {
      const key = o.createdAt.slice(0, 10);
      if (key in dayMap) dayMap[key]++;
    }
    return Object.entries(dayMap).map(([date, orders]) => ({
      date: formatDateShort(new Date(date)),
      orders,
    }));
  }, [filteredOrders, rangeStart, rangeEnd]);

  // ── Town breakdown ────────────────────────────────────────────────────────
  const townBreakdown = useMemo(() => {
    const map: Record<
      string,
      { name: string; orders: number; revenue: number }
    > = {};
    for (const t of towns) {
      map[t.id] = { name: t.name, orders: 0, revenue: 0 };
    }
    for (const o of filteredOrders) {
      if (map[o.townId]) {
        map[o.townId].orders++;
        map[o.townId].revenue += o.total;
      }
    }
    return Object.values(map).sort((a, b) => b.orders - a.orders);
  }, [filteredOrders, towns]);

  // ── Top products ──────────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    for (const o of filteredOrders) {
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
  }, [filteredOrders, products]);

  // ── Staff performance ──────────────────────────────────────────────────────
  const shopperStats = useMemo(() => {
    const shoppers = staffUsers.filter(
      (u) => u.role === "shopper" && u.status === "approved",
    );
    return shoppers.map((s) => {
      const myOrders = filteredOrders.filter((o) => o.shopperId === s.id);
      const completed = myOrders.filter((o) =>
        ["delivered", "collected"].includes(o.status),
      );
      return {
        id: s.id,
        name: s.name,
        accepted: myOrders.length,
        completed: completed.length,
        earnings: completed.reduce((sum, o) => sum + o.total * 0.08, 0),
      };
    });
  }, [filteredOrders, staffUsers]);

  const driverStats = useMemo(() => {
    const drivers = staffUsers.filter(
      (u) => u.role === "driver" && u.status === "approved",
    );
    return drivers.map((d) => {
      const myOrders = filteredOrders.filter((o) => o.driverId === d.id);
      const completed = myOrders.filter((o) =>
        ["delivered", "collected"].includes(o.status),
      );
      return {
        id: d.id,
        name: d.name,
        completed: completed.length,
        earnings: completed.reduce((sum, o) => sum + o.total * 0.05, 0),
      };
    });
  }, [filteredOrders, staffUsers]);

  // ── Platform-wide Nomayini analytics ─────────────────────────────────────
  const nomayiniPlatformStats = useMemo(() => {
    const nonZero = nomayiniBalances.filter(
      (b) =>
        b.totalEarned > 0 ||
        b.unlockedBalance > 0 ||
        b.lockedShortTerm > 0 ||
        b.lockedLongTerm > 0,
    );
    const totalDistributed = nomayiniBalances.reduce(
      (s, b) => s + b.totalEarned,
      0,
    );
    const totalUnlocked = nomayiniBalances.reduce(
      (s, b) => s + b.unlockedBalance,
      0,
    );
    const totalShortTerm = nomayiniBalances.reduce(
      (s, b) => s + b.lockedShortTerm,
      0,
    );
    const totalLongTerm = nomayiniBalances.reduce(
      (s, b) => s + b.lockedLongTerm,
      0,
    );
    return {
      totalDistributed,
      totalUnlocked,
      totalShortTerm,
      totalLongTerm,
      holders: nonZero.length,
      totalLocked: totalShortTerm + totalLongTerm,
    };
  }, [nomayiniBalances]);

  // ── Order history (filtered + paginated) ──────────────────────────────────
  const historyFiltered = useMemo(() => {
    return filteredOrders.filter((o) => {
      const matchStatus =
        historyStatusFilter === "all" || o.status === historyStatusFilter;
      const matchTown =
        historyTownFilter === "all" || o.townId === historyTownFilter;
      return matchStatus && matchTown;
    });
  }, [filteredOrders, historyStatusFilter, historyTownFilter]);

  const historyPages = Math.ceil(historyFiltered.length / PAGE_SIZE);
  const historySlice = historyFiltered.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE,
  );

  const chartColors = ["#C15A2D", "#D4891A", "#2D7A5A", "#2D5A9A", "#8B2DB5"];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform performance and order insights
        </p>
      </div>

      {/* Time Range Filter */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        data-ocid="analytics.timerange.panel"
      >
        <Tabs
          value={timeRange}
          onValueChange={(v) => {
            setTimeRange(v as TimeRange);
            setHistoryPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="today" data-ocid="analytics.today.tab">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" data-ocid="analytics.week.tab">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" data-ocid="analytics.month.tab">
              This Month
            </TabsTrigger>
            <TabsTrigger value="custom" data-ocid="analytics.custom.tab">
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
              data-ocid="analytics.custom.from_input"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-36 text-xs"
              data-ocid="analytics.custom.to_input"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Orders"
          value={filteredOrders.length}
          icon="📦"
          accent="text-primary"
        />
        <KpiCard
          label="Total Revenue"
          value={`R${totalRevenue.toFixed(2)}`}
          icon="💰"
          accent="text-[oklch(0.55_0.14_150)]"
        />
        <KpiCard
          label="Active Shoppers"
          value={activeShoppers}
          icon="🛍️"
          accent="text-[oklch(0.55_0.17_42)]"
        />
        <KpiCard
          label="Active Drivers"
          value={activeDrivers}
          icon="🚗"
          accent="text-[oklch(0.5_0.18_260)]"
        />
      </div>

      {/* Order Volume Chart */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            📈 Daily Order Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyChartData.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-8 text-center"
              data-ocid="analytics.chart.empty_state"
            >
              No orders in selected range
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={dailyChartData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.025 60)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.04 55)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.04 55)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid oklch(0.88 0.025 60)",
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="oklch(0.55 0.17 42)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Town Breakdown + Top Products */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Town/Area Breakdown */}
        <Card className="card-glow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              🗺️ Town Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-6">Town</TableHead>
                  <TableHead className="text-xs text-right">Orders</TableHead>
                  <TableHead className="text-xs text-right pr-6">
                    Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {townBreakdown.map((t, i) => (
                  <TableRow
                    key={t.name}
                    data-ocid={`analytics.town.row.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm pl-6">
                      {t.name}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {t.orders}
                    </TableCell>
                    <TableCell className="text-right text-sm text-primary font-semibold pr-6">
                      R{t.revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="card-glow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              🏆 Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="analytics.products.empty_state"
              >
                No orders yet
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3"
                    data-ocid={`analytics.product.item.${i + 1}`}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                      style={{ background: chartColors[i] || "#888" }}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Shoppers */}
        <Card className="card-glow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              🛍️ Shopper Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-6">Shopper</TableHead>
                  <TableHead className="text-xs text-center">
                    Accepted
                  </TableHead>
                  <TableHead className="text-xs text-center">Done</TableHead>
                  <TableHead className="text-xs text-right pr-6">
                    Est. Earnings
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopperStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground text-sm py-6"
                      data-ocid="analytics.shoppers.empty_state"
                    >
                      No shopper data
                    </TableCell>
                  </TableRow>
                ) : (
                  shopperStats.map((s, i) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`analytics.shopper.row.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm pl-6">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {s.accepted}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {s.completed}
                      </TableCell>
                      <TableCell className="text-right text-sm text-primary font-semibold pr-6">
                        R{s.earnings.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card className="card-glow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              🚗 Driver Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-6">Driver</TableHead>
                  <TableHead className="text-xs text-center">
                    Deliveries
                  </TableHead>
                  <TableHead className="text-xs text-right pr-6">
                    Est. Earnings
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground text-sm py-6"
                      data-ocid="analytics.drivers.empty_state"
                    >
                      No driver data
                    </TableCell>
                  </TableRow>
                ) : (
                  driverStats.map((d, i) => (
                    <TableRow
                      key={d.id}
                      data-ocid={`analytics.driver.row.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm pl-6">
                        {d.name}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {d.completed}
                      </TableCell>
                      <TableCell className="text-right text-sm text-primary font-semibold pr-6">
                        R{d.earnings.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Platform-Wide Nomayini Token Structure */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            🪙 Nomayini Token Structure — Platform Wide
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="text-center p-4 rounded-xl bg-[oklch(0.95_0.06_75)] border border-[oklch(0.85_0.08_75)]">
              <p className="font-display text-xl font-bold text-[oklch(0.4_0.1_65)]">
                {nomayiniPlatformStats.totalDistributed.toFixed(1)}
              </p>
              <p className="text-xs text-[oklch(0.45_0.08_65)] font-medium mt-0.5">
                Total Distributed
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[oklch(0.93_0.07_150)] border border-[oklch(0.80_0.09_150)]">
              <p className="font-display text-xl font-bold text-[oklch(0.35_0.12_150)]">
                {nomayiniPlatformStats.totalUnlocked.toFixed(1)}
              </p>
              <p className="text-xs text-[oklch(0.38_0.1_150)] font-medium mt-0.5">
                Unlocked
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[oklch(0.93_0.06_230)] border border-[oklch(0.82_0.08_240)]">
              <p className="font-display text-xl font-bold text-[oklch(0.35_0.1_240)]">
                {nomayiniPlatformStats.totalShortTerm.toFixed(1)}
              </p>
              <p className="text-xs text-[oklch(0.4_0.08_240)] font-medium mt-0.5">
                Locked 3-Month
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[oklch(0.92_0.08_310)] border border-[oklch(0.80_0.10_310)]">
              <p className="font-display text-xl font-bold text-[oklch(0.35_0.12_300)]">
                {nomayiniPlatformStats.totalLongTerm.toFixed(1)}
              </p>
              <p className="text-xs text-[oklch(0.38_0.10_300)] font-medium mt-0.5">
                Locked 4-Year
              </p>
            </div>
          </div>

          {/* Token holders count */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="text-muted-foreground">Token holders:</span>
            <span className="font-bold text-primary">
              {nomayiniPlatformStats.holders}
            </span>
          </div>

          {/* Lock structure visual breakdown */}
          {nomayiniPlatformStats.totalDistributed > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lock Distribution
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs w-28 text-muted-foreground">
                    Unlocked
                  </span>
                  <Progress
                    value={
                      (nomayiniPlatformStats.totalUnlocked /
                        nomayiniPlatformStats.totalDistributed) *
                      100
                    }
                    className="flex-1 h-3"
                  />
                  <span className="text-xs w-10 text-right font-medium text-[oklch(0.35_0.12_150)]">
                    {(
                      (nomayiniPlatformStats.totalUnlocked /
                        nomayiniPlatformStats.totalDistributed) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-28 text-muted-foreground">
                    Locked 3-month
                  </span>
                  <Progress
                    value={
                      (nomayiniPlatformStats.totalShortTerm /
                        nomayiniPlatformStats.totalDistributed) *
                      100
                    }
                    className="flex-1 h-3 [&>div]:bg-[oklch(0.5_0.15_240)]"
                  />
                  <span className="text-xs w-10 text-right font-medium text-[oklch(0.35_0.1_240)]">
                    {(
                      (nomayiniPlatformStats.totalShortTerm /
                        nomayiniPlatformStats.totalDistributed) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-28 text-muted-foreground">
                    Locked 4-year
                  </span>
                  <Progress
                    value={
                      (nomayiniPlatformStats.totalLongTerm /
                        nomayiniPlatformStats.totalDistributed) *
                      100
                    }
                    className="flex-1 h-3 [&>div]:bg-[oklch(0.5_0.15_310)]"
                  />
                  <span className="text-xs w-10 text-right font-medium text-[oklch(0.35_0.12_300)]">
                    {(
                      (nomayiniPlatformStats.totalLongTerm /
                        nomayiniPlatformStats.totalDistributed) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          {nomayiniPlatformStats.totalDistributed === 0 && (
            <p
              className="text-sm text-muted-foreground text-center py-4"
              data-ocid="analytics.nomayini.empty_state"
            >
              No tokens distributed yet — token rewards are credited when orders
              are delivered
            </p>
          )}
        </CardContent>
      </Card>

      {/* Order History Log */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="font-display text-base">
              📋 Order History
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={historyStatusFilter}
                onValueChange={(v) => {
                  setHistoryStatusFilter(v as "all" | OrderStatus);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger
                  className="w-40 text-xs h-8"
                  data-ocid="analytics.history.status.select"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {(
                    Object.entries(ORDER_STATUS_LABELS) as [
                      OrderStatus,
                      string,
                    ][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={historyTownFilter}
                onValueChange={(v) => {
                  setHistoryTownFilter(v);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger
                  className="w-36 text-xs h-8"
                  data-ocid="analytics.history.town.select"
                >
                  <SelectValue placeholder="Town" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Towns</SelectItem>
                  {towns.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {historyFiltered.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="analytics.history.empty_state"
            >
              No orders match the filters
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs pl-6 min-w-[100px]">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs min-w-[120px]">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs min-w-[90px]">Town</TableHead>
                    <TableHead className="text-xs min-w-[130px]">
                      Status
                    </TableHead>
                    <TableHead className="text-xs text-right min-w-[80px]">
                      Total
                    </TableHead>
                    <TableHead className="text-xs text-right pr-6 min-w-[120px]">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historySlice.map((o: Order, i: number) => {
                    const town = towns.find((t) => t.id === o.townId);
                    return (
                      <TableRow
                        key={o.id}
                        data-ocid={`analytics.order.row.${i + 1}`}
                      >
                        <TableCell className="font-mono text-xs pl-6">
                          #{o.id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.customerName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {town?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] status-${o.status}`}
                          >
                            {ORDER_STATUS_LABELS[o.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-primary">
                          R{o.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground pr-6">
                          {formatDate(o.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* Pagination */}
              {historyPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">
                    {historyFiltered.length} orders · Page {historyPage} of{" "}
                    {historyPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage((p) => p - 1)}
                      data-ocid="analytics.history.pagination_prev"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage === historyPages}
                      onClick={() => setHistoryPage((p) => p + 1)}
                      data-ocid="analytics.history.pagination_next"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction/Payment History */}
      <Card className="card-glow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            💳 Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="analytics.payments.empty_state"
            >
              No transactions in range
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-6">Order ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right pr-6">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.slice(0, 20).map((o: Order, i: number) => (
                  <TableRow
                    key={o.id}
                    data-ocid={`analytics.payment.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs pl-6">
                      #{o.id}
                    </TableCell>
                    <TableCell className="text-sm">{o.customerName}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-primary">
                      R{o.total.toFixed(2)}
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
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { ORDER_STATUS_LABELS } from "../../data/mockData";
import { useActor } from "../../hooks/useActor";

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

export function ShopperAnalyticsPage() {
  const { orders, currentUser } = useApp();
  const { actor } = useActor();

  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "reviews">(
    "analytics",
  );

  const rangeStart = useMemo(
    () => getRangeStart(timeRange, customFrom),
    [timeRange, customFrom],
  );
  const rangeEnd = useMemo(
    () => getRangeEnd(timeRange, customTo),
    [timeRange, customTo],
  );

  // Load reviews
  useEffect(() => {
    if (!actor || !currentUser?.id) return;
    setReviewsLoading(true);
    (actor as any)
      .getReviewsForTarget(currentUser.id)
      .then((raw: any[]) =>
        setReviews(
          raw.map((r) => ({
            id: r.id,
            targetId: r.targetId,
            rating: Number(r.rating),
            comment: r.comment,
            orderId: r.orderId,
            createdAt: Number(r.createdAt),
          })),
        ),
      )
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [actor, currentUser?.id]);

  const myOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (o.shopperId !== currentUser?.id) return false;
        const d = new Date(o.createdAt);
        return d >= rangeStart && d <= rangeEnd;
      }),
    [orders, currentUser, rangeStart, rangeEnd],
  );

  const completed = useMemo(
    () => myOrders.filter((o) => ["delivered", "collected"].includes(o.status)),
    [myOrders],
  );

  const avgFulfillment = useMemo(() => {
    if (completed.length === 0) return "—";
    const totalHours = completed.reduce((sum, o) => {
      const diff =
        new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
      return sum + diff / 3600000;
    }, 0);
    return `${(totalHours / completed.length).toFixed(1)}h`;
  }, [completed]);

  const totalEarnings = useMemo(
    () => completed.reduce((sum, o) => sum + o.total * 0.08, 0),
    [completed],
  );

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">My Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {currentUser?.name} · Shopper Dashboard
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            activeTab === "analytics"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="shopper.analytics.tab"
        >
          Analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${
            activeTab === "reviews"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="shopper.reviews.tab"
        >
          <Star className="h-3.5 w-3.5" />
          My Reviews
          {reviews.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {reviews.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "analytics" && (
        <>
          {/* Time Range Filter */}
          <div
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            data-ocid="shopper.analytics.timerange.panel"
          >
            <Tabs
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
            >
              <TabsList>
                <TabsTrigger
                  value="today"
                  data-ocid="shopper.analytics.today.tab"
                >
                  Today
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  data-ocid="shopper.analytics.week.tab"
                >
                  This Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  data-ocid="shopper.analytics.month.tab"
                >
                  This Month
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  data-ocid="shopper.analytics.custom.tab"
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
                  data-ocid="shopper.analytics.from_input"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-36 text-xs"
                  data-ocid="shopper.analytics.to_input"
                />
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Orders Accepted"
              value={myOrders.length}
              icon="📬"
              accent="text-primary"
            />
            <KpiCard
              label="Orders Completed"
              value={completed.length}
              icon="✅"
              accent="text-[oklch(0.55_0.14_150)]"
            />
            <KpiCard
              label="Avg Fulfillment"
              value={avgFulfillment}
              sub="hours per order"
              icon="⏱️"
              accent="text-[oklch(0.5_0.18_260)]"
            />
            <KpiCard
              label="Est. Earnings"
              value={`R${totalEarnings.toFixed(2)}`}
              sub="8% commission"
              icon="💵"
              accent="text-[oklch(0.55_0.17_42)]"
            />
          </div>

          {/* Order History */}
          <Card className="card-glow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                📋 My Order History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {myOrders.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground text-center py-8"
                  data-ocid="shopper.history.empty_state"
                >
                  No orders in selected range
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs pl-6">Order ID</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs text-center">
                        Items
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Total
                      </TableHead>
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
                        data-ocid={`shopper.order.row.${i + 1}`}
                      >
                        <TableCell className="font-mono text-xs pl-6">
                          #{o.id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.customerName}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {o.items.reduce((s, item) => s + item.quantity, 0)}
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
        </>
      )}

      {activeTab === "reviews" && (
        <Card className="card-glow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Customer Reviews
              {reviews.length > 0 && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  Avg: {avgRating.toFixed(1)}/5 · {reviews.length} reviews
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div
                className="text-center py-8 text-sm text-muted-foreground"
                data-ocid="shopper.reviews.loading_state"
              >
                Loading reviews…
              </div>
            ) : reviews.length === 0 ? (
              <div
                className="text-center py-8"
                data-ocid="shopper.reviews.empty_state"
              >
                <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-display font-semibold">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete orders and customers will rate your service
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Rating summary */}
                <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 p-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-display text-3xl font-bold text-amber-600">
                        {avgRating.toFixed(1)}
                      </p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= Math.round(avgRating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reviews.length} reviews
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(
                          (r: any) => r.rating === star,
                        ).length;
                        const pct =
                          reviews.length > 0
                            ? (count / reviews.length) * 100
                            : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs w-4">{star}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                            <Progress value={pct} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground w-6">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {reviews.map((review: any, i: number) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border/50 p-3"
                    data-ocid={`shopper.review.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Order #{review.orderId}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground/80">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

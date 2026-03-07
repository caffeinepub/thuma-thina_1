import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bell, BellOff, Package, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { type AppNotification, useApp } from "../context/AppContext";

// ─── Relative time helper ─────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

// ─── Notification icon by type ───────────────────────────────────────────────

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  const cls = "h-4 w-4 shrink-0 mt-0.5";
  switch (type) {
    case "order":
      return <Package className={cn(cls, "text-primary")} />;
    case "delivery":
      return <Truck className={cn(cls, "text-accent")} />;
    case "approval":
      return <ShieldCheck className={cn(cls, "text-green-600")} />;
    default:
      return <Bell className={cn(cls, "text-muted-foreground")} />;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationsBell() {
  const {
    notifications,
    demoRole,
    markNotificationRead,
    markAllRead,
    unreadCount,
  } = useApp();

  const [open, setOpen] = useState(false);

  // Filter to only notifications relevant to the current role
  const roleNotifications = notifications
    .filter((n) => n.targetRole === demoRole || n.targetRole === "all")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
          data-ocid="nav.notifications.button"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 shadow-lg"
        align="end"
        sideOffset={8}
        data-ocid="nav.notifications.popover"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={markAllRead}
              data-ocid="nav.notifications.mark_all_button"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        {roleNotifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 px-4 gap-2 text-center"
            data-ocid="nav.notifications.empty_state"
          >
            <BellOff className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Order updates and alerts will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-border/40">
              {roleNotifications.map((notif, idx) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      !notif.read && "bg-primary/5 border-l-2 border-l-primary",
                    )}
                    onClick={() => {
                      markNotificationRead(notif.id);
                    }}
                    data-ocid={`nav.notifications.item.${idx + 1}`}
                  >
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notif.read
                              ? "font-normal text-foreground"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

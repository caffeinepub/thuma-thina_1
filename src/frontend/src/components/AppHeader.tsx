import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { AppUserRole } from "../backend.d";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { NotificationsBell } from "./NotificationsBell";

interface NavLink {
  to: string;
  label: string;
  ocid: string;
}

const NAV_LINKS: Record<string, NavLink[]> = {
  [AppUserRole.customer]: [
    { to: "/catalogue", label: "Browse", ocid: "nav.catalogue.link" },
    { to: "/cart", label: "Cart", ocid: "nav.cart.link" },
    { to: "/my-orders", label: "My Orders", ocid: "nav.orders.link" },
    { to: "/wallet", label: "My Wallet", ocid: "nav.wallet.link" },
  ],
  [AppUserRole.shopper]: [
    {
      to: "/shopper/available",
      label: "Available Orders",
      ocid: "nav.available.link",
    },
    { to: "/shopper/my-orders", label: "My Orders", ocid: "nav.myorders.link" },
    {
      to: "/shopper/suggest",
      label: "Suggest Product",
      ocid: "nav.suggest.link",
    },
    {
      to: "/shopper/stock",
      label: "Stock",
      ocid: "nav.stock.link",
    },
    {
      to: "/shopper/analytics",
      label: "Analytics",
      ocid: "nav.analytics.link",
    },
  ],
  [AppUserRole.driver]: [
    {
      to: "/driver/available",
      label: "Available Deliveries",
      ocid: "nav.available.link",
    },
    {
      to: "/driver/my-deliveries",
      label: "My Deliveries",
      ocid: "nav.deliveries.link",
    },
    {
      to: "/driver/profile",
      label: "My Profile",
      ocid: "nav.profile.link",
    },
    {
      to: "/driver/analytics",
      label: "Analytics",
      ocid: "nav.analytics.link",
    },
  ],
  [AppUserRole.operator]: [
    {
      to: "/operator/incoming",
      label: "Incoming Orders",
      ocid: "nav.incoming.link",
    },
    { to: "/operator/walkin", label: "Walk-in Order", ocid: "nav.walkin.link" },
    { to: "/operator/profile", label: "My Profile", ocid: "nav.profile.link" },
    {
      to: "/operator/analytics",
      label: "Analytics",
      ocid: "nav.analytics.link",
    },
  ],
  [AppUserRole.admin]: [
    { to: "/admin/approvals", label: "Approvals", ocid: "nav.approvals.link" },
    { to: "/admin/orders", label: "Orders", ocid: "nav.orders.link" },
    { to: "/admin/products", label: "Catalogue", ocid: "nav.catalogue.link" },
    { to: "/admin/locations", label: "Locations", ocid: "nav.locations.link" },
    {
      to: "/admin/analytics",
      label: "Analytics",
      ocid: "nav.analytics.link",
    },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  [AppUserRole.customer]: "Customer",
  [AppUserRole.shopper]: "Shopper",
  [AppUserRole.driver]: "Driver",
  [AppUserRole.operator]: "Operator",
  [AppUserRole.admin]: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  [AppUserRole.customer]: "bg-blue-100 text-blue-800",
  [AppUserRole.shopper]: "bg-orange-100 text-orange-800",
  [AppUserRole.driver]: "bg-purple-100 text-purple-800",
  [AppUserRole.operator]: "bg-green-100 text-green-800",
  [AppUserRole.admin]: "bg-red-100 text-red-800",
};

export function AppHeader() {
  const { isAuthenticated, userRole, userProfile, logout, principalText } =
    useAuth();
  const { cartCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const navLinks = (userRole ? NAV_LINKS[userRole] : null) || [];
  // While pending approval, customers keep their shopping nav + a pending badge
  const isPendingApproval =
    userProfile?.registrationStatus === "pending" &&
    userRole !== AppUserRole.customer;
  const effectiveNavLinks = isPendingApproval
    ? (NAV_LINKS[AppUserRole.customer] ?? [])
    : navLinks;
  const displayName =
    userProfile?.displayName ||
    (principalText ? `${principalText.slice(0, 8)}…` : null);
  const roleBadgeClass = userRole
    ? (ROLE_COLORS[userRole] ?? "bg-gray-100 text-gray-800")
    : "";
  const roleLabel = userRole ? (ROLE_LABELS[userRole] ?? userRole) : "";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
            data-ocid="nav.home.link"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">
                TT
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-base text-foreground leading-none">
                Thuma Thina
              </span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Community Shopper
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {effectiveNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted/60 transition-colors"
                activeProps={{
                  className: "text-foreground font-medium bg-muted/60",
                }}
                data-ocid={link.ocid}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && userRole ? (
              <>
                {/* User info */}
                <div className="hidden sm:flex items-center gap-2">
                  {displayName && (
                    <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                      {displayName}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                      roleBadgeClass,
                    )}
                  >
                    {roleLabel}
                  </span>
                  {isPendingApproval && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-800">
                      Pending Approval
                    </span>
                  )}
                </div>

                {/* Notifications bell */}
                <NotificationsBell />

                {/* Cart for customers */}
                {userRole === AppUserRole.customer && (
                  <Link to="/cart" data-ocid="nav.cart.button">
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-9 w-9"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {cartCount > 0 && (
                        <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                          {cartCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigate({ to: "/" });
                    logout();
                  }}
                  title="Log out"
                  data-ocid="nav.logout.button"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/login" data-ocid="nav.login.link">
                <Button variant="outline" size="sm" className="text-sm">
                  Log In
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-ocid="nav.menu.toggle"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && navLinks.length > 0 && (
          <nav className="md:hidden border-t border-border/60 py-3 space-y-1">
            {effectiveNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/60"
                activeProps={{
                  className: "text-foreground font-medium bg-muted/60",
                }}
                data-ocid={link.ocid}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

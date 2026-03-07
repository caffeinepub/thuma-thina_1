import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { NotificationsBell } from "./NotificationsBell";
import { RoleSwitcher } from "./RoleSwitcher";

interface NavLink {
  to: string;
  label: string;
  ocid: string;
}

const NAV_LINKS: Record<string, NavLink[]> = {
  customer: [
    { to: "/catalogue", label: "Browse", ocid: "nav.catalogue.link" },
    { to: "/cart", label: "Cart", ocid: "nav.cart.link" },
    { to: "/my-orders", label: "My Orders", ocid: "nav.orders.link" },
    { to: "/wallet", label: "My Wallet", ocid: "nav.wallet.link" },
  ],
  shopper: [
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
      to: "/shopper/analytics",
      label: "Analytics",
      ocid: "nav.analytics.link",
    },
  ],
  driver: [
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
  operator: [
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
  admin: [
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
  guest: [],
};

export function AppHeader() {
  const { demoRole, cartCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = NAV_LINKS[demoRole] || [];

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
            {navLinks.map((link) => (
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
            <RoleSwitcher />

            {demoRole !== "guest" && <NotificationsBell />}

            {demoRole === "customer" && (
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

            {/* Mobile menu */}
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
            {navLinks.map((link) => (
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

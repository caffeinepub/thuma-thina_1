import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Package, PackageX, Store } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useActor } from "../../hooks/useActor";

export function ShopperStockPage() {
  const {
    staffUsers,
    listings,
    setListings,
    retailerProducts,
    setRetailerProducts,
    retailers,
    products,
    businessAreas,
  } = useApp();
  const { actor } = useActor();
  const { principalText } = useAuth();

  // Get the current shopper's staff profile by principal text
  const shopperProfile = useMemo(
    () => staffUsers.find((u) => u.id === principalText),
    [staffUsers, principalText],
  );

  const shopperAreaId = shopperProfile?.businessAreaId;
  const assignedRetailerIds = shopperProfile?.assignedRetailerIds ?? [];
  const isDedicatedShopper = assignedRetailerIds.length > 0;

  // Retailers that have dedicated shoppers assigned (excluding this one if applicable)
  const dedicatedRetailerIds = useMemo(() => {
    return new Set(
      staffUsers
        .filter(
          (u) =>
            u.role === "shopper" &&
            u.assignedRetailerIds &&
            u.assignedRetailerIds.length > 0,
        )
        .flatMap((u) => u.assignedRetailerIds ?? []),
    );
  }, [staffUsers]);

  // Determine which retailers this shopper can manage stock for
  const scopedRetailers = useMemo(() => {
    if (isDedicatedShopper) {
      // Only their assigned retailers
      return retailers.filter((r) => assignedRetailerIds.includes(r.id));
    }
    // General shopper: retailers in their area, excluding dedicated-shopper retailers
    return retailers.filter(
      (r) =>
        r.businessAreaId === shopperAreaId && !dedicatedRetailerIds.has(r.id),
    );
  }, [
    isDedicatedShopper,
    retailers,
    assignedRetailerIds,
    shopperAreaId,
    dedicatedRetailerIds,
  ]);

  const scopedRetailerIds = useMemo(
    () => new Set(scopedRetailers.map((r) => r.id)),
    [scopedRetailers],
  );

  // Universal listings for scoped retailers
  const scopedListings = useMemo(
    () => listings.filter((l) => scopedRetailerIds.has(l.retailerId)),
    [listings, scopedRetailerIds],
  );

  // Retailer-exclusive products for scoped retailers
  const scopedRetailerProducts = useMemo(
    () => retailerProducts.filter((p) => scopedRetailerIds.has(p.retailerId)),
    [retailerProducts, scopedRetailerIds],
  );

  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name ?? productId;

  const getArea = (retailer: (typeof retailers)[0]) =>
    businessAreas.find((a) => a.id === retailer.businessAreaId);

  const toggleListingStock = async (listingId: string, currentOOS: boolean) => {
    try {
      if (actor) await actor.setListingStock(listingId, !currentOOS);
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, outOfStock: !currentOOS } : l,
        ),
      );
      toast.success(
        currentOOS ? "Marked back in stock" : "Marked out of stock",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  const toggleRetailerProductStock = async (
    rpId: string,
    currentInStock: boolean,
  ) => {
    try {
      if (actor) await actor.setRetailerProductStock(rpId, !currentInStock);
      setRetailerProducts((prev) =>
        prev.map((p) =>
          p.id === rpId ? { ...p, inStock: !currentInStock } : p,
        ),
      );
      toast.success(
        currentInStock ? "Marked out of stock" : "Marked back in stock",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  const scopeDescription = isDedicatedShopper
    ? `Showing stock for your assigned retailer${assignedRetailerIds.length !== 1 ? "s" : ""}: ${scopedRetailers.map((r) => r.name).join(", ")}`
    : shopperAreaId
      ? `Showing stock for retailers in your area (${businessAreas.find((a) => a.id === shopperAreaId)?.name ?? shopperAreaId}). Dedicated-retailer stock is managed by assigned shoppers only.`
      : "No area assigned. Contact your admin.";

  if (scopedRetailers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-2">
          Stock Management
        </h1>
        <div
          className="text-center py-16"
          data-ocid="shopper.stock.empty_state"
        >
          <PackageX className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-semibold text-lg mb-1">
            No retailers in scope
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {shopperAreaId
              ? "All retailers in your area have dedicated shoppers assigned."
              : "You are not assigned to a business area yet. Contact your admin."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">
          Stock Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Mark items in or out of stock based on what you see in store
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 mb-5"
        data-ocid="shopper.stock.panel"
      >
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {scopeDescription}
        </p>
      </div>

      {/* Per-retailer groups */}
      <div className="space-y-6">
        {scopedRetailers.map((retailer, ri) => {
          const area = getArea(retailer);
          const retailerListings = scopedListings.filter(
            (l) => l.retailerId === retailer.id,
          );
          const retailerRPs = scopedRetailerProducts.filter(
            (p) => p.retailerId === retailer.id,
          );

          if (retailerListings.length === 0 && retailerRPs.length === 0) {
            return null;
          }

          return (
            <Card
              key={retailer.id}
              className="card-glow border-border/60"
              data-ocid={`shopper.stock.item.${ri + 1}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  {retailer.name}
                  {area && (
                    <span className="text-xs font-normal text-muted-foreground">
                      · {area.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {/* Universal listings */}
                {retailerListings.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Universal Listings
                    </p>
                    {retailerListings.map((listing, li) => {
                      const isOOS = !!listing.outOfStock;
                      return (
                        <div
                          key={listing.id}
                          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
                          data-ocid={`shopper.listing.item.${li + 1}`}
                        >
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {getProductName(listing.productId)}
                            </p>
                            <p className="text-xs text-primary font-bold">
                              R{listing.price.toFixed(2)}
                            </p>
                          </div>
                          <Badge
                            variant={isOOS ? "secondary" : "outline"}
                            className={`text-[10px] shrink-0 ${isOOS ? "text-red-600 border-red-200" : "text-green-700 border-green-300"}`}
                          >
                            {isOOS ? "Out of Stock" : "In Stock"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleListingStock(listing.id, isOOS)
                            }
                            className={`h-7 text-xs shrink-0 ${isOOS ? "text-green-600 border-green-200 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"}`}
                            data-ocid={`shopper.listing.toggle.${li + 1}`}
                          >
                            {isOOS ? "Mark In Stock" : "Mark OOS"}
                          </Button>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Retailer-exclusive products (only for dedicated shoppers) */}
                {isDedicatedShopper && retailerRPs.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-3">
                      Exclusive Products
                    </p>
                    {retailerRPs.map((rp, rpi) => {
                      const inStock = rp.inStock;
                      return (
                        <div
                          key={rp.id}
                          className="flex items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-50/30 px-3 py-2.5"
                          data-ocid={`shopper.exclusive.item.${rpi + 1}`}
                        >
                          <div className="w-8 h-8 rounded-md bg-amber-100/60 flex items-center justify-center text-base shrink-0 overflow-hidden">
                            {rp.images?.[0] ? (
                              <img
                                src={rp.images[0]}
                                alt={rp.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              rp.imageEmoji
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {rp.name}
                            </p>
                            <p className="text-xs text-primary font-bold">
                              R{rp.price.toFixed(2)}
                            </p>
                          </div>
                          <Badge
                            variant={!inStock ? "secondary" : "outline"}
                            className={`text-[10px] shrink-0 ${!inStock ? "text-red-600 border-red-200" : "text-green-700 border-green-300"}`}
                          >
                            {!inStock ? "Out of Stock" : "In Stock"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleRetailerProductStock(rp.id, inStock)
                            }
                            className={`h-7 text-xs shrink-0 ${inStock ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                            data-ocid={`shopper.exclusive.toggle.${rpi + 1}`}
                          >
                            {inStock ? "Mark OOS" : "Mark In Stock"}
                          </Button>
                        </div>
                      );
                    })}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

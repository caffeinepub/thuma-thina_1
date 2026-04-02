import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MapPin, ShoppingBag, Store, Zap } from "lucide-react";
import { LikeDislikeBar } from "../../components/LikeDislikeBar";
import { ReviewsSection } from "../../components/ReviewsSection";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export function ListingDetailPage() {
  const { listingId } = useParams({ strict: false }) as { listingId: string };
  const {
    listings,
    products,
    retailers,
    towns,
    addToCartWithListing,
    addSpecialToCart,
    cart,
  } = useApp();
  const { isAuthenticated } = useAuth();

  // Handle special_ prefix for special products
  const isSpecialLink = listingId?.startsWith("special_");
  const resolvedId = isSpecialLink
    ? listingId.replace("special_", "")
    : listingId;

  const listing = isSpecialLink
    ? null
    : listings.find((l) => l.id === resolvedId);
  const product = isSpecialLink
    ? products.find((p) => p.id === resolvedId)
    : products.find((p) => p.id === listing?.productId);
  const retailer = listing
    ? retailers.find((r) => r.id === listing.retailerId)
    : null;
  const town = retailer ? towns.find((t) => t.id === retailer.townId) : null;

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h1 className="font-display text-2xl font-bold mb-2">
          Listing not found
        </h1>
        <p className="text-muted-foreground mb-6">
          This product listing may have been removed or the link is invalid.
        </p>
        <Link to="/catalogue">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  const alreadyInCart = cart.some((ci) => ci.productId === product.id);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = "#/login";
      return;
    }
    if (product.isSpecial) {
      addSpecialToCart(
        product.id,
        listing?.id ?? "",
        retailer?.id ?? "",
        product.serviceFee ?? 20,
        `${Date.now()}`,
      );
    } else if (listing) {
      addToCartWithListing(
        product.id,
        listing.id,
        retailer?.id ?? "",
        listing.price,
      );
    }
  };

  // Use product.id or listing.id as target for reviews/likes
  const reviewTargetId = listing?.id ?? product.id;
  const reviewTargetType = listing ? "listing" : "product";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4">
        <Link to="/catalogue">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2"
            data-ocid="listing.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalogue
          </Button>
        </Link>
      </div>

      <Card className="card-glow overflow-hidden">
        {/* Product image */}
        <div
          className={`flex items-center justify-center h-48 sm:h-64 text-6xl ${
            product.isSpecial
              ? "bg-yellow-50 dark:bg-yellow-950/20"
              : "bg-muted/40"
          }`}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain bg-white"
            />
          ) : (
            <span>
              {product.isSpecial ? "⚡" : ((product as any).imageEmoji ?? "📦")}
            </span>
          )}
        </div>

        <CardContent className="p-5 sm:p-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {product.isSpecial && (
              <Badge className="gap-1 bg-yellow-500/90 text-yellow-950 border-0">
                <Zap className="h-3 w-3" />
                Special Service
              </Badge>
            )}
            {product.category && (
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>

          <h1 className="font-display text-2xl font-bold mb-1">
            {product.name}
          </h1>
          {product.description && (
            <p className="text-muted-foreground text-sm mb-4">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-4">
            {product.isSpecial ? (
              <div>
                <span className="font-display font-bold text-yellow-700 dark:text-yellow-400 text-2xl">
                  R{(product.serviceFee ?? 20).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  service fee
                </span>
              </div>
            ) : listing ? (
              <div>
                <span className="font-display font-bold text-primary text-2xl">
                  R{listing.price.toFixed(2)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Like/Dislike bar */}
          <div className="mb-4">
            <LikeDislikeBar
              targetId={reviewTargetId}
              targetType={reviewTargetType}
            />
          </div>

          <Separator className="mb-4" />

          {/* Retailer info */}
          {retailer && (
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{retailer.name}</span>
              </div>
              {town && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{town.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Add to cart button */}
          {product.inStock ? (
            <Button
              onClick={handleAddToCart}
              className={`w-full gap-2 h-11 font-semibold ${
                product.isSpecial
                  ? "bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                  : ""
              }`}
              data-ocid="listing.add_to_cart.primary_button"
            >
              {product.isSpecial ? (
                <>
                  <Zap className="h-4 w-4" />
                  {alreadyInCart ? "Add Another Meter" : "Order Service"}
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {alreadyInCart ? "Already in Cart" : "Add to Cart"}
                </>
              )}
            </Button>
          ) : (
            <Badge variant="secondary" className="w-full justify-center py-2">
              Out of Stock
            </Badge>
          )}

          {/* Reviews section */}
          <ReviewsSection
            targetId={reviewTargetId}
            targetType={reviewTargetType}
            completedOrderId={null}
          />
        </CardContent>
      </Card>
    </div>
  );
}

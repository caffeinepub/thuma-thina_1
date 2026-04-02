import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, ShieldCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageUpload } from "../../components/ImageUpload";
import { useApp } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";

interface Review {
  id: string;
  targetId: string;
  targetType: string;
  reviewerId: string;
  rating: number;
  comment: string;
  orderId: string;
  createdAt: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export function OperatorProfilePage() {
  const { currentUser, staffUsers, setStaffUsers, pickupPoints } = useApp();
  const { actor } = useActor();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const staffUser = staffUsers.find((u) => u.id === currentUser?.id);
  const myPickupPoint = pickupPoints.find(
    (pp) => pp.id === staffUser?.pickupPointId,
  );

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
            targetType: r.targetType,
            reviewerId:
              typeof r.reviewerId === "object"
                ? r.reviewerId.toString()
                : String(r.reviewerId),
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

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const handleImageChange = (urls: string[]) => {
    if (!currentUser) return;
    setStaffUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, profileImageUrl: urls[0] || undefined }
          : u,
      ),
    );
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OP";

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold mb-1">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your operator identity — a profile photo helps customers trust their
          pick-up point
        </p>
      </div>

      {/* Profile card */}
      <Card className="card-glow">
        <CardContent className="flex flex-col items-center pt-8 pb-6 gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
              <AvatarImage
                src={staffUser?.profileImageUrl}
                alt={currentUser?.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {staffUser?.profileImageUrl && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="font-display font-bold text-lg">
              {currentUser?.name}
            </h2>
            <div className="flex items-center gap-1.5 justify-center text-sm text-muted-foreground mt-0.5">
              <span className="text-base">📦</span>
              <span>Pick-up Point Operator</span>
            </div>
            {myPickupPoint && (
              <div className="flex items-center gap-1 justify-center text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>{myPickupPoint.name}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {currentUser?.phone}
            </p>
            {reviews.length > 0 && (
              <div className="mt-2 flex items-center gap-2 justify-center">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-xs text-muted-foreground">
                  {avgRating.toFixed(1)} ({reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>

          {!staffUser?.profileImageUrl && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <Camera className="h-3.5 w-3.5 shrink-0" />
              <span>
                Add a profile photo so customers can identify you at the pick-up
                point
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload section */}
      <Card className="card-glow">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your photo is displayed to customers who visit your pick-up point.
            This builds trust and prevents fraud.
          </p>
          <ImageUpload
            value={
              staffUser?.profileImageUrl ? [staffUser.profileImageUrl] : []
            }
            onChange={handleImageChange}
            maxImages={1}
            label="Profile Picture"
          />
          {staffUser?.profileImageUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-destructive hover:text-destructive"
              onClick={() => handleImageChange([])}
              data-ocid="operator.profile.delete_button"
            >
              Remove photo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* My Reviews */}
      <Card className="card-glow">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            My Reviews
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
              className="text-center py-6 text-sm text-muted-foreground"
              data-ocid="operator.reviews.loading_state"
            >
              Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="operator.reviews.empty_state"
            >
              <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No reviews yet — serve customers to receive ratings
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border/50 p-3"
                  data-ocid={`operator.review.item.${i + 1}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} />
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
    </div>
  );
}

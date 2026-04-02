import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";

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

interface ReviewsSectionProps {
  targetId: string;
  targetType: string;
  completedOrderId: string | null;
}

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer"
          }`}
          aria-label={`${star} star`}
        >
          <Star
            className={`h-4 w-4 ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({
  targetId,
  targetType,
  completedOrderId,
}: ReviewsSectionProps) {
  const { actor } = useActor();
  const { isAuthenticated, principalText } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    if (!actor) return;
    try {
      const result = await (actor as any).getReviewsForTarget(targetId);
      setReviews(result as Review[]);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getReviewsForTarget(targetId)
      .then((result) => {
        setReviews(result as Review[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, targetId]);

  // Check if user already reviewed for this order+target
  const alreadyReviewed =
    completedOrderId != null &&
    reviews.some(
      (r) => r.reviewerId === principalText && r.orderId === completedOrderId,
    );

  const canReview =
    isAuthenticated && completedOrderId != null && !alreadyReviewed;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length
      : 0;

  const handleSubmit = async () => {
    if (!actor || !completedOrderId) return;
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      await (actor as any).addReview(
        crypto.randomUUID(),
        targetId,
        targetType,
        rating,
        comment,
        completedOrderId,
      );
      toast.success("Review submitted");
      setRating(0);
      setComment("");
      await fetchReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: number) => {
    const ms = ts;
    return new Date(ms).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-6" data-ocid="reviews.section">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-display font-semibold text-base">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <StarRating value={Math.round(avgRating)} readonly />
            <span className="text-sm text-muted-foreground">
              {avgRating.toFixed(1)} ({reviews.length})
            </span>
          </div>
        )}
      </div>

      {/* Write review form */}
      {canReview && (
        <div
          className="rounded-lg border border-border/60 bg-muted/20 p-4 mb-5"
          data-ocid="reviews.form"
        >
          <p className="text-sm font-medium mb-3">Write a Review</p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea
            placeholder="Share your experience (optional)…"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-3 resize-none text-sm"
            data-ocid="reviews.comment.textarea"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            data-ocid="reviews.submit.submit_button"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div
          className="flex items-center justify-center py-6"
          data-ocid="reviews.loading_state"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6" data-ocid="reviews.empty_state">
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div key={review.id} data-ocid={`reviews.item.${idx + 1}`}>
              {idx > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {review.reviewerId.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {review.reviewerId === principalText ? "You" : "Customer"}
                    </span>
                    <StarRating value={Number(review.rating)} readonly />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

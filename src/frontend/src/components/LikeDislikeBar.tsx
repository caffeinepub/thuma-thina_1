import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";

interface LikeEntry {
  targetId: string;
  targetType: string;
  userId: string;
  isLike: boolean;
}

interface LikeDislikeBarProps {
  targetId: string;
  targetType: string;
}

export function LikeDislikeBar({ targetId, targetType }: LikeDislikeBarProps) {
  const { actor } = useActor();
  const { isAuthenticated, principalText } = useAuth();
  const [entries, setEntries] = useState<LikeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getLikesDislikesForTarget(targetId)
      .then((result) => setEntries(result as LikeEntry[]))
      .catch(() => {
        /* noop */
      });
  }, [actor, targetId]);

  const fetchEntries = async () => {
    if (!actor) return;
    try {
      const result = await (actor as any).getLikesDislikesForTarget(targetId);
      setEntries(result as LikeEntry[]);
    } catch {
      /* noop */
    }
  };

  const likes = entries.filter((e) => e.isLike).length;
  const dislikes = entries.filter((e) => !e.isLike).length;
  const myVote = entries.find((e) => e.userId === principalText);

  const handleVote = async (isLike: boolean) => {
    if (!actor || !isAuthenticated) {
      toast.error("Please log in to vote");
      return;
    }
    setLoading(true);
    try {
      await (actor as any).setLikeDislike(targetId, targetType, isLike);
      await fetchEntries();
    } catch {
      toast.error("Failed to record vote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3" data-ocid="likes.section">
      <Button
        variant={myVote?.isLike === true ? "default" : "outline"}
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => handleVote(true)}
        disabled={loading || !isAuthenticated}
        data-ocid="likes.thumbs_up.button"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{likes}</span>
      </Button>
      <Button
        variant={myVote?.isLike === false ? "default" : "outline"}
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => handleVote(false)}
        disabled={loading || !isAuthenticated}
        data-ocid="likes.thumbs_down.button"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Copy,
  Facebook,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

interface Article {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  imagesJson: string | null;
  authorPrincipal: string;
  createdAt: number;
  published: boolean;
}

interface ArticleCategory {
  id: string;
  name: string;
}

interface ArticleLikes {
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
}

interface ArticleComment {
  id: string;
  text: string;
  author: string;
  date: string;
}

function getLikesKey(articleId: string) {
  return `tt_article_likes_${articleId}`;
}

function getCommentsKey(articleId: string) {
  return `tt_article_comments_${articleId}`;
}

function loadLikes(articleId: string): ArticleLikes {
  try {
    const raw = localStorage.getItem(getLikesKey(articleId));
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return { likes: 0, dislikes: 0, userVote: null };
}

function saveLikes(articleId: string, data: ArticleLikes) {
  localStorage.setItem(getLikesKey(articleId), JSON.stringify(data));
}

function loadComments(articleId: string): ArticleComment[] {
  try {
    const raw = localStorage.getItem(getCommentsKey(articleId));
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return [];
}

function saveComments(articleId: string, data: ArticleComment[]) {
  localStorage.setItem(getCommentsKey(articleId), JSON.stringify(data));
}

export function ArticleDetailPage() {
  const { articleId } = useParams({ strict: false }) as { articleId: string };
  const { actor } = useActor();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Likes/dislikes
  const [likesData, setLikesData] = useState<ArticleLikes>({
    likes: 0,
    dislikes: 0,
    userVote: null,
  });

  // Comments
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Copy link state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      (actor as any).getArticles().catch(() => []),
      (actor as any).getArticleCategories().catch(() => []),
    ]).then(([arts, cats]) => {
      const found = (arts as Article[]).find((a) => a.id === articleId);
      if (!found || !found.published) {
        setNotFound(true);
      } else {
        setArticle(found);
      }
      setCategories(cats as ArticleCategory[]);
      setLoading(false);
    });
  }, [actor, articleId]);

  // Load likes and comments from localStorage when articleId is available
  useEffect(() => {
    if (!articleId) return;
    setLikesData(loadLikes(articleId));
    setComments(loadComments(articleId));
  }, [articleId]);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "General";

  const formatDate = (ts: number) => {
    // ICP Time.now() returns nanoseconds; convert to milliseconds for JS Date
    const ms = ts > 1e12 ? Math.floor(ts / 1_000_000) : ts;
    return new Date(ms).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleVote = (vote: "like" | "dislike") => {
    setLikesData((prev) => {
      let next: ArticleLikes;
      if (prev.userVote === vote) {
        // Toggle off
        next = {
          likes: vote === "like" ? prev.likes - 1 : prev.likes,
          dislikes: vote === "dislike" ? prev.dislikes - 1 : prev.dislikes,
          userVote: null,
        };
      } else {
        // Switch or set
        next = {
          likes:
            vote === "like"
              ? prev.likes + 1
              : prev.userVote === "like"
                ? prev.likes - 1
                : prev.likes,
          dislikes:
            vote === "dislike"
              ? prev.dislikes + 1
              : prev.userVote === "dislike"
                ? prev.dislikes - 1
                : prev.dislikes,
          userVote: vote,
        };
      }
      saveLikes(articleId, next);
      return next;
    });
  };

  const handleSubmitComment = () => {
    if (!newCommentText.trim()) {
      toast.error("Please write a comment before submitting.");
      return;
    }
    setSubmittingComment(true);
    const newComment: ArticleComment = {
      id: `c_${Date.now()}`,
      text: newCommentText.trim(),
      author: newCommentAuthor.trim() || "Anonymous",
      date: new Date().toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    saveComments(articleId, updated);
    setNewCommentText("");
    setNewCommentAuthor("");
    setSubmittingComment(false);
    toast.success("Comment added!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(article?.title ?? "Thuma Thina");

  const socialLinks = [
    {
      label: "WhatsApp",
      icon: <SiWhatsapp className="h-4 w-4" />,
      href: `https://wa.me/?text=Check+out+this+article:+${shareUrl}`,
      className: "bg-[#25D366] hover:bg-[#1da851] text-white border-0",
    },
    {
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      className: "bg-[#1877F2] hover:bg-[#1565d8] text-white border-0",
    },
    {
      label: "X / Twitter",
      icon: <Twitter className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
      className:
        "bg-foreground hover:bg-foreground/80 text-background border-0",
    },
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-5 w-24 mb-6" />
        <Skeleton className="h-48 w-full mb-6 rounded-xl" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/3 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold mb-2">
          Article not found
        </h1>
        <p className="text-muted-foreground mb-6">
          This article may have been removed or the link is invalid.
        </p>
        <Link to="/news">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Button>
        </Link>
      </div>
    );
  }

  let images: string[] = [];
  try {
    const parsed = JSON.parse(article.imagesJson ?? "[]");
    if (Array.isArray(parsed)) images = parsed;
  } catch {
    /* noop */
  }

  const paragraphs = article.body.split("\n").filter((p) => p.trim());

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
      data-ocid="article.page"
    >
      <div className="mb-6">
        <Link to="/news">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2"
            data-ocid="article.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Button>
        </Link>
      </div>

      {/* Hero image */}
      {images.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-6 h-56 sm:h-72 bg-muted/40">
          <img
            src={images[0]}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Badge variant="secondary">{getCategoryName(article.categoryId)}</Badge>
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(article.createdAt)}
        </span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-4 leading-tight">
        {article.title}
      </h1>

      {/* ── Share Buttons ── */}
      <div
        className="flex flex-wrap items-center gap-2 mb-6"
        data-ocid="article.share.panel"
      >
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
          <Share2 className="h-3.5 w-3.5" />
          Share:
        </span>
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid={"article.share.button"}
          >
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 text-xs font-medium ${s.className}`}
            >
              {s.icon}
              {s.label}
            </Button>
          </a>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleCopyLink}
          data-ocid="article.copy_link.button"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>

      {/* ── Likes / Dislikes ── */}
      <div
        className="flex items-center gap-3 mb-6"
        data-ocid="article.likes.panel"
      >
        <Button
          variant={likesData.userVote === "like" ? "default" : "outline"}
          size="sm"
          className={`h-9 gap-2 font-medium ${
            likesData.userVote === "like"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleVote("like")}
          data-ocid="article.like.toggle"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{likesData.likes}</span>
        </Button>
        <Button
          variant={likesData.userVote === "dislike" ? "destructive" : "outline"}
          size="sm"
          className={`h-9 gap-2 font-medium ${
            likesData.userVote === "dislike"
              ? ""
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleVote("dislike")}
          data-ocid="article.dislike.toggle"
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{likesData.dislikes}</span>
        </Button>
        <span className="text-xs text-muted-foreground ml-1">
          {likesData.likes + likesData.dislikes > 0
            ? `${likesData.likes + likesData.dislikes} reaction${
                likesData.likes + likesData.dislikes !== 1 ? "s" : ""
              }`
            : "Be the first to react"}
        </span>
      </div>

      <Separator className="mb-6" />

      {/* Body */}
      <div className="prose prose-sm max-w-none text-foreground space-y-4">
        {paragraphs.map((para) => (
          <p
            key={para.slice(0, 30)}
            className="text-base leading-relaxed text-foreground/90"
          >
            {para}
          </p>
        ))}
      </div>

      {/* Extra images */}
      {images.length > 1 && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {images.slice(1).map((img) => (
            <div
              key={img.slice(0, 40)}
              className="rounded-lg overflow-hidden h-40 bg-muted/40"
            >
              <img
                src={img}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <Separator className="mt-10 mb-8" />

      {/* ── Comments Section ── */}
      <section data-ocid="article.comments.panel">
        <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Comments
          {comments.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-1">
              {comments.length}
            </Badge>
          )}
        </h2>

        {/* Add comment form */}
        <Card className="mb-6 border-border/60">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Your name (optional)"
              value={newCommentAuthor}
              onChange={(e) => setNewCommentAuthor(e.target.value)}
              className="h-9 text-sm"
              data-ocid="article.comment_author.input"
            />
            <Textarea
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="resize-none text-sm min-h-[80px]"
              data-ocid="article.comment.textarea"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={submittingComment || !newCommentText.trim()}
                className="gap-1.5"
                data-ocid="article.comment.submit_button"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Post Comment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments list */}
        {comments.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground/60"
            data-ocid="article.comments.empty_state"
          >
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment, i) => (
              <Card
                key={comment.id}
                className="border-border/40 bg-muted/20"
                data-ocid={`article.comment.item.${i + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">
                      {comment.author}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.date}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {comment.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

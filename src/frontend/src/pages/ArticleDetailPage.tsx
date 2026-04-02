import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
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

export function ArticleDetailPage() {
  const { articleId } = useParams({ strict: false }) as { articleId: string };
  const { actor } = useActor();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "General";

  const formatDate = (ts: number) => {
    const ms = ts;
    return new Date(ms).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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

      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 leading-tight">
        {article.title}
      </h1>

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
    </div>
  );
}

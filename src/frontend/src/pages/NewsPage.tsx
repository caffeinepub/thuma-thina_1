import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { BookOpen, Calendar, ChevronRight, Newspaper } from "lucide-react";
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

export function NewsPage() {
  const { actor } = useActor();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    setLoading(true);
    Promise.all([
      (actor as any).getArticles().catch(() => []),
      (actor as any).getArticleCategories().catch(() => []),
    ]).then(([arts, cats]) => {
      setArticles((arts as Article[]).filter((a) => a.published));
      setCategories(cats as ArticleCategory[]);
      setLoading(false);
    });
  }, [actor]);

  const filtered =
    activeCategory === "all"
      ? articles
      : articles.filter((a) => a.categoryId === activeCategory);

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8" data-ocid="news.page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              News &amp; Updates
            </h1>
            <p className="text-sm text-muted-foreground">
              Stay informed about Thuma Thina, promotions, and community news
            </p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6" data-ocid="news.filter.tab">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
          className="rounded-full text-xs h-8"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="rounded-full text-xs h-8"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16" data-ocid="news.empty_state">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-display text-lg font-semibold mb-1">
            No articles yet
          </h3>
          <p className="text-muted-foreground text-sm">
            Check back soon for news, promotions, and community updates.
          </p>
        </div>
      )}

      {/* Articles grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, idx) => {
            let heroImage: string | null = null;
            try {
              const imgs = JSON.parse(article.imagesJson ?? "[]");
              if (Array.isArray(imgs) && imgs.length > 0) heroImage = imgs[0];
            } catch {
              /* noop */
            }

            return (
              <Card
                key={article.id}
                className="overflow-hidden hover:shadow-md transition-shadow group"
                data-ocid={`news.item.${idx + 1}`}
              >
                {/* Hero image */}
                <div className="h-36 overflow-hidden bg-muted/40 flex items-center justify-center">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Newspaper className="h-10 w-10 text-muted-foreground/20" />
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {getCategoryName(article.categoryId)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(article.createdAt)}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base leading-snug mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {article.body.slice(0, 150)}
                    {article.body.length > 150 ? "…" : ""}
                  </p>

                  <Link
                    to="/news/$articleId"
                    params={{ articleId: article.id }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-primary hover:text-primary/80 -ml-2 h-8 text-xs"
                      data-ocid={`news.read_more.button.${idx + 1}`}
                    >
                      Read More
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { ImageUpload } from "@/components/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Newspaper, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

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

interface ArticleForm {
  title: string;
  body: string;
  categoryId: string;
  images: string[];
  published: boolean;
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  body: "",
  categoryId: "",
  images: [],
  published: false,
};

export function AdminNewsPage() {
  const { actor } = useActor();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Article form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);

  // Category form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const fetchData = async () => {
    if (!actor) return;
    const [arts, cats] = await Promise.all([
      (actor as any).getArticles().catch(() => []),
      (actor as any).getArticleCategories().catch(() => []),
    ]);
    setArticles(arts as Article[]);
    setCategories(cats as ArticleCategory[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!actor) return;
    setLoading(true);
    Promise.all([
      (actor as any).getArticles().catch(() => []),
      (actor as any).getArticleCategories().catch(() => []),
    ]).then(([arts, cats]) => {
      setArticles(arts as Article[]);
      setCategories(cats as ArticleCategory[]);
      setLoading(false);
    });
  }, [actor]);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  const formatDate = (ts: number) => {
    const ms = ts;
    return new Date(ms).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    let imgs: string[] = [];
    try {
      const p = JSON.parse(article.imagesJson ?? "[]");
      if (Array.isArray(p)) imgs = p;
    } catch {
      /* noop */
    }
    setEditingId(article.id);
    setForm({
      title: article.title,
      body: article.body,
      categoryId: article.categoryId,
      images: imgs,
      published: article.published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!actor) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const imagesJson =
        form.images.length > 0 ? JSON.stringify(form.images) : null;
      const id = editingId ?? crypto.randomUUID();
      if (editingId) {
        await (actor as any).updateArticle(
          id,
          form.title,
          form.body,
          form.categoryId,
          imagesJson,
          form.published,
        );
        toast.success("Article updated");
      } else {
        await (actor as any).addArticle(
          id,
          form.title,
          form.body,
          form.categoryId,
          imagesJson,
          form.published,
        );
        toast.success("Article created");
      }
      setDialogOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    if (!confirm("Delete this article? This cannot be undone.")) return;
    try {
      await (actor as any).deleteArticle(id);
      toast.success("Article deleted");
      await fetchData();
    } catch {
      toast.error("Failed to delete article");
    }
  };

  const handleTogglePublished = async (article: Article) => {
    if (!actor) return;
    try {
      let imgs: string[] = [];
      try {
        const p = JSON.parse(article.imagesJson ?? "[]");
        if (Array.isArray(p)) imgs = p;
      } catch {
        /* noop */
      }
      await (actor as any).updateArticle(
        article.id,
        article.title,
        article.body,
        article.categoryId,
        imgs.length > 0 ? JSON.stringify(imgs) : null,
        !article.published,
      );
      toast.success(article.published ? "Unpublished" : "Published");
      await fetchData();
    } catch {
      toast.error("Failed to update article");
    }
  };

  const handleAddCategory = async () => {
    if (!actor || !newCategoryName.trim()) return;
    setSavingCat(true);
    try {
      await (actor as any).addArticleCategory(
        crypto.randomUUID(),
        newCategoryName.trim(),
      );
      toast.success("Category added");
      setNewCategoryName("");
      await fetchData();
    } catch {
      toast.error("Failed to add category");
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8"
      data-ocid="admin.news.page"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Newspaper className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">News Management</h1>
          <p className="text-sm text-muted-foreground">
            Publish articles, promotions, and community updates
          </p>
        </div>
      </div>

      <Tabs defaultValue="articles">
        <TabsList className="mb-4">
          <TabsTrigger value="articles" data-ocid="admin.news.articles.tab">
            Articles
          </TabsTrigger>
          <TabsTrigger value="categories" data-ocid="admin.news.categories.tab">
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Articles tab */}
        <TabsContent value="articles">
          <div className="flex justify-end mb-4">
            <Button
              onClick={openNew}
              className="gap-2"
              data-ocid="admin.news.add.primary_button"
            >
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          </div>

          {loading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="admin.news.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.news.empty_state"
            >
              <Newspaper className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                No articles yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article, idx) => (
                    <TableRow
                      key={article.id}
                      data-ocid={`admin.news.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {article.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryName(article.categoryId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={article.published ? "default" : "outline"}
                          className="text-xs"
                        >
                          {article.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(article.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleTogglePublished(article)}
                            data-ocid={`admin.news.toggle.${idx + 1}`}
                          >
                            {article.published ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(article)}
                            data-ocid={`admin.news.edit_button.${idx + 1}`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(article.id)}
                            data-ocid={`admin.news.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Categories tab */}
        <TabsContent value="categories">
          <div className="max-w-md">
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="New category name…"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                data-ocid="admin.news.category.input"
              />
              <Button
                onClick={handleAddCategory}
                disabled={savingCat || !newCategoryName.trim()}
                className="gap-2 shrink-0"
                data-ocid="admin.news.category.submit_button"
              >
                {savingCat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </div>

            {categories.length === 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="admin.news.categories.empty_state"
              >
                No categories yet.
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 bg-muted/20"
                    data-ocid={`admin.news.category.item.${idx + 1}`}
                  >
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Article dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-lg max-h-[85vh] overflow-y-auto"
          data-ocid="admin.news.article.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Article" : "New Article"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                placeholder="Article title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="admin.news.title.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="article-category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger
                  id="article-category"
                  data-ocid="admin.news.category.select"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="article-body">Body</Label>
              <Textarea
                id="article-body"
                placeholder="Write your article here…"
                rows={8}
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                className="resize-none"
                data-ocid="admin.news.body.textarea"
              />
            </div>

            <div className="space-y-1.5">
              <ImageUpload
                label="Images"
                value={form.images}
                onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))}
                maxImages={5}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Visible to all users when enabled
                </p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, published: v }))
                }
                data-ocid="admin.news.published.switch"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="admin.news.cancel.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              data-ocid="admin.news.save.submit_button"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {saving ? "Saving…" : "Save Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

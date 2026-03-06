import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { ProductCategory } from "../../data/mockData";

const CATEGORIES: ProductCategory[] = [
  "Groceries",
  "Household",
  "Fast Food",
  "Beverages",
  "Personal Care",
  "Baby & Kids",
];

export function SuggestProductPage() {
  const { setProducts, currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "" as ProductCategory | "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.name.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const newProduct = {
      id: `p_sug_${Date.now()}`,
      name: form.name,
      description: form.description,
      category: form.category as ProductCategory,
      imageEmoji: "💡",
      inStock: true,
      isSuggestion: true,
      suggestedBy: currentUser?.name || "Shopper",
      approved: false,
    };

    setProducts((prev) => [...prev, newProduct]);
    toast.success("Product suggestion submitted! Admin will review it.");
    setForm({
      name: "",
      description: "",
      category: "",
    });
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Suggest a Product</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Know a product customers would love? Suggest it for admin review.
          Admins will set pricing via listings once approved.
        </p>
      </div>

      <Card className="card-glow" data-ocid="shopper.suggest.modal">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-base">
            Product Suggestion
          </CardTitle>
          <CardDescription>
            Your suggestion will be reviewed by an admin before being added to
            the catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Product Name</Label>
              <Input
                id="pname"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Bokomo Weet-Bix (750g)"
                required
                data-ocid="shopper.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea
                id="pdesc"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Brief description of the product"
                rows={3}
                required
                data-ocid="shopper.description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger data-ocid="shopper.category.select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-ocid="shopper.suggest.submit_button"
            >
              {loading ? "Submitting…" : "Submit Suggestion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  List,
  Package,
  Plus,
  Search,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { useApp } from "../../context/AppContext";
import type {
  Product,
  ProductCategory,
  ProductListing,
} from "../../data/mockData";

const CATEGORIES: ProductCategory[] = [
  "Groceries",
  "Household",
  "Fast Food",
  "Beverages",
  "Personal Care",
  "Baby & Kids",
];

const EMOJIS: Record<ProductCategory, string> = {
  Groceries: "🌾",
  Household: "🏠",
  "Fast Food": "🍔",
  Beverages: "🥤",
  "Personal Care": "🧴",
  "Baby & Kids": "👶",
};

export function AdminProductsPage() {
  const { products, setProducts, listings, setListings, retailers } = useApp();
  const [search, setSearch] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [listingDialog, setListingDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "" as ProductCategory | "",
    imageEmoji: "📦",
    images: [] as string[],
  });
  const [listingForm, setListingForm] = useState({
    productId: "",
    retailerId: "",
    price: "",
  });

  const official = products.filter((p) => !p.isSuggestion);
  const suggestions = products.filter((p) => p.isSuggestion && !p.approved);

  const filteredOfficial = search
    ? official.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : official;

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = () => {
    if (!form.name.trim() || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    const newProduct: Product = {
      id: `p_${Date.now()}`,
      name: form.name,
      description: form.description,
      category: form.category as ProductCategory,
      imageEmoji: EMOJIS[form.category as ProductCategory] || "📦",
      images: form.images.length > 0 ? form.images : undefined,
      inStock: true,
    };
    setProducts((prev) => [newProduct, ...prev]);
    toast.success("Product added to catalogue");
    setAddDialog(false);
    setForm({
      name: "",
      description: "",
      category: "",
      imageEmoji: "📦",
      images: [],
    });
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product removed");
  };

  const handleApproveSuggestion = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, approved: true, isSuggestion: false } : p,
      ),
    );
    toast.success("Product suggestion approved and added to catalogue ✅");
  };

  const handleRejectSuggestion = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.error("Product suggestion rejected");
  };

  const handleAddListing = () => {
    if (
      !listingForm.productId ||
      !listingForm.retailerId ||
      !listingForm.price
    ) {
      toast.error("Please fill in all listing fields");
      return;
    }
    const newListing: ProductListing = {
      id: `l_${Date.now()}`,
      productId: listingForm.productId,
      retailerId: listingForm.retailerId,
      price: Number.parseFloat(listingForm.price),
    };
    setListings((prev) => [...prev, newListing]);
    toast.success("Listing added");
    setListingDialog(false);
    setListingForm({ productId: "", retailerId: "", price: "" });
  };

  const handleDeleteListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    toast.success("Listing removed");
  };

  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name || "Unknown";

  const getRetailerName = (retailerId: string) =>
    retailers.find((r) => r.id === retailerId)?.name || "Unknown";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Product Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Manage universal product list and retailer listings
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddDialog(true)}
          className="gap-1.5"
          data-ocid="admin.product.open_modal_button"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Product
        </Button>
      </div>

      <Tabs defaultValue="catalogue">
        <TabsList className="mb-4">
          <TabsTrigger value="catalogue" data-ocid="admin.catalogue.tab">
            <Package className="h-3.5 w-3.5 mr-1.5" />
            Catalogue ({official.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions" data-ocid="admin.suggestions.tab">
            Suggestions
            {suggestions.length > 0 && (
              <Badge className="ml-1.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center rounded-full">
                {suggestions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="listings" data-ocid="admin.listings.tab">
            <List className="h-3.5 w-3.5 mr-1.5" />
            Listings ({listings.length})
          </TabsTrigger>
        </TabsList>

        {/* Catalogue Tab */}
        <TabsContent value="catalogue">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
              data-ocid="admin.search_input"
            />
          </div>

          {filteredOfficial.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.catalogue.empty_state"
            >
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-display font-semibold">No products found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOfficial.map((product, i) => {
                const productListings = listings.filter(
                  (l) => l.productId === product.id,
                );
                return (
                  <Card
                    key={product.id}
                    className="card-glow border-border/60"
                    data-ocid={`admin.product.item.${i + 1}`}
                  >
                    <CardContent className="flex items-center p-3 gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <span className="text-2xl">{product.imageEmoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {product.name}
                          </p>
                          {!product.inStock && (
                            <Badge variant="secondary" className="text-[10px]">
                              Out of stock
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">
                            {product.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {productListings.length} listing
                            {productListings.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        data-ocid={`admin.product.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          {suggestions.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.suggestions.empty_state"
            >
              <p className="text-4xl mb-2">💡</p>
              <p className="font-display font-semibold">
                No pending suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((product, i) => (
                <Card
                  key={product.id}
                  className="card-glow border-border/60 border-l-4 border-l-yellow-400"
                  data-ocid={`admin.suggestion.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{product.imageEmoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">
                            {product.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-yellow-700 border-yellow-300"
                          >
                            Suggestion
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {product.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {product.suggestedBy}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApproveSuggestion(product.id)}
                          className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          data-ocid={`admin.suggestion.confirm_button.${i + 1}`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectSuggestion(product.id)}
                          className="h-8 gap-1.5 text-destructive border-destructive/30"
                          data-ocid={`admin.suggestion.delete_button.${i + 1}`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Listings Tab */}
        <TabsContent value="listings">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Link products to retailers with prices
            </p>
            <Button
              size="sm"
              onClick={() => setListingDialog(true)}
              className="gap-1.5"
              data-ocid="admin.listing.open_modal_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Listing
            </Button>
          </div>

          {listings.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.listings.empty_state"
            >
              <List className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-display font-semibold">No listings yet</p>
              <p className="text-sm text-muted-foreground">
                Add listings to link products to retailers with prices
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((listing, i) => (
                <Card
                  key={listing.id}
                  className="card-glow border-border/60"
                  data-ocid={`admin.listing.item.${i + 1}`}
                >
                  <CardContent className="flex items-center p-3 gap-3">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {getProductName(listing.productId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRetailerName(listing.retailerId)}
                      </p>
                    </div>
                    <span className="font-display font-bold text-sm text-primary shrink-0">
                      R{listing.price.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteListing(listing.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      data-ocid={`admin.listing.delete_button.${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent
          className="max-w-md"
          data-ocid="admin.add_product.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add Product to Catalogue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Ace Instant Porridge (1kg)"
                data-ocid="admin.product_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Brief description"
                rows={2}
                data-ocid="admin.product_description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger data-ocid="admin.product_category.select">
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
            <div className="space-y-1.5">
              <Label>Product Images (optional, up to 3)</Label>
              <ImageUpload
                value={form.images}
                onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
                maxImages={3}
                label=""
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              💡 After adding the product, create listings in the Listings tab
              to link it to retailers with prices.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialog(false)}
              data-ocid="admin.add_product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              data-ocid="admin.add_product.confirm_button"
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Listing Dialog */}
      <Dialog open={listingDialog} onOpenChange={setListingDialog}>
        <DialogContent className="max-w-md" data-ocid="admin.listing.dialog">
          <DialogHeader>
            <DialogTitle>Add Product Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select
                value={listingForm.productId}
                onValueChange={(v) =>
                  setListingForm((f) => ({ ...f, productId: v }))
                }
              >
                <SelectTrigger data-ocid="admin.listing_product.select">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {official.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Retailer</Label>
              <Select
                value={listingForm.retailerId}
                onValueChange={(v) =>
                  setListingForm((f) => ({ ...f, retailerId: v }))
                }
              >
                <SelectTrigger data-ocid="admin.listing_retailer.select">
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (ZAR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={listingForm.price}
                onChange={(e) =>
                  setListingForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="0.00"
                data-ocid="admin.listing_price.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListingDialog(false)}
              data-ocid="admin.listing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddListing}
              data-ocid="admin.listing.confirm_button"
            >
              Add Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

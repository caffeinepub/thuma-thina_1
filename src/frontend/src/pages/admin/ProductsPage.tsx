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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  List,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Store,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { useApp } from "../../context/AppContext";
import type {
  Product,
  ProductCategory,
  ProductListing,
} from "../../data/mockData";
import { useActor } from "../../hooks/useActor";
import { SPECIAL_SHOPPER_MARKER } from "../../utils/orderSplit";
import { getSecretParameter } from "../../utils/urlParams";

const CATEGORIES: ProductCategory[] = [
  "Groceries",
  "Household",
  "Fast Food",
  "Beverages",
  "Personal Care",
  "Baby & Kids",
  "Auto Spares",
  "Butchery",
  "Voucher",
  "Building Materials",
  "Phones",
  "Gadgets",
  "TV",
  "Toys",
  "Power Tools",
  "Surface & Floor Cleaners",
  "Detergents & Soaps",
];

const EMOJIS: Record<string, string> = {
  Groceries: "🌾",
  Household: "🏠",
  "Fast Food": "🍔",
  Beverages: "🥤",
  "Personal Care": "🧴",
  "Baby & Kids": "👶",
  "Auto Spares": "🔧",
  Butchery: "🥩",
  Voucher: "🎟️",
  "Building Materials": "🏗️",
  Phones: "📱",
  Gadgets: "🎮",
  TV: "📺",
  Toys: "🧸",
  "Power Tools": "🔨",
  "Surface & Floor Cleaners": "🧹",
  "Detergents & Soaps": "🧼",
};

export function AdminProductsPage() {
  const {
    products,
    setProducts,
    listings,
    setListings,
    retailers,
    staffUsers,
    shopperAssignments,
    customCategories,
    addCustomCategory,
  } = useApp();
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [listingDialog, setListingDialog] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [retailerSearch, setRetailerSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "" as ProductCategory | "",
    imageEmoji: "📦",
    images: [] as string[],
    isSpecial: false,
    serviceFee: 20,
  });
  const [listingForm, setListingForm] = useState({
    productId: "",
    retailerId: "",
    price: "",
  });
  const [customCategory, setCustomCategory] = useState("");
  const [editProductDialog, setEditProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    description: "",
    category: "",
    imageEmoji: "📦",
    images: [] as string[],
    isSpecial: false,
    serviceFee: 20,
  });
  const [editListingDialog, setEditListingDialog] = useState(false);
  const [editListing, setEditListing] = useState<ProductListing | null>(null);
  const [editListingPrice, setEditListingPrice] = useState("");

  // Re-register admin in access control after each deployment (accessControlState resets on canister upgrade)
  useEffect(() => {
    if (actor) {
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      actor._initializeAccessControlWithSecret(adminToken).catch(console.error);
    }
  }, [actor]);

  const official = products.filter((p) => !p.isSuggestion);
  const suggestions = products.filter((p) => p.isSuggestion && !p.approved);

  const filteredOfficial = search
    ? official.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : official;

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    const id = `p_${Date.now()}`;
    const imageEmoji = EMOJIS[form.category as ProductCategory] || "📦";
    const imagesJson =
      form.images.length > 0 ? JSON.stringify(form.images) : null;
    setSaving(true);
    try {
      if (actor) {
        // Re-register admin before write in case accessControlState reset after deploy
        const adminTok = getSecretParameter("caffeineAdminToken") || "";
        await actor._initializeAccessControlWithSecret(adminTok);
        await (actor as any).addProduct(
          id,
          form.name,
          form.description,
          form.category,
          imageEmoji,
          imagesJson,
          form.isSpecial,
          form.isSpecial ? form.serviceFee : 0,
        );
      }
      const newProduct: Product = {
        id,
        name: form.name,
        description: form.description,
        category: form.category as ProductCategory,
        imageEmoji,
        images: form.images.length > 0 ? form.images : undefined,
        inStock: true,
        isSpecial: form.isSpecial || undefined,
        serviceFee: form.isSpecial ? form.serviceFee : undefined,
      };
      setProducts((prev) => [newProduct, ...prev]);
      toast.success("Product added to catalogue");
      setAddDialog(false);
      if (
        form.category &&
        !CATEGORIES.includes(form.category as ProductCategory) &&
        !customCategories.includes(form.category)
      ) {
        addCustomCategory(form.category);
      }
      setCustomCategory("");
      setForm({
        name: "",
        description: "",
        category: "",
        imageEmoji: "📦",
        images: [],
        isSpecial: false,
        serviceFee: 20,
      });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Add product failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (actor) await actor.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove product");
    }
  };

  const handleApproveSuggestion = async (id: string) => {
    try {
      if (actor) await actor.approveSuggestion(id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, approved: true, isSuggestion: false } : p,
        ),
      );
      toast.success("Product suggestion approved and added to catalogue ✅");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve suggestion");
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    try {
      if (actor) await actor.rejectSuggestion(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.error("Product suggestion rejected");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject suggestion");
    }
  };

  const handleAddListing = async () => {
    if (
      !listingForm.productId ||
      !listingForm.retailerId ||
      !listingForm.price
    ) {
      toast.error("Please fill in all listing fields");
      return;
    }
    const id = `l_${Date.now()}`;
    const price = Number.parseFloat(listingForm.price);
    setSaving(true);
    try {
      if (actor)
        await actor.addListing(
          id,
          listingForm.productId,
          listingForm.retailerId,
          price,
        );
      const newListing: ProductListing = {
        id,
        productId: listingForm.productId,
        retailerId: listingForm.retailerId,
        price,
      };
      setListings((prev) => [...prev, newListing]);
      toast.success("Listing added");
      setListingDialog(false);
      setListingForm({ productId: "", retailerId: "", price: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add listing");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      if (actor) await actor.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove listing");
    }
  };

  const handleToggleListingStock = async (id: string, currentOOS: boolean) => {
    try {
      if (actor) await actor.setListingStock(id, !currentOOS);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, outOfStock: !currentOOS } : l)),
      );
      toast.success(!currentOOS ? "Marked out of stock" : "Marked in stock");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
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
          <TabsTrigger
            value="special_shoppers"
            data-ocid="admin.special_shoppers.tab"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
            Special Shoppers
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
                          {product.isSpecial && (
                            <Badge className="text-[10px] gap-0.5 bg-yellow-500/90 text-yellow-950 border-0">
                              <Zap className="h-2.5 w-2.5" />
                              Special
                            </Badge>
                          )}
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
                        onClick={() => {
                          setEditProduct(product);
                          setEditProductForm({
                            name: product.name,
                            description: product.description || "",
                            category: product.category,
                            imageEmoji: product.imageEmoji,
                            images: product.images || [],
                            isSpecial: product.isSpecial ?? false,
                            serviceFee: product.serviceFee ?? 20,
                          });
                          setEditProductDialog(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                        data-ocid={`admin.product.edit_button.${i + 1}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
                    <Badge
                      variant={listing.outOfStock ? "secondary" : "outline"}
                      className={`text-[10px] shrink-0 ${listing.outOfStock ? "text-red-600 border-red-200" : "text-green-700 border-green-300"}`}
                    >
                      {listing.outOfStock ? "Out of Stock" : "In Stock"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleListingStock(
                          listing.id,
                          !!listing.outOfStock,
                        )
                      }
                      className={`h-7 text-xs shrink-0 ${listing.outOfStock ? "text-green-600 border-green-200 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"}`}
                      data-ocid={`admin.listing.toggle.${i + 1}`}
                    >
                      {listing.outOfStock ? "Mark In Stock" : "Mark OOS"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditListing(listing);
                        setEditListingPrice(String(listing.price));
                        setEditListingDialog(true);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                      data-ocid={`admin.listing.edit_button.${i + 1}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
        {/* Special Shoppers Tab */}
        <TabsContent value="special_shoppers">
          <p className="text-sm text-muted-foreground mb-4">
            Toggle which approved shoppers handle special service orders (e.g.
            prepaid electricity). Special shoppers only see special orders;
            regular shoppers never see them.
          </p>
          {staffUsers.filter(
            (u) => u.role === "shopper" && u.status === "approved",
          ).length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.special_shoppers.empty_state"
            >
              <Star className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-display font-semibold">
                No approved shoppers yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {staffUsers
                .filter((u) => u.role === "shopper" && u.status === "approved")
                .map((shopper, i) => {
                  const isSpecialShopper = (
                    shopperAssignments.get(shopper.id) ?? []
                  ).includes(SPECIAL_SHOPPER_MARKER);
                  return (
                    <div
                      key={shopper.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-3"
                      data-ocid={`admin.special_shopper.item.${i + 1}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">
                            {shopper.name}
                          </p>
                          {isSpecialShopper && (
                            <Badge className="text-[10px] gap-0.5 bg-yellow-500/90 text-yellow-950 border-0">
                              <Zap className="h-2.5 w-2.5" />
                              Special
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {shopper.phone}
                        </p>
                      </div>
                      <Switch
                        checked={isSpecialShopper}
                        onCheckedChange={async (checked) => {
                          try {
                            const { Principal } = await import(
                              "@icp-sdk/core/principal"
                            );
                            const principal = Principal.fromText(shopper.id);
                            if (checked) {
                              if (actor)
                                await actor.assignShopperToRetailer(
                                  principal,
                                  SPECIAL_SHOPPER_MARKER,
                                );
                            } else {
                              if (actor)
                                await actor.unassignShopperFromRetailer(
                                  principal,
                                  SPECIAL_SHOPPER_MARKER,
                                );
                            }
                            // Update local shopperAssignments map via toast for now
                            toast.success(
                              checked
                                ? `${shopper.name} is now a special shopper`
                                : `${shopper.name} is no longer a special shopper`,
                            );
                          } catch {
                            toast.error("Failed to update shopper assignment");
                          }
                        }}
                        data-ocid={`admin.special_shopper.toggle.${i + 1}`}
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent
          className="max-w-md max-h-[85vh] flex flex-col"
          data-ocid="admin.add_product.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add Product to Catalogue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 overflow-y-auto flex-1 pr-1">
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
                value={
                  form.category === customCategory && customCategory
                    ? "__custom__"
                    : form.category
                }
                onValueChange={(v) => {
                  if (v !== "__custom__") {
                    update("category", v);
                    setCustomCategory("");
                  }
                }}
              >
                <SelectTrigger data-ocid="admin.product_category.select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {[
                    ...CATEGORIES,
                    ...customCategories.filter(
                      (c) => !CATEGORIES.includes(c as ProductCategory),
                    ),
                    ...(customCategory &&
                    !CATEGORIES.includes(customCategory as ProductCategory) &&
                    !customCategories.includes(customCategory)
                      ? [customCategory as ProductCategory]
                      : []),
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type a new category name…"
                value={customCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomCategory(val);
                  if (val.trim()) {
                    update("category", val.trim());
                  }
                }}
                data-ocid="admin.product_custom_category.input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use the dropdown selection above
              </p>
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
            {/* Special Service Product toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Special Service Product
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  e.g. prepaid electricity — requires meter input from buyer
                </p>
              </div>
              <Switch
                checked={form.isSpecial}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isSpecial: v }))
                }
                data-ocid="admin.product_special.switch"
              />
            </div>
            {form.isSpecial && (
              <div className="space-y-1.5">
                <Label>Service Fee (R)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.serviceFee}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      serviceFee: Number(e.target.value),
                    }))
                  }
                  placeholder="20"
                  data-ocid="admin.product_service_fee.input"
                />
                <p className="text-xs text-muted-foreground">
                  Flat fee charged per meter entry
                </p>
              </div>
            )}
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
              disabled={saving}
              data-ocid="admin.add_product.confirm_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
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
                onValueChange={(v) => {
                  setListingForm((f) => ({ ...f, productId: v }));
                  setProductSearch("");
                }}
              >
                <SelectTrigger data-ocid="admin.listing_product.select">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="px-2 pb-1">
                    <input
                      className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none"
                      placeholder="Search product..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {official
                    .filter((p) =>
                      p.name
                        .toLowerCase()
                        .includes(productSearch.toLowerCase()),
                    )
                    .map((p) => (
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
                onValueChange={(v) => {
                  setListingForm((f) => ({ ...f, retailerId: v }));
                  setRetailerSearch("");
                }}
              >
                <SelectTrigger data-ocid="admin.listing_retailer.select">
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="px-2 pb-1">
                    <input
                      className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none"
                      placeholder="Search retailer..."
                      value={retailerSearch}
                      onChange={(e) => setRetailerSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {retailers
                    .filter((r) =>
                      r.name
                        .toLowerCase()
                        .includes(retailerSearch.toLowerCase()),
                    )
                    .map((r) => (
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
              disabled={saving}
              data-ocid="admin.listing.confirm_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Add Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Manage Product Dialog */}
      <Dialog open={editProductDialog} onOpenChange={setEditProductDialog}>
        <DialogContent
          className="max-w-md"
          data-ocid="admin.edit_product.dialog"
        >
          <DialogHeader>
            <DialogTitle>Manage Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input
                value={editProductForm.name}
                onChange={(e) =>
                  setEditProductForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="admin.edit_product_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={editProductForm.description}
                onChange={(e) =>
                  setEditProductForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={2}
                data-ocid="admin.edit_product_desc.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={editProductForm.category}
                onChange={(e) =>
                  setEditProductForm((f) => ({
                    ...f,
                    category: e.target.value,
                  }))
                }
                placeholder="e.g. Groceries"
                data-ocid="admin.edit_product_cat.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <ImageUpload
                value={editProductForm.images}
                onChange={(imgs) =>
                  setEditProductForm((f) => ({ ...f, images: imgs }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Special Service Product
                </p>
              </div>
              <Switch
                checked={editProductForm.isSpecial}
                onCheckedChange={(v) =>
                  setEditProductForm((f) => ({ ...f, isSpecial: v }))
                }
                data-ocid="admin.edit_product_special.switch"
              />
            </div>
            {editProductForm.isSpecial && (
              <div className="space-y-1.5">
                <Label>Service Fee (R)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={editProductForm.serviceFee}
                  onChange={(e) =>
                    setEditProductForm((f) => ({
                      ...f,
                      serviceFee: Number(e.target.value),
                    }))
                  }
                  placeholder="20"
                  data-ocid="admin.edit_product_service_fee.input"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditProductDialog(false)}
              data-ocid="admin.edit_product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editProduct || !editProductForm.name.trim()) return;
                setSaving(true);
                try {
                  const imageEmoji =
                    EMOJIS[editProductForm.category as ProductCategory] ||
                    editProduct.imageEmoji;
                  const imagesJson =
                    editProductForm.images.length > 0
                      ? JSON.stringify(editProductForm.images)
                      : null;
                  if (actor) {
                    // Re-register admin before update in case accessControlState reset after deploy
                    const adminTok =
                      getSecretParameter("caffeineAdminToken") || "";
                    await actor._initializeAccessControlWithSecret(adminTok);
                    await (actor as any).updateProduct(
                      editProduct.id,
                      editProductForm.name,
                      editProductForm.description,
                      editProductForm.category,
                      imageEmoji,
                      imagesJson,
                      editProductForm.isSpecial,
                      editProductForm.isSpecial
                        ? editProductForm.serviceFee
                        : 0,
                    );
                  }
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === editProduct.id
                        ? {
                            ...p,
                            name: editProductForm.name,
                            description: editProductForm.description,
                            category:
                              editProductForm.category as ProductCategory,
                            imageEmoji,
                            images:
                              editProductForm.images.length > 0
                                ? editProductForm.images
                                : undefined,
                            isSpecial: editProductForm.isSpecial || undefined,
                            serviceFee: editProductForm.isSpecial
                              ? editProductForm.serviceFee
                              : undefined,
                          }
                        : p,
                    ),
                  );
                  toast.success("Product updated");
                  setEditProductDialog(false);
                } catch (err) {
                  console.error("Failed to update product:", err);
                  const msg = err instanceof Error ? err.message : String(err);
                  toast.error(`Update product failed: ${msg}`);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              data-ocid="admin.edit_product.save_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Listing Dialog */}
      <Dialog open={editListingDialog} onOpenChange={setEditListingDialog}>
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.edit_listing.dialog"
        >
          <DialogHeader>
            <DialogTitle>Manage Listing Price</DialogTitle>
          </DialogHeader>
          {editListing && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                {getProductName(editListing.productId)} @{" "}
                {getRetailerName(editListing.retailerId)}
              </p>
              <div className="space-y-1.5">
                <Label>Price (ZAR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editListingPrice}
                  onChange={(e) => setEditListingPrice(e.target.value)}
                  data-ocid="admin.edit_listing_price.input"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditListingDialog(false)}
              data-ocid="admin.edit_listing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editListing) return;
                const price = Number.parseFloat(editListingPrice);
                if (Number.isNaN(price)) {
                  toast.error("Invalid price");
                  return;
                }
                setSaving(true);
                try {
                  if (actor)
                    await actor.updateListingPrice(editListing.id, price);
                  setListings((prev) =>
                    prev.map((l) =>
                      l.id === editListing.id ? { ...l, price } : l,
                    ),
                  );
                  toast.success("Listing price updated");
                  setEditListingDialog(false);
                } catch {
                  toast.error("Failed to update listing");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              data-ocid="admin.edit_listing.save_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

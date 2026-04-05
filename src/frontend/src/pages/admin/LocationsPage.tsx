import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRightLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  Store,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { useApp } from "../../context/AppContext";
import type {
  BusinessArea,
  DaySchedule,
  OperatingHours,
  PickupPoint,
  ProductCategory,
  Retailer,
  RetailerProduct,
  Town,
} from "../../data/mockData";
import { DEFAULT_OPERATING_HOURS } from "../../data/mockData";
import { useActor } from "../../hooks/useActor";

const DAY_LABELS: { key: keyof OperatingHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function AdminLocationsPage() {
  const {
    towns,
    setTowns,
    businessAreas,
    setBusinessAreas,
    pickupPoints,
    setPickupPoints,
    retailers,
    setRetailers,
    retailerProducts,
    setRetailerProducts,
    staffUsers,
    setStaffUsers,
    customCategories,
  } = useApp();
  const { actor } = useActor();

  const [saving, setSaving] = useState(false);

  // Town dialog
  const [townDialog, setTownDialog] = useState(false);
  const [townForm, setTownForm] = useState({ name: "", province: "" });

  // Business Area dialog
  const [baDialog, setBaDialog] = useState(false);
  const [baForm, setBaForm] = useState({
    name: "",
    townId: "",
    type: "mall" as BusinessArea["type"],
  });

  // Pickup Point dialog
  const [ppDialog, setPpDialog] = useState(false);
  const [ppForm, setPpForm] = useState({
    name: "",
    townId: "",
    address: "",
    profileImages: [] as string[],
  });

  // Retailer dialog
  const [retailerDialog, setRetailerDialog] = useState(false);
  const [retailerForm, setRetailerForm] = useState({
    name: "",
    townId: "",
    businessAreaId: "",
    address: "",
  });

  // Retailer manage sheet
  const [manageRetailer, setManageRetailer] = useState<Retailer | null>(null);
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "Groceries" as ProductCategory,
    price: "",
    images: [] as string[],
    availableSizes: "",
    availableColors: "",
  });
  // Operating hours edit state (local draft while sheet is open)
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursForm, setHoursForm] = useState<OperatingHours>(
    DEFAULT_OPERATING_HOURS,
  );
  const [editPPDialog, setEditPPDialog] = useState(false);
  const [editPP, setEditPP] = useState<PickupPoint | null>(null);
  const [editPPForm, setEditPPForm] = useState({
    name: "",
    address: "",
    images: [] as string[],
  });
  const [editRPDialog, setEditRPDialog] = useState(false);
  const [editRP, setEditRP] = useState<RetailerProduct | null>(null);
  const [editRPForm, setEditRPForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    imageEmoji: "📦",
    images: [] as string[],
    availableSizes: "",
    availableColors: "",
  });

  // Export retailer dialog
  const [exportDialog, setExportDialog] = useState(false);
  const [exportRetailer, setExportRetailer] = useState<Retailer | null>(null);
  const [exportForm, setExportForm] = useState({
    townId: "",
    businessAreaId: "",
    nameOverride: "",
    addressOverride: "",
  });

  // Category search for exclusive product dialogs
  const [productCatSearch, setProductCatSearch] = useState("");
  const [editRPCatSearch, setEditRPCatSearch] = useState("");

  // Also add availableSizes/Colors to addProductDialog form
  // Keyword detection for size/color attributes
  const APPAREL_KEYWORDS = [
    "shoe",
    "footwear",
    "clothing",
    "apparel",
    "jeans",
    "shirt",
    "dress",
    "wear",
    "fashion",
    "pants",
    "trouser",
  ];
  const needsSizeColor = (cat: string) =>
    APPAREL_KEYWORDS.some((kw) => cat.toLowerCase().includes(kw));

  const openManageRetailer = (retailer: Retailer) => {
    setManageRetailer(retailer);
    setHoursForm(retailer.operatingHours ?? { ...DEFAULT_OPERATING_HOURS });
    setHoursOpen(false);
  };

  const saveOperatingHours = async () => {
    if (!manageRetailer) return;
    setSaving(true);
    try {
      if (actor) {
        await actor.updateRetailerHours(
          manageRetailer.id,
          JSON.stringify(hoursForm),
        );
      }
      setRetailers((prev) =>
        prev.map((r) =>
          r.id === manageRetailer.id ? { ...r, operatingHours: hoursForm } : r,
        ),
      );
      toast.success("Operating hours saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save operating hours");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (
    day: keyof OperatingHours,
    field: keyof DaySchedule,
    value: string | boolean,
  ) => {
    setHoursForm((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const addTown = async () => {
    if (!townForm.name.trim()) return;
    const id = `t${Date.now()}`;
    setSaving(true);
    try {
      if (actor) await actor.addTown(id, townForm.name, townForm.province);
      const newTown: Town = {
        id,
        name: townForm.name,
        province: townForm.province,
      };
      setTowns((prev) => [...prev, newTown]);
      toast.success("Town added");
      setTownDialog(false);
      setTownForm({ name: "", province: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add town");
    } finally {
      setSaving(false);
    }
  };

  const deleteTown = async (id: string) => {
    try {
      if (actor) await actor.deleteTown(id);
      setTowns((prev) => prev.filter((t) => t.id !== id));
      toast.success("Town removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove town");
    }
  };

  const addBA = async () => {
    if (!baForm.name.trim() || !baForm.townId) return;
    const id = `ba${Date.now()}`;
    setSaving(true);
    try {
      if (actor)
        await actor.addBusinessArea(
          id,
          baForm.name,
          baForm.townId,
          baForm.type,
        );
      const newBA: BusinessArea = {
        id,
        name: baForm.name,
        townId: baForm.townId,
        type: baForm.type,
      };
      setBusinessAreas((prev) => [...prev, newBA]);
      toast.success("Business area added");
      setBaDialog(false);
      setBaForm({ name: "", townId: "", type: "mall" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add business area");
    } finally {
      setSaving(false);
    }
  };

  const deleteBA = async (id: string) => {
    try {
      if (actor) await actor.deleteBusinessArea(id);
      setBusinessAreas((prev) => prev.filter((ba) => ba.id !== id));
      toast.success("Business area removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove business area");
    }
  };

  const addPP = async () => {
    if (!ppForm.name.trim() || !ppForm.townId) return;
    const id = `pp${Date.now()}`;
    const profileImageUrl = ppForm.profileImages[0] || null;
    setSaving(true);
    try {
      if (actor)
        await actor.addPickupPoint(
          id,
          ppForm.name,
          ppForm.townId,
          ppForm.address,
          profileImageUrl,
        );
      const newPP: PickupPoint = {
        id,
        name: ppForm.name,
        townId: ppForm.townId,
        address: ppForm.address,
        profileImageUrl: profileImageUrl ?? undefined,
      };
      setPickupPoints((prev) => [...prev, newPP]);
      toast.success("Pick-up point added");
      setPpDialog(false);
      setPpForm({ name: "", townId: "", address: "", profileImages: [] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add pick-up point");
    } finally {
      setSaving(false);
    }
  };

  const deletePP = async (id: string) => {
    try {
      if (actor) await actor.deletePickupPoint(id);
      setPickupPoints((prev) => prev.filter((pp) => pp.id !== id));
      toast.success("Pick-up point removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove pick-up point");
    }
  };

  const addRetailer = async () => {
    if (
      !retailerForm.name.trim() ||
      !retailerForm.townId ||
      !retailerForm.businessAreaId
    ) {
      toast.error("Please select a town and business area");
      return;
    }
    const id = `r${Date.now()}`;
    setSaving(true);
    try {
      if (actor) {
        await actor.addRetailer(
          id,
          retailerForm.name,
          retailerForm.townId,
          retailerForm.businessAreaId,
          retailerForm.address,
          null,
        );
      }
      const newRetailer: Retailer = {
        id,
        name: retailerForm.name,
        townId: retailerForm.townId,
        businessAreaId: retailerForm.businessAreaId,
        address: retailerForm.address,
      };
      setRetailers((prev) => [...prev, newRetailer]);
      toast.success("Retailer added");
      setRetailerDialog(false);
      setRetailerForm({
        name: "",
        townId: "",
        businessAreaId: "",
        address: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add retailer");
    } finally {
      setSaving(false);
    }
  };

  const deleteRetailer = async (id: string) => {
    try {
      if (actor) await actor.deleteRetailer(id);
      setRetailers((prev) => prev.filter((r) => r.id !== id));
      toast.success("Retailer removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove retailer");
    }
  };

  const addRetailerProduct = async () => {
    if (!manageRetailer || !productForm.name.trim() || !productForm.price)
      return;
    const price = Number.parseFloat(productForm.price);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    const id = `rp${Date.now()}`;
    const imagesJson =
      productForm.images.length > 0 ? JSON.stringify(productForm.images) : null;
    const sizes =
      needsSizeColor(productForm.category) && productForm.availableSizes.trim()
        ? productForm.availableSizes.trim()
        : null;
    const colors =
      needsSizeColor(productForm.category) && productForm.availableColors.trim()
        ? productForm.availableColors.trim()
        : null;
    setSaving(true);
    try {
      if (actor) {
        await actor.addRetailerProduct(
          id,
          manageRetailer.id,
          productForm.name,
          productForm.description,
          productForm.category,
          price,
          "🏪",
          imagesJson,
          sizes,
          colors,
        );
      }
      const newProduct: RetailerProduct = {
        id,
        retailerId: manageRetailer.id,
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price,
        imageEmoji: "🏪",
        images: productForm.images.length > 0 ? productForm.images : undefined,
        inStock: true,
        availableSizes: sizes || undefined,
        availableColors: colors || undefined,
      };
      setRetailerProducts((prev) => [...prev, newProduct]);
      toast.success("Product added");
      setAddProductDialog(false);
      setProductForm({
        name: "",
        description: "",
        category: "Groceries",
        price: "",
        images: [],
        availableSizes: "",
        availableColors: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const deleteRetailerProduct = async (id: string) => {
    try {
      if (actor) await actor.deleteRetailerProduct(id);
      setRetailerProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove product");
    }
  };

  const toggleRetailerProductStock = async (
    id: string,
    currentInStock: boolean,
  ) => {
    try {
      if (actor) await actor.setRetailerProductStock(id, !currentInStock);
      setRetailerProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, inStock: !currentInStock } : p)),
      );
      toast.success(
        !currentInStock ? "Marked in stock" : "Marked out of stock",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  const getPrincipal = async (principalStr: string) => {
    const mod = await import("@icp-sdk/core/principal");
    return mod.Principal.fromText(principalStr);
  };

  const assignShopper = async (shopperId: string, retailerId: string) => {
    try {
      if (actor) {
        const principal = await getPrincipal(shopperId);
        await actor.assignShopperToRetailer(principal, retailerId);
      }
      setStaffUsers((prev) =>
        prev.map((u) =>
          u.id === shopperId
            ? {
                ...u,
                assignedRetailerIds: [
                  ...(u.assignedRetailerIds ?? []),
                  retailerId,
                ],
              }
            : u,
        ),
      );
      toast.success("Shopper assigned");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign shopper");
    }
  };

  const unassignShopper = async (shopperId: string, retailerId: string) => {
    try {
      if (actor) {
        const principal = await getPrincipal(shopperId);
        await actor.unassignShopperFromRetailer(principal, retailerId);
      }
      setStaffUsers((prev) =>
        prev.map((u) =>
          u.id === shopperId
            ? {
                ...u,
                assignedRetailerIds: (u.assignedRetailerIds ?? []).filter(
                  (id) => id !== retailerId,
                ),
              }
            : u,
        ),
      );
      toast.success("Shopper removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove shopper");
    }
  };

  // Export retailer to another town
  const handleExportRetailer = async () => {
    if (!exportRetailer || !exportForm.townId || !exportForm.businessAreaId) {
      toast.error("Please select a target town and business area");
      return;
    }
    const newId = `r${Date.now()}`;
    const name = exportForm.nameOverride.trim() || exportRetailer.name;
    const address = exportForm.addressOverride.trim() || exportRetailer.address;
    setSaving(true);
    try {
      if (actor) {
        await actor.exportRetailerToTown(
          newId,
          exportRetailer.id,
          name,
          exportForm.townId,
          exportForm.businessAreaId,
          address,
        );
      }
      const newRetailer: Retailer = {
        id: newId,
        name,
        townId: exportForm.townId,
        businessAreaId: exportForm.businessAreaId,
        address,
        parentRetailerId: exportRetailer.id,
      };
      setRetailers((prev) => [...prev, newRetailer]);
      toast.success(
        `${name} exported to ${towns.find((t) => t.id === exportForm.townId)?.name}`,
      );
      setExportDialog(false);
      setExportRetailer(null);
      setExportForm({
        townId: "",
        businessAreaId: "",
        nameOverride: "",
        addressOverride: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to export retailer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold mb-5">
        Locations Management
      </h1>

      <Tabs defaultValue="towns">
        <TabsList className="mb-5 flex-wrap h-auto gap-1">
          <TabsTrigger value="towns" data-ocid="admin.towns.tab">
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Towns ({towns.length})
          </TabsTrigger>
          <TabsTrigger value="areas" data-ocid="admin.areas.tab">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Business Areas ({businessAreas.length})
          </TabsTrigger>
          <TabsTrigger value="pickup" data-ocid="admin.pickup.tab">
            <Package className="h-3.5 w-3.5 mr-1.5" />
            Pick-up Points ({pickupPoints.length})
          </TabsTrigger>
          <TabsTrigger value="retailers" data-ocid="admin.retailer.tab">
            <Store className="h-3.5 w-3.5 mr-1.5" />
            Retailers ({retailers.length})
          </TabsTrigger>
        </TabsList>

        {/* Towns */}
        <TabsContent value="towns">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Manage towns where Thuma Thina operates
            </p>
            <Button
              size="sm"
              onClick={() => setTownDialog(true)}
              className="gap-1.5"
              data-ocid="admin.town.open_modal_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Town
            </Button>
          </div>
          <div className="space-y-2" data-ocid="admin.towns.list">
            {towns.map((town, i) => (
              <Card
                key={town.id}
                className="card-glow border-border/60"
                data-ocid={`admin.town.item.${i + 1}`}
              >
                <CardContent className="flex items-center p-3">
                  <MapPin className="h-4 w-4 text-primary mr-3" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{town.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {town.province}
                    </p>
                  </div>
                  <Badge variant="secondary" className="mr-3 text-xs">
                    {businessAreas.filter((ba) => ba.townId === town.id).length}{" "}
                    areas
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTown(town.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    data-ocid={`admin.town.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Business Areas */}
        <TabsContent value="areas">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Shopping malls, markets, stores, and restaurants
            </p>
            <Button
              size="sm"
              onClick={() => setBaDialog(true)}
              className="gap-1.5"
              data-ocid="admin.area.open_modal_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Area
            </Button>
          </div>
          <div className="space-y-2">
            {towns.map((town) => {
              const areas = businessAreas.filter((ba) => ba.townId === town.id);
              if (areas.length === 0) return null;
              return (
                <div key={town.id}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
                    {town.name}
                  </p>
                  {areas.map((ba, i) => (
                    <Card
                      key={ba.id}
                      className="card-glow border-border/60 mb-2"
                      data-ocid={`admin.area.item.${i + 1}`}
                    >
                      <CardContent className="flex items-center p-3">
                        <Building2 className="h-4 w-4 text-primary mr-3" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{ba.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {ba.type}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBA(ba.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          data-ocid={`admin.area.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Pickup Points */}
        <TabsContent value="pickup">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Community pick-up point locations
            </p>
            <Button
              size="sm"
              onClick={() => setPpDialog(true)}
              className="gap-1.5"
              data-ocid="admin.pickup.open_modal_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Pick-up Point
            </Button>
          </div>
          <div className="space-y-2">
            {towns.map((town) => {
              const points = pickupPoints.filter((pp) => pp.townId === town.id);
              if (points.length === 0) return null;
              return (
                <div key={town.id}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
                    {town.name}
                  </p>
                  {points.map((pp, i) => (
                    <Card
                      key={pp.id}
                      className="card-glow border-border/60 mb-2"
                      data-ocid={`admin.pickup.item.${i + 1}`}
                    >
                      <CardContent className="flex items-center p-3">
                        {pp.profileImageUrl ? (
                          <img
                            src={pp.profileImageUrl}
                            alt={pp.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 mr-3"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-primary mr-3" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{pp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pp.address}
                          </p>
                          {pp.operatorId && (
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-0.5"
                            >
                              Operator assigned
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditPP(pp);
                            setEditPPForm({
                              name: pp.name,
                              address: pp.address,
                              images: pp.profileImageUrl
                                ? [pp.profileImageUrl]
                                : [],
                            });
                            setEditPPDialog(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          data-ocid={`admin.pickup.manage_button.${i + 1}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePP(pp.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          data-ocid={`admin.pickup.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Retailers */}
        <TabsContent value="retailers">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Stores and retailers linked to product listings
            </p>
            <Button
              size="sm"
              onClick={() => setRetailerDialog(true)}
              className="gap-1.5"
              data-ocid="admin.retailer.open_modal_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Retailer
            </Button>
          </div>
          <div className="space-y-2">
            {towns.map((town) => {
              const townRetailers = retailers.filter(
                (r) => r.townId === town.id,
              );
              if (townRetailers.length === 0) return null;
              return (
                <div key={town.id}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
                    {town.name}
                  </p>
                  {townRetailers.map((retailer, i) => {
                    const rpCount = retailerProducts.filter(
                      (p) => p.retailerId === retailer.id,
                    ).length;
                    const assignedCount = staffUsers.filter(
                      (u) =>
                        u.role === "shopper" &&
                        u.assignedRetailerIds?.includes(retailer.id),
                    ).length;
                    return (
                      <Card
                        key={retailer.id}
                        className="card-glow border-border/60 mb-2"
                        data-ocid={`admin.retailer.item.${i + 1}`}
                      >
                        <CardContent className="flex items-center p-3 gap-2">
                          <Store className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {retailer.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {retailer.address}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {rpCount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {rpCount} exclusive product
                                  {rpCount !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {assignedCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 text-amber-700 border-amber-300"
                                >
                                  {assignedCount} shopper
                                  {assignedCount !== 1 ? "s" : ""} assigned
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExportRetailer(retailer);
                              setExportForm({
                                townId: "",
                                businessAreaId: "",
                                nameOverride: "",
                                addressOverride: "",
                              });
                              setExportDialog(true);
                            }}
                            className="gap-1.5 h-8 text-xs shrink-0"
                            data-ocid={`admin.retailer.export_button.${i + 1}`}
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            Export
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openManageRetailer(retailer)}
                            className="gap-1.5 h-8 text-xs shrink-0"
                            data-ocid={`admin.retailer.edit_button.${i + 1}`}
                          >
                            <Settings className="h-3.5 w-3.5" />
                            Manage
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRetailer(retailer.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            data-ocid={`admin.retailer.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })}
            {retailers.length === 0 && (
              <div
                className="text-center py-10"
                data-ocid="admin.retailer.empty_state"
              >
                <Store className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No retailers yet. Add one to get started.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Retailer Manage Sheet */}
      <Sheet
        open={!!manageRetailer}
        onOpenChange={(open) => !open && setManageRetailer(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
          data-ocid="admin.retailer.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              {manageRetailer?.name}
            </SheetTitle>
          </SheetHeader>

          {manageRetailer && (
            <div className="space-y-6">
              {/* Section A: Retailer Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">
                      Exclusive Products
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddProductDialog(true)}
                    className="gap-1.5 h-7 text-xs"
                    data-ocid="admin.retailer_product.open_modal_button"
                  >
                    <Plus className="h-3 w-3" />
                    Add Product
                  </Button>
                </div>

                <div className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-2 mb-3">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    These products are unique to this retailer and show in the
                    catalogue with a fixed price. They do not need a listing.
                  </p>
                </div>

                {retailerProducts.filter(
                  (p) => p.retailerId === manageRetailer.id,
                ).length === 0 ? (
                  <div
                    className="text-center py-6 rounded-lg border border-dashed border-border/60"
                    data-ocid="admin.retailer_product.empty_state"
                  >
                    <Package className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground">
                      No exclusive products yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {retailerProducts
                      .filter((p) => p.retailerId === manageRetailer.id)
                      .map((product, idx) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5"
                          data-ocid={`admin.retailer_product.item.${idx + 1}`}
                        >
                          <div className="w-9 h-9 rounded-md bg-muted/40 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-contain bg-white/50"
                              />
                            ) : (
                              product.imageEmoji
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {product.category}
                              </Badge>
                              <span className="text-xs font-bold text-primary">
                                R{product.price.toFixed(2)}
                              </span>
                              <Badge
                                variant={
                                  product.inStock ? "outline" : "secondary"
                                }
                                className={`text-[10px] px-1.5 py-0 ${product.inStock ? "text-green-700 border-green-300" : "text-red-600 border-red-200"}`}
                              >
                                {product.inStock ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleRetailerProductStock(
                                product.id,
                                product.inStock,
                              )
                            }
                            className={`h-7 text-xs shrink-0 ${product.inStock ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                            data-ocid={`admin.retailer_product.toggle.${idx + 1}`}
                          >
                            {product.inStock ? "Mark OOS" : "Mark In Stock"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditRP(product);
                              setEditRPForm({
                                name: product.name,
                                description: product.description || "",
                                category: product.category,
                                price: String(product.price),
                                imageEmoji: product.imageEmoji,
                                images: product.images || [],
                                availableSizes: product.availableSizes || "",
                                availableColors: product.availableColors || "",
                              });
                              setEditRPCatSearch("");
                              setEditRPDialog(true);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                            data-ocid={`admin.retailer_product.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRetailerProduct(product.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            data-ocid={`admin.retailer_product.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Section B: Assigned Shoppers */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Assigned Shoppers</h3>
                </div>

                <div className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-2 mb-3">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Assigned shoppers exclusively handle orders from this
                    retailer. If none are assigned, all area shoppers can handle
                    orders.
                  </p>
                </div>

                {/* Assign shopper dropdown */}
                {(() => {
                  const availableShoppers = staffUsers.filter(
                    (u) =>
                      u.role === "shopper" &&
                      u.status === "approved" &&
                      !u.assignedRetailerIds?.includes(manageRetailer.id),
                  );
                  return availableShoppers.length > 0 ? (
                    <div className="mb-3">
                      <Select
                        onValueChange={(shopperId) =>
                          assignShopper(shopperId, manageRetailer.id)
                        }
                      >
                        <SelectTrigger
                          className="h-8 text-xs"
                          data-ocid="admin.assign_shopper.select"
                        >
                          <div className="flex items-center gap-1.5">
                            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Assign a shopper…" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {availableShoppers.map((s) => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-xs"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null;
                })()}

                {staffUsers.filter(
                  (u) =>
                    u.role === "shopper" &&
                    u.assignedRetailerIds?.includes(manageRetailer.id),
                ).length === 0 ? (
                  <div
                    className="text-center py-5 rounded-lg border border-dashed border-border/60"
                    data-ocid="admin.assigned_shoppers.empty_state"
                  >
                    <UserCheck className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground">
                      No shoppers assigned — all area shoppers handle orders
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffUsers
                      .filter(
                        (u) =>
                          u.role === "shopper" &&
                          u.assignedRetailerIds?.includes(manageRetailer.id),
                      )
                      .map((shopper, idx) => (
                        <div
                          key={shopper.id}
                          className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5"
                          data-ocid={`admin.assigned_shoppers.item.${idx + 1}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {shopper.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {shopper.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {shopper.phone}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              unassignShopper(shopper.id, manageRetailer.id)
                            }
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            data-ocid={`admin.assigned_shoppers.delete_button.${idx + 1}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Section C: Operating Hours */}
              <div>
                <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-between w-full mb-2"
                      data-ocid="admin.operating_hours.toggle"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">
                          Operating Hours
                        </h3>
                      </div>
                      {hoursOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-2 mb-3">
                      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Set the hours this retailer is open. Closed retailers
                        show a "Closed" badge in the catalogue and customers
                        cannot add their items to cart.
                      </p>
                    </div>

                    <div className="space-y-2 mb-3">
                      {DAY_LABELS.map(({ key, label }) => {
                        const day = hoursForm[key];
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2"
                            data-ocid={`admin.hours_${key}.row`}
                          >
                            <span className="w-20 text-xs font-medium shrink-0">
                              {label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Switch
                                checked={day.closed}
                                onCheckedChange={(v) =>
                                  updateDay(key, "closed", v)
                                }
                                className="scale-75"
                                data-ocid={`admin.hours_${key}.switch`}
                              />
                              <span className="text-[11px] text-muted-foreground w-12">
                                {day.closed ? "Closed" : "Open"}
                              </span>
                            </div>
                            {!day.closed && (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <Input
                                  type="time"
                                  value={day.open}
                                  onChange={(e) =>
                                    updateDay(key, "open", e.target.value)
                                  }
                                  className="h-7 text-xs flex-1"
                                  data-ocid={`admin.hours_${key}_open.input`}
                                />
                                <span className="text-xs text-muted-foreground shrink-0">
                                  to
                                </span>
                                <Input
                                  type="time"
                                  value={day.close}
                                  onChange={(e) =>
                                    updateDay(key, "close", e.target.value)
                                  }
                                  className="h-7 text-xs flex-1"
                                  data-ocid={`admin.hours_${key}_close.input`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      size="sm"
                      onClick={saveOperatingHours}
                      disabled={saving}
                      className="w-full gap-1.5"
                      data-ocid="admin.operating_hours.save_button"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      Save Operating Hours
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Retailer Product Dialog */}
      <Dialog open={addProductDialog} onOpenChange={setAddProductDialog}>
        <DialogContent data-ocid="admin.retailer_product.dialog">
          <DialogHeader>
            <DialogTitle>
              Add Exclusive Product — {manageRetailer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Zinger Burger Meal"
                data-ocid="admin.retailer_product_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Short product description"
                className="h-20 resize-none"
                data-ocid="admin.retailer_product_description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(v) =>
                  setProductForm((f) => ({
                    ...f,
                    category: v as ProductCategory,
                    availableSizes: "",
                    availableColors: "",
                  }))
                }
              >
                <SelectTrigger data-ocid="admin.retailer_product_category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="px-2 pb-1 sticky top-0 bg-popover z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input
                        className="w-full rounded border border-border bg-background pl-6 pr-2 py-1 text-xs outline-none"
                        placeholder="Search categories..."
                        value={productCatSearch}
                        onChange={(e) => setProductCatSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {(customCategories ?? [])
                    .filter(
                      (cat) =>
                        !productCatSearch ||
                        cat
                          .toLowerCase()
                          .includes(productCatSearch.toLowerCase()),
                    )
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {needsSizeColor(productForm.category) && (
              <>
                <div className="space-y-1.5">
                  <Label>Available Sizes</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={productForm.availableSizes}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        availableSizes: e.target.value,
                      }))
                    }
                    placeholder="e.g. S, M, L, XL, XXL"
                    data-ocid="admin.retailer_product_sizes.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated sizes
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Available Colours</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={productForm.availableColors}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        availableColors: e.target.value,
                      }))
                    }
                    placeholder="e.g. Red, Blue, Black, White"
                    data-ocid="admin.retailer_product_colors.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated colours
                  </p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Price (ZAR)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="e.g. 89.90"
                data-ocid="admin.retailer_product_price.input"
              />
            </div>
            <div className="space-y-1.5">
              <ImageUpload
                value={productForm.images}
                onChange={(urls) =>
                  setProductForm((f) => ({ ...f, images: urls }))
                }
                maxImages={3}
                label="Product Images (up to 3)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddProductDialog(false)}
              data-ocid="admin.retailer_product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={addRetailerProduct}
              data-ocid="admin.retailer_product.confirm_button"
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Town Dialog */}
      <Dialog open={townDialog} onOpenChange={setTownDialog}>
        <DialogContent data-ocid="admin.town.dialog">
          <DialogHeader>
            <DialogTitle>Add Town</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Town Name</Label>
              <Input
                value={townForm.name}
                onChange={(e) =>
                  setTownForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Durban"
                data-ocid="admin.town_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Province</Label>
              <Input
                value={townForm.province}
                onChange={(e) =>
                  setTownForm((f) => ({ ...f, province: e.target.value }))
                }
                placeholder="e.g. KwaZulu-Natal"
                data-ocid="admin.town_province.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTownDialog(false)}
              data-ocid="admin.town.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={addTown} data-ocid="admin.town.confirm_button">
              Add Town
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Area Dialog */}
      <Dialog open={baDialog} onOpenChange={setBaDialog}>
        <DialogContent data-ocid="admin.area.dialog">
          <DialogHeader>
            <DialogTitle>Add Business Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Town</Label>
              <Select
                value={baForm.townId}
                onValueChange={(v) => setBaForm((f) => ({ ...f, townId: v }))}
              >
                <SelectTrigger data-ocid="admin.area_town.select">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  {towns.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area Name</Label>
              <Input
                value={baForm.name}
                onChange={(e) =>
                  setBaForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Gateway Mall"
                data-ocid="admin.area_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={baForm.type}
                onValueChange={(v) =>
                  setBaForm((f) => ({ ...f, type: v as BusinessArea["type"] }))
                }
              >
                <SelectTrigger data-ocid="admin.area_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["mall", "store", "market", "factory", "restaurant"].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBaDialog(false)}
              data-ocid="admin.area.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={addBA} data-ocid="admin.area.confirm_button">
              Add Area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Point Dialog */}
      <Dialog open={ppDialog} onOpenChange={setPpDialog}>
        <DialogContent data-ocid="admin.pickup.dialog">
          <DialogHeader>
            <DialogTitle>Add Pick-up Point</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Town</Label>
              <Select
                value={ppForm.townId}
                onValueChange={(v) => setPpForm((f) => ({ ...f, townId: v }))}
              >
                <SelectTrigger data-ocid="admin.pickup_town.select">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  {towns.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={ppForm.name}
                onChange={(e) =>
                  setPpForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. KwaMashu Community Centre"
                data-ocid="admin.pickup_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={ppForm.address}
                onChange={(e) =>
                  setPpForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Street address"
                data-ocid="admin.pickup_address.input"
              />
            </div>
            <div className="space-y-1.5">
              <ImageUpload
                value={ppForm.profileImages}
                onChange={(urls) =>
                  setPpForm((f) => ({ ...f, profileImages: urls }))
                }
                maxImages={1}
                label="Profile Photo (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPpDialog(false)}
              data-ocid="admin.pickup.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={addPP} data-ocid="admin.pickup.confirm_button">
              Add Pick-up Point
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retailer Dialog */}
      <Dialog open={retailerDialog} onOpenChange={setRetailerDialog}>
        <DialogContent data-ocid="admin.retailer.dialog">
          <DialogHeader>
            <DialogTitle>Add Retailer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Town</Label>
              <Select
                value={retailerForm.townId}
                onValueChange={(v) =>
                  setRetailerForm((f) => ({
                    ...f,
                    townId: v,
                    businessAreaId: "",
                  }))
                }
              >
                <SelectTrigger data-ocid="admin.retailer_town.select">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  {towns.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Business Area</Label>
              <Select
                value={retailerForm.businessAreaId}
                onValueChange={(v) =>
                  setRetailerForm((f) => ({ ...f, businessAreaId: v }))
                }
                disabled={!retailerForm.townId}
              >
                <SelectTrigger data-ocid="admin.retailer_area.select">
                  <SelectValue
                    placeholder={
                      retailerForm.townId
                        ? "Select business area"
                        : "Select town first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {businessAreas
                    .filter((ba) => ba.townId === retailerForm.townId)
                    .map((ba) => (
                      <SelectItem key={ba.id} value={ba.id}>
                        {ba.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Retailer Name</Label>
              <Input
                value={retailerForm.name}
                onChange={(e) =>
                  setRetailerForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Bluff Spar"
                data-ocid="admin.retailer_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={retailerForm.address}
                onChange={(e) =>
                  setRetailerForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Street address"
                data-ocid="admin.retailer_address.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRetailerDialog(false)}
              data-ocid="admin.retailer.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={addRetailer}
              disabled={saving}
              data-ocid="admin.retailer.confirm_button"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Add Retailer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pickup Point Dialog */}
      <Dialog open={editPPDialog} onOpenChange={setEditPPDialog}>
        <DialogContent
          className="max-w-md"
          data-ocid="admin.manage_pickup.dialog"
        >
          <DialogHeader>
            <DialogTitle>Manage Pick-up Point</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editPPForm.name}
                onChange={(e) =>
                  setEditPPForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="admin.edit_pickup_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={editPPForm.address}
                onChange={(e) =>
                  setEditPPForm((f) => ({ ...f, address: e.target.value }))
                }
                data-ocid="admin.edit_pickup_address.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <ImageUpload
                value={editPPForm.images}
                onChange={(imgs) =>
                  setEditPPForm((f) => ({ ...f, images: imgs }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPPDialog(false)}
              data-ocid="admin.edit_pickup.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editPP) return;
                setSaving(true);
                try {
                  const profileImageUrl =
                    editPPForm.images.length > 0 ? editPPForm.images[0] : null;
                  if (actor)
                    await actor.updatePickupPoint(
                      editPP.id,
                      editPPForm.name,
                      editPPForm.address,
                      profileImageUrl,
                    );
                  setPickupPoints((prev) =>
                    prev.map((pp) =>
                      pp.id === editPP.id
                        ? {
                            ...pp,
                            name: editPPForm.name,
                            address: editPPForm.address,
                            profileImageUrl: profileImageUrl || undefined,
                          }
                        : pp,
                    ),
                  );
                  toast.success("Pick-up point updated");
                  setEditPPDialog(false);
                } catch {
                  toast.error("Failed to update pick-up point");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              data-ocid="admin.edit_pickup.save_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Retailer Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent
          className="max-w-md"
          data-ocid="admin.export_retailer.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Export Retailer to Another Town
            </DialogTitle>
          </DialogHeader>
          {exportRetailer && (
            <div className="space-y-3 py-2">
              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{exportRetailer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {exportRetailer.address}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Target Town</Label>
                <Select
                  value={exportForm.townId}
                  onValueChange={(v) =>
                    setExportForm((f) => ({
                      ...f,
                      townId: v,
                      businessAreaId: "",
                    }))
                  }
                >
                  <SelectTrigger data-ocid="admin.export_town.select">
                    <SelectValue placeholder="Select town" />
                  </SelectTrigger>
                  <SelectContent>
                    {towns
                      .filter((t) => t.id !== exportRetailer.townId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target Business Area</Label>
                <Select
                  value={exportForm.businessAreaId}
                  onValueChange={(v) =>
                    setExportForm((f) => ({ ...f, businessAreaId: v }))
                  }
                  disabled={!exportForm.townId}
                >
                  <SelectTrigger data-ocid="admin.export_area.select">
                    <SelectValue
                      placeholder={
                        exportForm.townId ? "Select area" : "Select town first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {businessAreas
                      .filter((ba) => ba.townId === exportForm.townId)
                      .map((ba) => (
                        <SelectItem key={ba.id} value={ba.id}>
                          {ba.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Name Override (optional)</Label>
                <Input
                  value={exportForm.nameOverride}
                  onChange={(e) =>
                    setExportForm((f) => ({
                      ...f,
                      nameOverride: e.target.value,
                    }))
                  }
                  placeholder={exportRetailer.name}
                  data-ocid="admin.export_name.input"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep original name
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Address Override (optional)</Label>
                <Input
                  value={exportForm.addressOverride}
                  onChange={(e) =>
                    setExportForm((f) => ({
                      ...f,
                      addressOverride: e.target.value,
                    }))
                  }
                  placeholder={exportRetailer.address || "Address"}
                  data-ocid="admin.export_address.input"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep original address
                </p>
              </div>
              <div className="flex items-start gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 px-3 py-2">
                <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  Exclusive products remain linked to the original retailer.
                  Price changes and new products in the source will apply here
                  too.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialog(false)}
              data-ocid="admin.export_retailer.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportRetailer}
              disabled={saving}
              data-ocid="admin.export_retailer.confirm_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Export Retailer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Retailer Product Dialog */}
      <Dialog open={editRPDialog} onOpenChange={setEditRPDialog}>
        <DialogContent
          className="max-w-md"
          data-ocid="admin.edit_retailer_product.dialog"
        >
          <DialogHeader>
            <DialogTitle>Manage Exclusive Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editRPForm.name}
                onChange={(e) =>
                  setEditRPForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="admin.edit_rp_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={editRPForm.description}
                onChange={(e) =>
                  setEditRPForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                data-ocid="admin.edit_rp_desc.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={editRPForm.category}
                onValueChange={(v) =>
                  setEditRPForm((f) => ({
                    ...f,
                    category: v,
                    availableSizes: "",
                    availableColors: "",
                  }))
                }
              >
                <SelectTrigger data-ocid="admin.edit_rp_cat.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="px-2 pb-1 sticky top-0 bg-popover z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input
                        className="w-full rounded border border-border bg-background pl-6 pr-2 py-1 text-xs outline-none"
                        placeholder="Search categories..."
                        value={editRPCatSearch}
                        onChange={(e) => setEditRPCatSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {(customCategories ?? [])
                    .filter(
                      (cat) =>
                        !editRPCatSearch ||
                        cat
                          .toLowerCase()
                          .includes(editRPCatSearch.toLowerCase()),
                    )
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {needsSizeColor(editRPForm.category) && (
              <>
                <div className="space-y-1.5">
                  <Label>Available Sizes</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={editRPForm.availableSizes}
                    onChange={(e) =>
                      setEditRPForm((f) => ({
                        ...f,
                        availableSizes: e.target.value,
                      }))
                    }
                    placeholder="e.g. S, M, L, XL, XXL"
                    data-ocid="admin.edit_rp_sizes.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated sizes
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Available Colours</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={editRPForm.availableColors}
                    onChange={(e) =>
                      setEditRPForm((f) => ({
                        ...f,
                        availableColors: e.target.value,
                      }))
                    }
                    placeholder="e.g. Red, Blue, Black, White"
                    data-ocid="admin.edit_rp_colors.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated colours
                  </p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Price (ZAR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editRPForm.price}
                onChange={(e) =>
                  setEditRPForm((f) => ({ ...f, price: e.target.value }))
                }
                data-ocid="admin.edit_rp_price.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <ImageUpload
                value={editRPForm.images}
                onChange={(imgs) =>
                  setEditRPForm((f) => ({ ...f, images: imgs }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRPDialog(false)}
              data-ocid="admin.edit_retailer_product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editRP) return;
                const price = Number.parseFloat(editRPForm.price);
                if (Number.isNaN(price)) {
                  toast.error("Invalid price");
                  return;
                }
                setSaving(true);
                try {
                  const imagesJson =
                    editRPForm.images.length > 0
                      ? JSON.stringify(editRPForm.images)
                      : null;
                  const editSizes =
                    needsSizeColor(editRPForm.category) &&
                    editRPForm.availableSizes.trim()
                      ? editRPForm.availableSizes.trim()
                      : null;
                  const editColors =
                    needsSizeColor(editRPForm.category) &&
                    editRPForm.availableColors.trim()
                      ? editRPForm.availableColors.trim()
                      : null;
                  if (actor)
                    await actor.updateRetailerProduct(
                      editRP.id,
                      editRPForm.name,
                      editRPForm.description,
                      editRPForm.category,
                      price,
                      editRPForm.imageEmoji,
                      imagesJson,
                      editSizes,
                      editColors,
                    );
                  setRetailerProducts((prev) =>
                    prev.map((p) =>
                      p.id === editRP.id
                        ? {
                            ...p,
                            name: editRPForm.name,
                            description: editRPForm.description,
                            category:
                              editRPForm.category as RetailerProduct["category"],
                            price,
                            images:
                              editRPForm.images.length > 0
                                ? editRPForm.images
                                : undefined,
                            availableSizes: editSizes || undefined,
                            availableColors: editColors || undefined,
                          }
                        : p,
                    ),
                  );
                  toast.success("Exclusive product updated");
                  setEditRPDialog(false);
                } catch {
                  toast.error("Failed to update product");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              data-ocid="admin.edit_retailer_product.save_button"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

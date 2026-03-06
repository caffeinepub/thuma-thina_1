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
import { Building2, MapPin, Package, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { useApp } from "../../context/AppContext";
import type {
  BusinessArea,
  PickupPoint,
  Retailer,
  Town,
} from "../../data/mockData";

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
  } = useApp();

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
    address: "",
  });

  const addTown = () => {
    if (!townForm.name.trim()) return;
    const newTown: Town = {
      id: `t${Date.now()}`,
      name: townForm.name,
      province: townForm.province,
    };
    setTowns((prev) => [...prev, newTown]);
    toast.success("Town added");
    setTownDialog(false);
    setTownForm({ name: "", province: "" });
  };

  const deleteTown = (id: string) => {
    setTowns((prev) => prev.filter((t) => t.id !== id));
    toast.success("Town removed");
  };

  const addBA = () => {
    if (!baForm.name.trim() || !baForm.townId) return;
    const newBA: BusinessArea = {
      id: `ba${Date.now()}`,
      name: baForm.name,
      townId: baForm.townId,
      type: baForm.type,
    };
    setBusinessAreas((prev) => [...prev, newBA]);
    toast.success("Business area added");
    setBaDialog(false);
    setBaForm({ name: "", townId: "", type: "mall" });
  };

  const deleteBA = (id: string) => {
    setBusinessAreas((prev) => prev.filter((ba) => ba.id !== id));
    toast.success("Business area removed");
  };

  const addPP = () => {
    if (!ppForm.name.trim() || !ppForm.townId) return;
    const newPP: PickupPoint = {
      id: `pp${Date.now()}`,
      name: ppForm.name,
      townId: ppForm.townId,
      address: ppForm.address,
      profileImageUrl: ppForm.profileImages[0] || undefined,
    };
    setPickupPoints((prev) => [...prev, newPP]);
    toast.success("Pick-up point added");
    setPpDialog(false);
    setPpForm({ name: "", townId: "", address: "", profileImages: [] });
  };

  const deletePP = (id: string) => {
    setPickupPoints((prev) => prev.filter((pp) => pp.id !== id));
    toast.success("Pick-up point removed");
  };

  const addRetailer = () => {
    if (!retailerForm.name.trim() || !retailerForm.townId) return;
    const newRetailer: Retailer = {
      id: `r${Date.now()}`,
      name: retailerForm.name,
      townId: retailerForm.townId,
      address: retailerForm.address,
    };
    setRetailers((prev) => [...prev, newRetailer]);
    toast.success("Retailer added");
    setRetailerDialog(false);
    setRetailerForm({ name: "", townId: "", address: "" });
  };

  const deleteRetailer = (id: string) => {
    setRetailers((prev) => prev.filter((r) => r.id !== id));
    toast.success("Retailer removed");
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
                  {townRetailers.map((retailer, i) => (
                    <Card
                      key={retailer.id}
                      className="card-glow border-border/60 mb-2"
                      data-ocid={`admin.retailer.item.${i + 1}`}
                    >
                      <CardContent className="flex items-center p-3">
                        <Store className="h-4 w-4 text-primary mr-3" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {retailer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {retailer.address}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRetailer(retailer.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          data-ocid={`admin.retailer.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
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
                  setRetailerForm((f) => ({ ...f, townId: v }))
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
              data-ocid="admin.retailer.confirm_button"
            >
              Add Retailer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

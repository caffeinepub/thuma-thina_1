import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Loader2, MapPin, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { SPECIAL_SHOPPER_MARKER } from "../../utils/orderSplit";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShopperMyOrdersPage() {
  const { orders, updateOrderStatus, currentUser, addShopperProof } = useApp();
  const [proofDialog, setProofDialog] = useState<string | null>(null); // orderId
  const [proofImage, setProofImage] = useState<string[]>([]);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  const activeOrders = orders.filter(
    (o) =>
      o.shopperId === currentUser?.id &&
      ["accepted_by_shopper", "shopping_in_progress"].includes(o.status),
  );

  const completedOrders = orders.filter(
    (o) =>
      o.shopperId === currentUser?.id &&
      [
        "ready_for_collection",
        "accepted_by_driver",
        "out_for_delivery",
        "delivered",
        "collected",
      ].includes(o.status),
  );

  const handleStartShopping = (orderId: string) => {
    updateOrderStatus(orderId, "shopping_in_progress", {
      shopperId: currentUser?.id,
      shopperName: currentUser?.name,
    });
    toast.success("Started shopping — go get those items! 🛒");
  };

  const handleMarkComplete = (order: (typeof orders)[0]) => {
    if (order.dedicatedRetailerId === SPECIAL_SHOPPER_MARKER) {
      // Special orders require proof upload first
      setProofDialog(order.id);
      setProofImage([]);
      return;
    }
    updateOrderStatus(order.id, "ready_for_collection", {
      shopperId: currentUser?.id,
      shopperName: currentUser?.name,
    });
    toast.success("Order marked complete — waiting for driver to collect.");
  };

  const handleSubmitProof = async () => {
    if (!proofDialog) return;
    setProofSubmitting(true);
    try {
      await addShopperProof(proofDialog, proofImage);
      updateOrderStatus(proofDialog, "ready_for_collection", {
        shopperId: currentUser?.id,
        shopperName: currentUser?.name,
      });
      toast.success(
        "Proof submitted — order marked complete! Waiting for driver.",
      );
      setProofDialog(null);
      setProofImage([]);
    } catch {
      toast.error("Failed to submit proof");
    } finally {
      setProofSubmitting(false);
    }
  };

  const renderOrderCard = (order: (typeof orders)[0], i: number) => (
    <Card
      key={order.id}
      className="card-glow border-border/60"
      data-ocid={`shopper.item.${i + 1}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm font-display">
                #{order.id}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.customerName}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="bg-muted/40 rounded-lg p-3 mb-3">
          {order.items.map((item) => (
            <div key={item.productId} className="py-0.5">
              <div className="flex justify-between text-xs">
                <span>
                  × {item.quantity} {item.productName}
                </span>
                <span className="font-medium">
                  R{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
              {(item as any).meterInputs &&
                (item as any).meterInputs.length > 0 && (
                  <div className="mt-2 pl-2 space-y-2">
                    {(item as any).meterInputs.map(
                      (
                        m: {
                          entryId: string;
                          meterNumber?: string;
                          slipImage?: string;
                          purchaseAmount?: number;
                        },
                        mi: number,
                      ) => (
                        <div
                          key={m.entryId}
                          className="rounded border border-yellow-200/60 bg-yellow-50/30 dark:bg-yellow-950/10 p-2 text-xs space-y-1"
                        >
                          <div className="font-medium text-yellow-800 dark:text-yellow-300">
                            Meter {mi + 1}
                            {m.meterNumber
                              ? `: ${m.meterNumber}`
                              : " (no number provided)"}
                          </div>
                          {m.purchaseAmount && m.purchaseAmount > 0 && (
                            <div className="text-muted-foreground">
                              Purchase:{" "}
                              <span className="font-medium text-foreground">
                                R{m.purchaseAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {m.slipImage && (
                            <button
                              type="button"
                              onClick={() => setViewSlipUrl(m.slipImage!)}
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                            >
                              📄 View customer slip
                            </button>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {order.pickupPointName}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(order.createdAt)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-primary">
            R{order.total.toFixed(2)}
          </span>
          <div className="flex gap-2">
            {order.status === "accepted_by_shopper" && (
              <Button
                onClick={() => handleStartShopping(order.id)}
                variant="outline"
                size="sm"
                data-ocid={`shopper.start.secondary_button.${i + 1}`}
              >
                Start Shopping
              </Button>
            )}
            {order.status === "shopping_in_progress" && (
              <Button
                onClick={() => handleMarkComplete(order)}
                size="sm"
                className={
                  order.dedicatedRetailerId === SPECIAL_SHOPPER_MARKER
                    ? "bg-yellow-500 hover:bg-yellow-600 text-yellow-950 gap-1.5"
                    : "bg-green-600 hover:bg-green-700"
                }
                data-ocid={`shopper.complete.primary_button.${i + 1}`}
              >
                {order.dedicatedRetailerId === SPECIAL_SHOPPER_MARKER && (
                  <Zap className="h-3.5 w-3.5" />
                )}
                {order.dedicatedRetailerId === SPECIAL_SHOPPER_MARKER
                  ? "Upload Proof & Complete"
                  : "Mark Complete ✓"}
              </Button>
            )}
            {[
              "ready_for_collection",
              "accepted_by_driver",
              "out_for_delivery",
            ].includes(order.status) && (
              <span className="text-xs text-green-600 font-medium">
                ✓ Waiting for driver
              </span>
            )}
            {["delivered", "collected"].includes(order.status) && (
              <span className="text-xs text-primary font-medium">
                ✓ Delivered
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold mb-1">My Orders</h1>
        <p className="text-sm text-muted-foreground">
          Orders you've accepted and are working on
        </p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active" data-ocid="shopper.active.tab">
            Active
            {activeOrders.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
                {activeOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" data-ocid="shopper.completed.tab">
            Completed
            {completedOrders.length > 0 && (
              <span className="ml-1.5 bg-muted text-muted-foreground rounded-full text-xs px-1.5 py-0.5">
                {completedOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeOrders.length === 0 ? (
            <div className="text-center py-16" data-ocid="shopper.empty_state">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-display font-semibold text-lg mb-1">
                No active orders
              </p>
              <p className="text-muted-foreground text-sm">
                Head to Available Orders to accept new orders
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order, i) => renderOrderCard(order, i))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedOrders.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="shopper.completed_empty_state"
            >
              <div className="text-5xl mb-3">📋</div>
              <p className="font-display font-semibold text-lg mb-1">
                No completed orders yet
              </p>
              <p className="text-muted-foreground text-sm">
                Completed orders will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order, i) => renderOrderCard(order, i))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Customer Slip Viewer */}
      <Dialog
        open={!!viewSlipUrl}
        onOpenChange={(open) => {
          if (!open) setViewSlipUrl(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Customer Slip</DialogTitle>
          </DialogHeader>
          {viewSlipUrl && (
            <div className="space-y-3">
              <img
                src={viewSlipUrl}
                alt="Customer slip"
                className="w-full rounded-lg border border-border object-contain max-h-80 bg-white"
              />
              <a
                href={viewSlipUrl}
                download="customer-slip.jpg"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium w-full justify-center"
              >
                ⬇ Download Slip
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Proof Upload Dialog for Special Orders */}
      <Dialog
        open={!!proofDialog}
        onOpenChange={(open) => {
          if (!open) setProofDialog(null);
        }}
      >
        <DialogContent className="max-w-sm" data-ocid="shopper.proof.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Upload Proof of Purchase
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Please upload a photo of the electricity token/receipt you
              purchased for the customer.
            </p>
            <div className="space-y-1.5">
              <Label>
                Token / Receipt Photo <span className="text-red-500">*</span>
              </Label>
              <ImageUpload
                value={proofImage}
                onChange={setProofImage}
                maxImages={3}
                label="Upload token/receipt"
              />
            </div>
            {proofImage.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ Proof image is required before completing this order
              </p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setProofDialog(null)}
              className="text-sm text-muted-foreground hover:text-foreground mr-auto"
              data-ocid="shopper.proof.cancel_button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitProof}
              disabled={proofImage.length === 0 || proofSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-ocid="shopper.proof.confirm_button"
            >
              {proofSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Proof
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

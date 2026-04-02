import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Principal } from "@icp-sdk/core/principal";
import { AlertTriangle, Database, Loader2, Trash2, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";

function ConfirmWipeDialog({
  title,
  description,
  onConfirm,
  loading,
  ocid,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  loading: boolean;
  ocid: string;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    if (confirmText !== "CONFIRM") {
      toast.error('Type "CONFIRM" to proceed');
      return;
    }
    setOpen(false);
    setConfirmText("");
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          disabled={loading}
          data-ocid={`${ocid}.open_modal_button`}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {title}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-ocid={`${ocid}.dialog`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">{description}</span>
            <span className="block font-medium text-foreground">
              This action cannot be undone. Type{" "}
              <code className="bg-muted px-1 rounded font-mono">CONFIRM</code>{" "}
              to proceed.
            </span>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CONFIRM here"
              className="font-mono"
              data-ocid={`${ocid}.input`}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setConfirmText("")}
            data-ocid={`${ocid}.cancel_button`}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-ocid={`${ocid}.confirm_button`}
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DataManagementPage() {
  const { staffUsers, orders, setStaffUsers, setOrders } = useApp() as any;
  const { actor } = useActor();
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [wipingOrders, setWipingOrders] = useState(false);
  const [wipingNomayini, setWipingNomayini] = useState(false);
  const [wipingUsers, setWipingUsers] = useState(false);

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (!actor) return;
      setDeletingUser(userId);
      try {
        const { Principal } = await import("@icp-sdk/core/principal");
        const principal = Principal.fromText(userId);
        await (actor as any).deleteUser(principal);
        setStaffUsers((prev: any[]) =>
          prev.filter((u: any) => u.id !== userId),
        );
        toast.success("User account deleted");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete user");
      } finally {
        setDeletingUser(null);
      }
    },
    [actor, setStaffUsers],
  );

  const handleWipeOrders = useCallback(async () => {
    if (!actor) return;
    setWipingOrders(true);
    try {
      await (actor as any).wipeAllOrders();
      setOrders([]);
      toast.success("All order data wiped");
    } catch (err) {
      console.error(err);
      toast.error("Failed to wipe orders");
    } finally {
      setWipingOrders(false);
    }
  }, [actor, setOrders]);

  const handleWipeNomayini = useCallback(async () => {
    if (!actor) return;
    setWipingNomayini(true);
    try {
      await (actor as any).wipeAllNomayini();
      toast.success("All Nomayini token data wiped");
    } catch (err) {
      console.error(err);
      toast.error("Failed to wipe Nomayini data");
    } finally {
      setWipingNomayini(false);
    }
  }, [actor]);

  const handleWipeUsers = useCallback(async () => {
    if (!actor) return;
    setWipingUsers(true);
    try {
      await (actor as any).wipeAllUsers();
      setStaffUsers([]);
      toast.success("All non-admin users wiped");
    } catch (err) {
      console.error(err);
      toast.error("Failed to wipe users");
    } finally {
      setWipingUsers(false);
    }
  }, [actor, setStaffUsers]);

  const allUsers = staffUsers ?? [];
  const totalOrders = orders?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Data Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform data — use with caution. Actions are permanent.
        </p>
      </div>

      {/* Danger zone notice */}
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-destructive text-sm">Danger Zone</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Wipe operations are irreversible and permanently remove all data
            from the blockchain. Use this section to clean up test data before
            launch.
          </p>
        </div>
      </div>

      {/* Section 1: Users */}
      <Card className="card-glow border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              User Accounts ({allUsers.length})
            </CardTitle>
            <ConfirmWipeDialog
              title="Wipe All Non-Admin Users"
              description="This will permanently delete all non-admin user accounts, including shoppers, drivers, operators, and customers."
              onConfirm={handleWipeUsers}
              loading={wipingUsers}
              ocid="data.wipe_users"
            />
          </div>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="data.users.empty_state"
            >
              No staff users found
            </div>
          ) : (
            <div className="space-y-2">
              {allUsers.map((user: any, i: number) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  data-ocid={`data.user.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                      <Badge
                        variant={
                          user.status === "approved" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {user.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      {user.id}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    disabled={deletingUser === user.id}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete ${user.name}'s account? This cannot be undone.`,
                        )
                      ) {
                        handleDeleteUser(user.id);
                      }
                    }}
                    data-ocid={`data.user.delete_button.${i + 1}`}
                  >
                    {deletingUser === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section 2: Orders */}
      <Card className="card-glow border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-base">
              📦 Order Data ({totalOrders} orders)
            </CardTitle>
            <ConfirmWipeDialog
              title="Wipe All Orders"
              description="This will permanently delete ALL orders from the system. Customer order history will be lost."
              onConfirm={handleWipeOrders}
              loading={wipingOrders}
              ocid="data.wipe_orders"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="font-display text-2xl font-bold text-primary">
                {totalOrders}
              </p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="font-display text-2xl font-bold text-[oklch(0.55_0.14_150)]">
                {orders?.filter((o: any) =>
                  ["delivered", "collected"].includes(o.status),
                ).length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 3: Nomayini Data */}
      <Card className="card-glow border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-base">
              🪙 Nomayini Token Data
            </CardTitle>
            <ConfirmWipeDialog
              title="Wipe All Nomayini Data"
              description="This will permanently delete all Nomayini token balances and transaction history for all users."
              onConfirm={handleWipeNomayini}
              loading={wipingNomayini}
              ocid="data.wipe_nomayini"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wipes all token balances, locked amounts (3-month and 4-year), and
            transaction history across all user accounts. Customers will lose
            their earned rewards.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

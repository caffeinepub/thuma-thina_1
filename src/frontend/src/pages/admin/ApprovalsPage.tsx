import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  Crown,
  Loader2,
  RefreshCw,
  ShieldMinus,
  ShieldPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AppUserRole,
  ApprovalStatus,
  type UserApprovalInfo,
  type UserProfile,
  UserRole,
  Variant_active_pending_updateNeeded_rejected,
} from "../../backend.d";
import { useApp } from "../../context/AppContext";
import type { NotificationTargetRole } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";

const ROLE_EMOJI: Record<string, string> = {
  [AppUserRole.shopper]: "🛍️",
  [AppUserRole.driver]: "🚗",
  [AppUserRole.operator]: "📦",
  [AppUserRole.customer]: "🛒",
  [AppUserRole.admin]: "⚙️",
};

const ROLE_LABEL: Record<string, string> = {
  [AppUserRole.shopper]: "Personal Shopper",
  [AppUserRole.driver]: "Delivery Driver",
  [AppUserRole.operator]: "Pick-up Point Operator",
  [AppUserRole.customer]: "Customer",
  [AppUserRole.admin]: "Admin",
};

const STATUS_BADGE: Record<string, { class: string; label: string }> = {
  [ApprovalStatus.pending]: {
    class: "bg-yellow-100 text-yellow-800",
    label: "Pending",
  },
  [ApprovalStatus.approved]: {
    class: "bg-green-100 text-green-800",
    label: "Approved",
  },
  [ApprovalStatus.rejected]: {
    class: "bg-red-100 text-red-800",
    label: "Rejected",
  },
};

function formatDate(isoOrBigInt: string | bigint) {
  const ms =
    typeof isoOrBigInt === "bigint"
      ? Number(isoOrBigInt / BigInt(1_000_000))
      : new Date(isoOrBigInt).getTime();
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ApprovalUserInfo {
  approvalInfo: UserApprovalInfo;
  profile: UserProfile | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ApplicantCard({
  item,
  index,
  onApprove,
  onReject,
  onSuspend,
  actionLoading,
}: {
  item: ApprovalUserInfo;
  index: number;
  onApprove: (principal: string) => void;
  onReject: (principal: string) => void;
  onSuspend?: (principal: string) => void;
  actionLoading: string | null;
}) {
  const { approvalInfo, profile } = item;
  const principalStr = approvalInfo.principal.toString();
  const sb = STATUS_BADGE[approvalInfo.status] ?? {
    class: "bg-gray-100 text-gray-800",
    label: approvalInfo.status,
  };
  const isLoading = actionLoading === principalStr;

  return (
    <Card
      className="card-glow border-border/60"
      data-ocid={`admin.approval.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-display font-bold">
                {profile ? getInitials(profile.displayName) : "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {profile?.displayName ?? "Unknown User"}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sb.class}`}
                >
                  {sb.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {principalStr.slice(0, 24)}…
              </p>
              {profile && (
                <>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    📞 {profile.phone}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    Role: {ROLE_LABEL[profile.role] ?? profile.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registered: {formatDate(profile.registeredAt)}
                  </p>
                </>
              )}
            </div>
          </div>
          {approvalInfo.status === ApprovalStatus.pending && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => onApprove(principalStr)}
                disabled={isLoading}
                className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                data-ocid={`admin.approve.confirm_button.${index}`}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(principalStr)}
                disabled={isLoading}
                className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                data-ocid={`admin.reject.delete_button.${index}`}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          )}
          {approvalInfo.status === ApprovalStatus.approved && onSuspend && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSuspend(principalStr)}
                disabled={isLoading}
                className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                data-ocid={`admin.suspend.delete_button.${index}`}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Suspend
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type JuniorAdminRole =
  | "products_admin"
  | "listings_admin"
  | "approvals_admin"
  | "";

function getJuniorAdminRole(principalStr: string): JuniorAdminRole {
  try {
    return (
      (localStorage.getItem(
        `junior_admin_role_${principalStr}`,
      ) as JuniorAdminRole) || ""
    );
  } catch {
    return "";
  }
}

function setJuniorAdminRole(principalStr: string, role: JuniorAdminRole) {
  try {
    if (role) {
      localStorage.setItem(`junior_admin_role_${principalStr}`, role);
    } else {
      localStorage.removeItem(`junior_admin_role_${principalStr}`);
    }
  } catch {
    /* ignore */
  }
}

const JUNIOR_ROLE_LABELS: Record<string, string> = {
  products_admin: "Products Admin",
  listings_admin: "Listings Admin",
  approvals_admin: "Approvals Admin",
};

function AdminUserCard({
  profile,
  index,
  onPromote,
  onRevoke,
  actionLoading,
}: {
  profile: UserProfile;
  index: number;
  onPromote: (principal: string) => void;
  onRevoke: (principal: string) => void;
  actionLoading: string | null;
}) {
  const principalStr = profile.principal.toString();
  const isLoading = actionLoading === principalStr;
  const isAdmin = profile.role === AppUserRole.admin;
  const [juniorRole, setJuniorRoleState] = useState<JuniorAdminRole>(() =>
    getJuniorAdminRole(principalStr),
  );

  const handleJuniorRoleChange = (role: string) => {
    const r = role as JuniorAdminRole;
    setJuniorRoleState(r);
    setJuniorAdminRole(principalStr, r);
    if (r) {
      toast.success(
        `Junior admin role "${JUNIOR_ROLE_LABELS[r] || r}" assigned`,
      );
    } else {
      toast.success("Junior admin role removed");
    }
  };

  return (
    <Card
      className="border-border/60 transition-all hover:shadow-md"
      data-ocid={`admin.admins.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg">
              {ROLE_EMOJI[profile.role] || "👤"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">
                  {profile.displayName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                  {ROLE_LABEL[profile.role] ?? profile.role}
                </span>
                {isAdmin && (
                  <Badge
                    className="gap-1 text-[10px] px-1.5 py-0.5 h-auto border font-semibold"
                    style={{
                      background: "oklch(0.92 0.09 80)",
                      color: "oklch(0.38 0.12 60)",
                      borderColor: "oklch(0.82 0.12 75)",
                    }}
                  >
                    <Crown className="h-2.5 w-2.5" />
                    Admin
                  </Badge>
                )}
                {juniorRole && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px] px-1.5 py-0.5 h-auto border"
                  >
                    {JUNIOR_ROLE_LABELS[juniorRole]}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {principalStr.slice(0, 24)}…
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                📞 {profile.phone}
              </p>
              {/* Junior admin role assignment */}
              <div className="mt-2">
                <Select
                  value={juniorRole || "none"}
                  onValueChange={(v) =>
                    handleJuniorRoleChange(v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger
                    className="h-7 text-xs w-44"
                    data-ocid={`admin.junior_role.select.${index}`}
                  >
                    <SelectValue placeholder="Assign junior role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No junior role</SelectItem>
                    <SelectItem value="products_admin">
                      Products Admin
                    </SelectItem>
                    <SelectItem value="listings_admin">
                      Listings Admin
                    </SelectItem>
                    <SelectItem value="approvals_admin">
                      Approvals Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {isAdmin ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRevoke(principalStr)}
                disabled={isLoading}
                className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                data-ocid={`admin.revoke.button.${index}`}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldMinus className="h-3.5 w-3.5" />
                )}
                Revoke Admin
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onPromote(principalStr)}
                disabled={isLoading}
                className="h-8 gap-1.5"
                data-ocid={`admin.promote.button.${index}`}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldPlus className="h-3.5 w-3.5" />
                )}
                Make Admin
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminApprovalsPage() {
  const { addNotification } = useApp();
  const { actor } = useActor();

  const [approvals, setApprovals] = useState<ApprovalUserInfo[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const approvalList = await actor.listApprovals();

      let userList: UserProfile[] = [];
      try {
        userList = await actor.getAllUsers();
      } catch {
        // non-critical — approvals can still show without full user list
      }

      // Match profiles from already-fetched userList to avoid individual getUserProfile failures
      const items: ApprovalUserInfo[] = approvalList.map((a) => ({
        approvalInfo: a,
        profile:
          userList.find(
            (u) => u.principal.toString() === a.principal.toString(),
          ) ?? null,
      }));

      setApprovals(items);
      setAllUsers(userList);
    } catch (err) {
      console.error("Failed to load approvals:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor) {
      loadData();
    }
  }, [actor, loadData]);

  const getPrincipal = useCallback(async (principalStr: string) => {
    const mod = await import("@icp-sdk/core/principal");
    return mod.Principal.fromText(principalStr);
  }, []);

  const handleApprove = async (principalStr: string) => {
    if (!actor) return;
    setActionLoading(principalStr);
    try {
      const principal = await getPrincipal(principalStr);
      await actor.setApproval(principal, ApprovalStatus.approved);
      addNotification({
        type: "approval",
        title: "Application Approved",
        message:
          "Your application to join Thuma Thina has been approved. Welcome aboard! You now have access to your staff dashboard.",
        targetRole: "all",
        targetUserId: principalStr,
      });
      toast.success("Application approved ✅");
      await loadData();
    } catch (err) {
      toast.error("Failed to approve application");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (principalStr: string) => {
    if (!actor) return;
    if (!confirm("Suspend this staff member? They will lose dashboard access."))
      return;
    setActionLoading(principalStr);
    try {
      const principal = await getPrincipal(principalStr);
      await actor.setApproval(principal, ApprovalStatus.rejected);
      toast.success("Staff member suspended");
      await loadData();
    } catch (err) {
      toast.error("Failed to suspend staff member");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (principalStr: string) => {
    if (!actor) return;
    setActionLoading(principalStr);
    try {
      const principal = await getPrincipal(principalStr);
      await actor.setApproval(principal, ApprovalStatus.rejected);
      addNotification({
        type: "approval",
        title: "Application Update",
        message:
          "Your application was not approved at this time. Please contact Thuma Thina support for more information.",
        targetRole: "all",
        targetUserId: principalStr,
      });
      toast.error("Application rejected");
      await loadData();
    } catch (err) {
      toast.error("Failed to reject application");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (principalStr: string) => {
    if (!actor) return;
    setActionLoading(principalStr);
    try {
      const principal = await getPrincipal(principalStr);
      await actor.assignCallerUserRole(principal, UserRole.admin);
      toast.success("Admin role granted 🛡️");
      await loadData();
    } catch (err) {
      toast.error("Failed to grant admin role");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (principalStr: string) => {
    if (!actor) return;
    setActionLoading(principalStr);
    try {
      const principal = await getPrincipal(principalStr);
      await actor.assignCallerUserRole(principal, UserRole.user);
      toast.success("Admin role revoked");
      await loadData();
    } catch (err) {
      toast.error("Failed to revoke admin role");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = approvals.filter(
    (a) => a.approvalInfo.status === ApprovalStatus.pending,
  );
  const approved = approvals.filter(
    (a) => a.approvalInfo.status === ApprovalStatus.approved,
  );
  const rejected = approvals.filter(
    (a) => a.approvalInfo.status === ApprovalStatus.rejected,
  );

  // All users (for Admin tab) — show everyone
  const adminEligible = allUsers.filter(
    (u) =>
      u.registrationStatus ===
      Variant_active_pending_updateNeeded_rejected.active,
  );
  const adminCount = allUsers.filter(
    (u) => u.role === AppUserRole.admin,
  ).length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Approval Queue</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold">Approval Queue</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff applications &amp; admin roles
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {pending.length > 0 && <Badge>{pending.length} pending</Badge>}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={loadData}
            title="Refresh"
            data-ocid="admin.approvals.refresh_button"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" data-ocid="admin.approvals.tab">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="pending" data-ocid="admin.pending.tab">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-ocid="admin.approved.tab">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-ocid="admin.rejected.tab">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Rejected ({rejected.length})
          </TabsTrigger>
          <TabsTrigger
            value="admins"
            data-ocid="admin.admins.tab"
            className="gap-1.5"
          >
            <Crown className="h-3.5 w-3.5" />
            Admins
            {adminCount > 0 && (
              <span
                className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.92 0.09 80)",
                  color: "oklch(0.38 0.12 60)",
                }}
              >
                {adminCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pending.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.pending.empty_state"
            >
              <div className="text-4xl mb-2">✅</div>
              <p className="font-display font-semibold">
                No pending applications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((item, i) => (
                <ApplicantCard
                  key={item.approvalInfo.principal.toString()}
                  item={item}
                  index={i + 1}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approved.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.approved.empty_state"
            >
              <p className="text-muted-foreground">No approved staff yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approved.map((item, i) => (
                <ApplicantCard
                  key={item.approvalInfo.principal.toString()}
                  item={item}
                  index={i + 1}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSuspend={handleSuspend}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejected.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.rejected.empty_state"
            >
              <p className="text-muted-foreground">No rejected applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rejected.map((item, i) => (
                <ApplicantCard
                  key={item.approvalInfo.principal.toString()}
                  item={item}
                  index={i + 1}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins">
          {/* Info note */}
          <div
            className="flex items-start gap-2.5 rounded-lg border px-4 py-3 mb-4 text-sm"
            style={{
              background: "oklch(0.97 0.04 80)",
              borderColor: "oklch(0.85 0.10 75)",
              color: "oklch(0.40 0.10 65)",
            }}
          >
            <Crown
              className="h-4 w-4 shrink-0 mt-0.5"
              style={{ color: "oklch(0.62 0.14 70)" }}
            />
            <p>
              <strong>Promoted admins</strong> can access all admin tools
              (Approvals, Orders, Catalogue, Locations) except Analytics, which
              is reserved for the super admin.
            </p>
          </div>

          {adminEligible.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.admins.empty_state"
            >
              <Crown className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-display font-semibold text-muted-foreground">
                No active users yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Approve staff applications first before granting admin roles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminEligible.map((u, i) => (
                <AdminUserCard
                  key={u.principal.toString()}
                  profile={u}
                  index={i + 1}
                  onPromote={handlePromote}
                  onRevoke={handleRevoke}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

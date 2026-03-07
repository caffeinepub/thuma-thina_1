import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  Crown,
  ShieldMinus,
  ShieldPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { NotificationTargetRole } from "../../context/AppContext";
import type { StaffUser } from "../../data/mockData";

const ROLE_EMOJI: Record<string, string> = {
  shopper: "🛍️",
  driver: "🚗",
  operator: "📦",
};

const ROLE_LABEL: Record<string, string> = {
  shopper: "Personal Shopper",
  driver: "Delivery Driver",
  operator: "Pick-up Point Operator",
};

const STATUS_BADGE: Record<string, { class: string; label: string }> = {
  pending: { class: "bg-yellow-100 text-yellow-800", label: "Pending" },
  approved: { class: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { class: "bg-red-100 text-red-800", label: "Rejected" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ApplicantCard({
  user,
  index,
  onApprove,
  onReject,
  businessAreas,
  pickupPoints,
}: {
  user: StaffUser;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  businessAreas: { id: string; name: string }[];
  pickupPoints: { id: string; name: string }[];
}) {
  const area = businessAreas.find((ba) => ba.id === user.businessAreaId);
  const pp = pickupPoints.find((pp) => pp.id === user.pickupPointId);
  const sb = STATUS_BADGE[user.status];

  return (
    <Card
      className="card-glow border-border/60"
      data-ocid={`admin.approval.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Profile picture or emoji avatar */}
            {user.role === "driver" || user.role === "operator" ? (
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-display font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-2xl leading-none mt-0.5">
                {ROLE_EMOJI[user.role] || "👤"}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{user.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sb.class}`}
                >
                  {sb.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.email} · {user.phone}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                Role: {user.role}
                {area ? ` — ${area.name}` : ""}
                {pp ? ` — ${pp.name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Applied: {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          {user.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => onApprove(user.id)}
                className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                data-ocid={`admin.approve.confirm_button.${index}`}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(user.id)}
                className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                data-ocid={`admin.reject.delete_button.${index}`}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminStaffCard({
  user,
  index,
  onPromote,
  onRevoke,
  businessAreas,
  pickupPoints,
}: {
  user: StaffUser;
  index: number;
  onPromote: (id: string) => void;
  onRevoke: (id: string) => void;
  businessAreas: { id: string; name: string }[];
  pickupPoints: { id: string; name: string }[];
}) {
  const area = businessAreas.find((ba) => ba.id === user.businessAreaId);
  const pp = pickupPoints.find((p) => p.id === user.pickupPointId);

  return (
    <Card
      className="border-border/60 transition-all hover:shadow-md"
      data-ocid={`admin.admins.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {user.role === "driver" || user.role === "operator" ? (
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-display font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg">
                {ROLE_EMOJI[user.role] || "👤"}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">{user.name}</span>
                {/* Role chip */}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
                {/* Admin badge — amber/gold */}
                {user.isPromotedAdmin && (
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
              </div>
              <p className="text-xs text-muted-foreground">
                {user.email} · {user.phone}
              </p>
              {(area || pp) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {area ? area.name : ""}
                  {pp ? pp.name : ""}
                </p>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {user.isPromotedAdmin ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRevoke(user.id)}
                className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                data-ocid={`admin.revoke.button.${index}`}
              >
                <ShieldMinus className="h-3.5 w-3.5" />
                Revoke Admin
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onPromote(user.id)}
                className="h-8 gap-1.5"
                data-ocid={`admin.promote.button.${index}`}
              >
                <ShieldPlus className="h-3.5 w-3.5" />
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
  const {
    staffUsers,
    setStaffUsers,
    businessAreas,
    pickupPoints,
    addNotification,
  } = useApp();

  const pending = staffUsers.filter((u) => u.status === "pending");
  const approved = staffUsers.filter((u) => u.status === "approved");
  const rejected = staffUsers.filter((u) => u.status === "rejected");
  // All staff (non-admin roles) that have been approved — eligible for admin promotion
  const eligibleForAdmin = staffUsers.filter(
    (u) => u.status === "approved" && u.role !== "admin",
  );

  const getRoleTarget = (id: string): NotificationTargetRole => {
    const user = staffUsers.find((u) => u.id === id);
    if (
      user?.role === "shopper" ||
      user?.role === "driver" ||
      user?.role === "operator"
    ) {
      return user.role;
    }
    return "all";
  };

  const handleApprove = (id: string) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "approved" } : u)),
    );
    addNotification({
      type: "approval",
      title: "Application Approved",
      message:
        "Your application to join Thuma Thina has been approved. Welcome aboard!",
      targetRole: getRoleTarget(id),
    });
    toast.success("Application approved ✅");
  };

  const handleReject = (id: string) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "rejected" } : u)),
    );
    addNotification({
      type: "approval",
      title: "Application Update",
      message:
        "Your application to join Thuma Thina was not approved at this time.",
      targetRole: getRoleTarget(id),
    });
    toast.error("Application rejected");
  };

  const handlePromote = (id: string) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isPromotedAdmin: true } : u)),
    );
    toast.success("Admin role granted 🛡️");
  };

  const handleRevoke = (id: string) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isPromotedAdmin: false } : u)),
    );
    toast.success("Admin role revoked");
  };

  const props = {
    onApprove: handleApprove,
    onReject: handleReject,
    businessAreas,
    pickupPoints,
  };

  const promotedCount = eligibleForAdmin.filter(
    (u) => u.isPromotedAdmin,
  ).length;

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
        {pending.length > 0 && (
          <Badge className="ml-auto">{pending.length} pending</Badge>
        )}
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
            {promotedCount > 0 && (
              <span
                className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.92 0.09 80)",
                  color: "oklch(0.38 0.12 60)",
                }}
              >
                {promotedCount}
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
              {pending.map((u, i) => (
                <ApplicantCard key={u.id} user={u} index={i + 1} {...props} />
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
              {approved.map((u, i) => (
                <ApplicantCard key={u.id} user={u} index={i + 1} {...props} />
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
              {rejected.map((u, i) => (
                <ApplicantCard key={u.id} user={u} index={i + 1} {...props} />
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

          {eligibleForAdmin.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.admins.empty_state"
            >
              <Crown className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-display font-semibold text-muted-foreground">
                No approved staff members yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Approve staff applications first before granting admin roles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleForAdmin.map((u, i) => (
                <AdminStaffCard
                  key={u.id}
                  user={u}
                  index={i + 1}
                  onPromote={handlePromote}
                  onRevoke={handleRevoke}
                  businessAreas={businessAreas}
                  pickupPoints={pickupPoints}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

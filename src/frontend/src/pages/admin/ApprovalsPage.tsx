import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { StaffUser } from "../../data/mockData";

const ROLE_EMOJI: Record<string, string> = {
  shopper: "🛍️",
  driver: "🚗",
  operator: "📦",
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
                {!(user.role === "driver" || user.role === "operator") && null}
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

export function AdminApprovalsPage() {
  const { staffUsers, setStaffUsers, businessAreas, pickupPoints } = useApp();

  const pending = staffUsers.filter((u) => u.status === "pending");
  const approved = staffUsers.filter((u) => u.status === "approved");
  const rejected = staffUsers.filter((u) => u.status === "rejected");

  const handleApprove = (id: string) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "approved" } : u)),
    );
    toast.success("Application approved ✅");
  };

  const handleReject = (id: string) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "rejected" } : u)),
    );
    toast.error("Application rejected");
  };

  const props = {
    onApprove: handleApprove,
    onReject: handleReject,
    businessAreas,
    pickupPoints,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold">Approval Queue</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff applications
          </p>
        </div>
        {pending.length > 0 && (
          <Badge className="ml-auto">{pending.length} pending</Badge>
        )}
      </div>

      <Tabs defaultValue="pending" data-ocid="admin.approvals.tab">
        <TabsList className="mb-4">
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
      </Tabs>
    </div>
  );
}

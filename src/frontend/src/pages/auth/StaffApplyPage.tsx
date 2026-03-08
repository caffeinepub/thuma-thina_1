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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BusinessArea, Town } from "../../backend.d";
import { AppUserRole } from "../../backend.d";
import { useAuth } from "../../context/AuthContext";
import { useActor } from "../../hooks/useActor";

type StaffRole =
  | AppUserRole.shopper
  | AppUserRole.driver
  | AppUserRole.operator;

const ROLE_DETAILS: Record<
  StaffRole,
  { label: string; emoji: string; desc: string }
> = {
  [AppUserRole.shopper]: {
    label: "Personal Shopper",
    emoji: "🛍️",
    desc: "Physically purchase items for community members",
  },
  [AppUserRole.driver]: {
    label: "Delivery Driver",
    emoji: "🚗",
    desc: "Deliver orders to pick-up points and homes",
  },
  [AppUserRole.operator]: {
    label: "Pick-up Point Operator",
    emoji: "📦",
    desc: "Manage a community pick-up point",
  },
};

export function StaffApplyPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    login,
    refetchProfile,
  } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<StaffRole>(AppUserRole.shopper);
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });
  const [businessAreaId, setBusinessAreaId] = useState<string>("");
  const [towns, setTowns] = useState<Town[]>([]);
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);

  // Fetch towns and business areas for the area selector
  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getTowns(), actor.getBusinessAreas()])
      .then(([rawTowns, rawAreas]) => {
        setTowns(rawTowns);
        setBusinessAreas(rawAreas);
      })
      .catch(() => {
        // Non-fatal: areas will just be empty
      });
  }, [actor]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter your display name");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (role === AppUserRole.shopper && !businessAreaId) {
      toast.error("Please select your business area");
      return;
    }
    setLoading(true);
    try {
      if (!actor) throw new Error("Not connected to backend");
      const areaId = businessAreaId || null;
      await actor.registerUser(
        role,
        form.name.trim(),
        form.phone.trim(),
        areaId,
      );
      await refetchProfile();
      toast.success("Application submitted! You'll be notified when approved.");
      navigate({ to: "/pending-approval" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        errorMsg.includes("already registered") ||
        errorMsg.includes("AlreadyRegistered") ||
        errorMsg.includes("already exists")
      ) {
        await refetchProfile();
        navigate({ to: "/pending-approval" });
      } else {
        toast.error("Application failed. Please try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Not authenticated — show II login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-display font-bold text-xl">
                TT
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl">Join Our Team</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Apply to be part of Thuma Thina
            </p>
          </div>

          <Card className="card-glow" data-ocid="auth.staff_apply.modal">
            <CardHeader className="pb-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-lg">
                Step 1: Verify your identity
              </CardTitle>
              <CardDescription>
                First, connect with Internet Identity to secure your
                application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full gap-2 h-11"
                onClick={() => login()}
                disabled={authLoading}
                data-ocid="auth.ii.submit_button"
              >
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-5 w-5" />
                )}
                {authLoading
                  ? "Connecting…"
                  : "Continue with Internet Identity"}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Want to order instead?{" "}
            <Link
              to="/register/customer"
              className="text-primary font-medium hover:underline"
              data-ocid="auth.customer_register.link"
            >
              Register as customer
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Authenticated — show application form
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold text-xl">
              TT
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl">Join Our Team</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Apply to be part of Thuma Thina
          </p>
        </div>

        <Card className="card-glow" data-ocid="auth.staff_apply.modal">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">
              Staff Application
            </CardTitle>
            <CardDescription>
              Step 2: Fill in your details. All applications require admin
              approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">I want to be a…</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as StaffRole)}
                  className="space-y-2"
                  data-ocid="auth.role.radio"
                >
                  {(
                    Object.entries(ROLE_DETAILS) as [
                      StaffRole,
                      (typeof ROLE_DETAILS)[AppUserRole.shopper],
                    ][]
                  ).map(([r, d]) => (
                    <div
                      key={r}
                      className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <RadioGroupItem
                        value={r}
                        id={`role-${r}`}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`role-${r}`}
                        className="cursor-pointer flex-1"
                      >
                        <span className="text-base mr-1">{d.emoji}</span>
                        <span className="font-semibold">{d.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {d.desc}
                        </p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your full name"
                  required
                  data-ocid="auth.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="07x xxx xxxx"
                  required
                  data-ocid="auth.phone.input"
                />
              </div>

              {/* Business area — required for shoppers, optional for others */}
              {(role === AppUserRole.shopper ||
                role === AppUserRole.driver ||
                role === AppUserRole.operator) && (
                <div className="space-y-1.5">
                  <Label htmlFor="business-area">
                    Business Area
                    {role === AppUserRole.shopper && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <Select
                    value={businessAreaId}
                    onValueChange={setBusinessAreaId}
                  >
                    <SelectTrigger
                      id="business-area"
                      data-ocid="auth.business_area.select"
                    >
                      <SelectValue
                        placeholder={
                          role === AppUserRole.shopper
                            ? "Select your business area"
                            : "Select area (optional)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {businessAreas.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No areas available yet
                        </SelectItem>
                      ) : (
                        businessAreas.map((area) => {
                          const town = towns.find((t) => t.id === area.townId);
                          return (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                              {town ? ` — ${town.name}` : ""}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {role === AppUserRole.shopper && !businessAreaId && (
                    <p className="text-xs text-muted-foreground">
                      Shoppers must be linked to a business area to receive
                      orders.
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-ocid="auth.staff_apply.submit_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Want to order instead?{" "}
          <Link
            to="/register/customer"
            className="text-primary font-medium hover:underline"
            data-ocid="auth.customer_register.link"
          >
            Register as customer
          </Link>
        </p>
      </div>
    </div>
  );
}

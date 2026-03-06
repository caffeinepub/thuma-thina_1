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
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { DemoRole } from "../../data/mockData";

type StaffRole = "shopper" | "driver" | "operator";

const ROLE_DETAILS: Record<
  StaffRole,
  { label: string; emoji: string; desc: string }
> = {
  shopper: {
    label: "Personal Shopper",
    emoji: "🛍️",
    desc: "Physically purchase items for community members",
  },
  driver: {
    label: "Delivery Driver",
    emoji: "🚗",
    desc: "Deliver orders to pick-up points and homes",
  },
  operator: {
    label: "Pick-up Point Operator",
    emoji: "📦",
    desc: "Manage a community pick-up point",
  },
};

export function StaffApplyPage() {
  const { businessAreas, pickupPoints, towns, setStaffUsers } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<StaffRole>("shopper");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    businessAreaId: "",
    pickupPointId: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "shopper" && !form.businessAreaId) {
      toast.error("Please select your business area");
      return;
    }
    if (role === "operator" && !form.pickupPointId) {
      toast.error("Please select your pick-up point");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const newUser = {
      id: `u${Date.now()}`,
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: role as DemoRole,
      status: "pending" as const,
      businessAreaId: role === "shopper" ? form.businessAreaId : undefined,
      pickupPointId: role === "operator" ? form.pickupPointId : undefined,
      createdAt: new Date().toISOString(),
    };
    setStaffUsers((prev) => [newUser, ...prev]);
    toast.success("Application submitted! You'll be notified when approved.");
    navigate({ to: "/pending-approval" });
    setLoading(false);
  };

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
              All applications require admin approval
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
                      typeof ROLE_DETAILS.shopper,
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your full name"
                  required
                  data-ocid="auth.name.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
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
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="your@email.com"
                    required
                    data-ocid="auth.email.input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  data-ocid="auth.password.input"
                />
              </div>

              {role === "shopper" && (
                <div className="space-y-1.5">
                  <Label>My Business Area</Label>
                  <Select
                    value={form.businessAreaId}
                    onValueChange={(v) => update("businessAreaId", v)}
                  >
                    <SelectTrigger data-ocid="auth.business_area.select">
                      <SelectValue placeholder="Select your business area" />
                    </SelectTrigger>
                    <SelectContent>
                      {towns.map((town) => {
                        const areas = businessAreas.filter(
                          (ba) => ba.townId === town.id,
                        );
                        return areas.length > 0 ? (
                          <div key={town.id}>
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                              {town.name}
                            </div>
                            {areas.map((ba) => (
                              <SelectItem key={ba.id} value={ba.id}>
                                {ba.name}
                              </SelectItem>
                            ))}
                          </div>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === "operator" && (
                <div className="space-y-1.5">
                  <Label>My Pick-up Point</Label>
                  <Select
                    value={form.pickupPointId}
                    onValueChange={(v) => update("pickupPointId", v)}
                  >
                    <SelectTrigger data-ocid="auth.pickup.select">
                      <SelectValue placeholder="Select your pick-up point" />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupPoints.map((pp) => {
                        const town = towns.find((t) => t.id === pp.townId);
                        return (
                          <SelectItem key={pp.id} value={pp.id}>
                            {pp.name} — {town?.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-ocid="auth.staff_apply.submit_button"
              >
                {loading ? "Submitting…" : "Submit Application"}
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

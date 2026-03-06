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

export function CustomerRegisterPage() {
  const { setDemoRole, pickupPoints, towns } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    pickupPointId: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupPointId) {
      toast.error("Please select your nearest pick-up point");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDemoRole("customer");
    toast.success("Account created! Welcome to Thuma Thina 🎉");
    navigate({ to: "/catalogue" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold text-xl">
              TT
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Join Thuma Thina as a customer
          </p>
        </div>

        <Card className="card-glow" data-ocid="auth.register.modal">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">
              Customer Registration
            </CardTitle>
            <CardDescription>
              Fill in your details to start ordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-1.5">
                <Label htmlFor="address">Home Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street address"
                  required
                  data-ocid="auth.address.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nearest Pick-up Point</Label>
                <Select
                  value={form.pickupPointId}
                  onValueChange={(v) => update("pickupPointId", v)}
                >
                  <SelectTrigger data-ocid="auth.pickup.select">
                    <SelectValue placeholder="Select your nearest pick-up point" />
                  </SelectTrigger>
                  <SelectContent>
                    {towns.map((town) => {
                      const townPoints = pickupPoints.filter(
                        (pp) => pp.townId === town.id,
                      );
                      return townPoints.length > 0 ? (
                        <div key={town.id}>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            {town.name}
                          </div>
                          {townPoints.map((pp) => (
                            <SelectItem key={pp.id} value={pp.id}>
                              {pp.name}
                            </SelectItem>
                          ))}
                        </div>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-ocid="auth.register.submit_button"
              >
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
            data-ocid="auth.login.link"
          >
            Sign in
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Want to join our team?{" "}
          <Link
            to="/register/staff"
            className="text-primary font-medium hover:underline"
            data-ocid="auth.staff.link"
          >
            Apply as staff
          </Link>
        </p>
      </div>
    </div>
  );
}

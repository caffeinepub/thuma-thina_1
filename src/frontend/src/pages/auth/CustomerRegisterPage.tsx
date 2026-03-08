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
import { Link, useNavigate } from "@tanstack/react-router";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppUserRole } from "../../backend.d";
import { useAuth } from "../../context/AuthContext";
import { useActor } from "../../hooks/useActor";

export function CustomerRegisterPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    login,
    refetchProfile,
    userProfile,
  } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // If already fully registered, redirect
  useEffect(() => {
    if (userProfile?.role === AppUserRole.customer) {
      navigate({ to: "/catalogue" });
    }
  }, [userProfile, navigate]);

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
    setLoading(true);
    try {
      if (!actor) throw new Error("Not connected to backend");
      await actor.registerUser(
        AppUserRole.customer,
        form.name.trim(),
        form.phone.trim(),
        null,
      );
      await refetchProfile();
      toast.success("Welcome to Thuma Thina! 🎉");
      navigate({ to: "/catalogue" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        errorMsg.includes("already registered") ||
        errorMsg.includes("AlreadyRegistered") ||
        errorMsg.includes("already exists")
      ) {
        // Already registered, just refresh profile and redirect
        await refetchProfile();
        navigate({ to: "/catalogue" });
      } else {
        toast.error("Registration failed. Please try again.");
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
            <CardHeader className="pb-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-lg">
                Step 1: Verify your identity
              </CardTitle>
              <CardDescription>
                First, connect with Internet Identity to secure your account.
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

  // Step 2: Authenticated — show profile form
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold text-xl">
              TT
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl">Almost there!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tell us a bit about yourself
          </p>
        </div>

        <Card className="card-glow" data-ocid="auth.register.modal">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">
              Complete Registration
            </CardTitle>
            <CardDescription>
              Step 2: Fill in your details to start ordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-ocid="auth.register.submit_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

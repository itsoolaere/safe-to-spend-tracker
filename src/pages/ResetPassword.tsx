import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "reset" | "signin";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("reset");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (type !== "recovery" || !accessToken || !refreshToken) {
      setSessionError("invalid or expired reset link. please request a new one.");
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setSessionError("reset link is invalid or expired. please request a new one.");
        } else {
          supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setEmail(data.user.email);
          });
          setSessionReady(true);
          window.history.replaceState(null, "", window.location.pathname);
        }
      });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "passwords don't match", description: "please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: "password updated.", description: "sign in with your new password to continue." });
      setStep("signin");
    } catch (err: any) {
      toast({ title: "error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: signinPassword });
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      toast({ title: "error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center h-16 px-4 max-w-6xl mx-auto">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            <span className="italic">safe</span> to spend
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {sessionError ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">{sessionError}</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                back to home
              </Button>
            </div>
          ) : !sessionReady ? (
            <p className="text-center text-muted-foreground text-sm">verifying reset link…</p>
          ) : step === "reset" ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl italic font-medium text-foreground">
                  set a new password.
                </h2>
                <p className="text-muted-foreground text-sm mt-1">enter your new password below.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "please wait…" : "update password"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl italic font-medium text-foreground">
                  welcome back.
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  sign in with your new password to continue.
                </p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "please wait…" : "sign in"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

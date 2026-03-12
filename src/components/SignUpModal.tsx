import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAppUrl } from "@/lib/url";
import { useToast } from "@/hooks/use-toast";
import { useSignUpGate } from "@/hooks/useSignUpGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export default function SignUpModal() {
  const { shouldPromptSignUp, reason, manualTrigger, setManualTrigger, dismiss } = useSignUpGate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);

  // When manually triggered (sign-in button), default to login form
  useEffect(() => {
    if (manualTrigger) setIsSignUp(false);
  }, [manualTrigger]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!shouldPromptSignUp) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (forgotMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getAppUrl()}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "check your email",
          description: "we sent you a password reset link.",
        });
        setForgotMode(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getAppUrl() },
        });
        if (error) throw error;
        toast({
          title: "check your email",
          description: "we sent you a confirmation link.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({ title: "error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" onClick={dismiss} />
        <DialogPrimitive.Content
          onPointerDownOutside={() => dismiss()}
          onEscapeKeyDown={() => dismiss()}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle className="font-heading text-xl italic font-medium text-foreground">
            {isSignUp ? "create an account." : "welcome back."}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            {isSignUp
              ? reason
                ? `${reason} sign up to keep your data and unlock unlimited entries.`
                : "sign up to keep your data safe."
              : "sign in to continue."}
          </DialogDescription>

          <form onSubmit={handleEmailAuth} className="space-y-4 mt-5">
            <div className="space-y-2">
              <Label htmlFor="gate-email">Email</Label>
              <Input
                id="gate-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <Label htmlFor="gate-password">Password</Label>
                <Input
                  id="gate-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            {!isSignUp && !forgotMode && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                onClick={() => setForgotMode(true)}
              >
                forgot password?
              </button>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "please wait…"
                : forgotMode
                ? "send reset link"
                : isSignUp
                ? "sign up"
                : "sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {forgotMode ? (
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline font-medium"
                onClick={() => setForgotMode(false)}
              >
                back to sign in
              </button>
            ) : (
              <>
                {isSignUp ? "already have an account?" : "don't have an account?"}{" "}
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline font-medium"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "sign in" : "sign up"}
                </button>
              </>
            )}
          </p>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

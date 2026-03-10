import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
          redirectTo: `${window.location.origin}/reset-password`,
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
          options: { emailRedirectTo: window.location.origin },
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

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({
        title: "error",
        description: result.error.message || "Google sign-in failed",
        variant: "destructive",
      });
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

          {!forgotMode && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                sign in with Google
              </Button>
            </>
          )}

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

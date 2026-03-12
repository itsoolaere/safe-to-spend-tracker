import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface Props {
  open: boolean;
  onDone: () => void;
}

export default function ResetPasswordModal({ open, onDone }: Props) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) throw setSessionError;
          session = data.session;
        }
      }

      if (!session) {
        toast({
          title: "error",
          description: "reset link is invalid or expired. request a new one.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: "password updated.", description: "please sign in with your new password." });
      onDone();
      await supabase.auth.signOut();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (err: any) {
      toast({ title: "error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onDone(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <DialogTitle className="font-heading text-xl italic font-medium text-foreground">
            set a new password.
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            enter your new password below.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "please wait…" : "update password"}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

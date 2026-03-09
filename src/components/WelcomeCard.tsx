import { useState } from "react";
import { X, Sparkles } from "lucide-react";

const DISMISSED_KEY = "sts_welcome_dismissed";

export default function WelcomeCard() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "true"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="relative rounded-lg border bg-card px-4 py-3 animate-fade-in">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">welcome.</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            your data is now saved to the cloud. you can sign in from any device
            and pick up right where you left off.
          </p>
        </div>
      </div>
    </div>
  );
}

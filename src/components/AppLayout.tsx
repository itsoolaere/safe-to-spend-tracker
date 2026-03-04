import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Target, LogOut, LogIn, Globe, Instagram } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBudget } from "@/context/BudgetContext";
import { useAuth } from "@/context/AuthContext";
import { useSignUpGate } from "@/hooks/useSignUpGate";
import SignUpModal from "@/components/SignUpModal";
import SyncConfirmDialog from "@/components/SyncConfirmDialog";

const baseLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "Journal", icon: List },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data, pendingSync, confirmSync } = useBudget();
  const { user, signOut } = useAuth();
  const { setManualTrigger } = useSignUpGate();
  const hasActiveBudgets = data.budgets.some((b) => b.limit > 0);
  const links = hasActiveBudgets
    ? [...baseLinks, { to: "/budget", label: "Budget", icon: Target }]
    : baseLinks;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SignUpModal />
      <SyncConfirmDialog
        open={!!pendingSync}
        guestCount={pendingSync?.localData.transactions.length ?? 0}
        onSync={() => confirmSync(true)}
        onDiscard={() => confirmSync(false)}
      />
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16 px-4 max-w-6xl mx-auto">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            <span className="italic">safe</span> to spend
          </h1>
          <nav className="hidden sm:flex gap-1 items-center [&>*]:flex [&>*]:items-center">
            {links.map((l) => (
              <Tooltip key={l.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      `flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`
                    }
                  >
                    <l.icon className="w-4 h-4" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{l.label}</TooltipContent>
              </Tooltip>
            ))}
            {user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setManualTrigger(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Sign in</TooltipContent>
              </Tooltip>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>

      <footer className="border-t py-3 sm:mb-0 mb-14">
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>created by Olaere</span>
          <a href="https://itsoolaere.studio" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Website">
            <Globe className="w-3.5 h-3.5" />
          </a>
          <a href="https://www.instagram.com/itsoolaere" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
            <Instagram className="w-3.5 h-3.5" />
          </a>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 pb-safe">
        <div className="flex justify-around py-2">
          {links.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <l.icon className="w-5 h-5" />
                {l.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

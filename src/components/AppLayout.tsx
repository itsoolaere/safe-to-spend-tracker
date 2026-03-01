import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Target } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";

const baseLinks = [
{ to: "/", label: "Dashboard", icon: LayoutDashboard },
{ to: "/history", label: "History", icon: List }];


export default function AppLayout({ children }: {children: React.ReactNode;}) {
  const location = useLocation();
  const { data } = useBudget();
  const hasActiveBudgets = data.budgets.some((b) => b.limit > 0);
  const links = hasActiveBudgets ?
  [...baseLinks, { to: "/budget", label: "Budget", icon: Target }] :
  baseLinks;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16 px-4 max-w-6xl mx-auto">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">safe to spend
            <span className="text-primary italic">Safe</span> to Spend
          </h1>
          <nav className="hidden sm:flex gap-1">
            {links.map((l) =>
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`

              }>

                <l.icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>

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
                isActive ? "text-primary" : "text-muted-foreground"}`
                }>

                <l.icon className="w-5 h-5" />
                {l.label}
              </NavLink>);

          })}
        </div>
      </nav>
    </div>);

}
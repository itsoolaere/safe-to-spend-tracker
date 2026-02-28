import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, List } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: List },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16 px-4 max-w-4xl mx-auto">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            <span className="text-primary">Safe</span> to Spend
          </h1>
          <nav className="hidden sm:flex gap-1">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 pb-safe">
        <div className="flex justify-around py-2">
          {links.map(l => {
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

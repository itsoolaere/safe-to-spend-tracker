import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface CategoryData {
  name: string;
  spent: number;
  budget: number;
}

interface BudgetDonutProps {
  categories: CategoryData[];
}

const R = 70;
const CX = 100;
const CY = 100;
const C = 2 * Math.PI * R; // circumference ≈ 439.82
const SW = 28; // stroke width

const OVER_OPACITIES = [1, 0.72, 0.52, 0.36, 0.24];

export default function BudgetDonut({ categories }: BudgetDonutProps) {
  const computed = useMemo(() => {
    const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const withinBudget = categories.reduce((s, c) => s + Math.min(c.spent, c.budget), 0);
    const remaining = Math.max(0, totalBudget - totalSpent);
    const overCategories = categories
      .filter((c) => c.spent > c.budget)
      .map((c) => ({ name: c.name, over: c.spent - c.budget }))
      .sort((a, b) => b.over - a.over);
    const ringTotal = Math.max(totalSpent, totalBudget);
    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalBudget, totalSpent, withinBudget, remaining, overCategories, ringTotal, pct };
  }, [categories]);

  const { totalBudget, totalSpent, withinBudget, remaining, overCategories, ringTotal, pct } = computed;

  if (totalBudget === 0) return null;

  const withinArc = ringTotal > 0 ? (withinBudget / ringTotal) * C : 0;

  let cumOffset = withinArc;
  const overArcData = overCategories.map((c) => {
    const arc = (c.over / ringTotal) * C;
    const offset = cumOffset;
    cumOffset += arc;
    return { ...c, arc, offset };
  });

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex gap-4 items-center">
          {/* Donut */}
          <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
            <svg viewBox="0 0 200 200" width="160" height="160">
              {/* Base ring — remaining budget */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={SW}
              />
              {/* Within-budget segment */}
              {withinArc > 0 && (
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={SW}
                  strokeDasharray={`${withinArc} ${C}`}
                  strokeDashoffset={C}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              )}
              {/* Over-budget segments — one arc per category, graduated shades */}
              {overArcData.map((seg, i) => (
                <circle
                  key={seg.name}
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={`hsl(var(--expense) / ${OVER_OPACITIES[Math.min(i, OVER_OPACITIES.length - 1)]})`}
                  strokeWidth={SW}
                  strokeDasharray={`${seg.arc} ${C}`}
                  strokeDashoffset={C - seg.offset}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              ))}
            </svg>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-heading leading-none">{pct}%</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">used</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 min-w-0 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-primary" />
              <span className="text-muted-foreground flex-1">Within budget</span>
              <span className="font-medium tabular-nums">{formatCurrency(withinBudget)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-muted" />
              <span className="text-muted-foreground flex-1">Remaining</span>
              <span className="font-medium tabular-nums">{formatCurrency(remaining)}</span>
            </div>
            {overArcData.map((seg, i) => (
              <div key={seg.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: `hsl(var(--expense) / ${OVER_OPACITIES[Math.min(i, OVER_OPACITIES.length - 1)]})` }}
                />
                <span className="text-muted-foreground flex-1 truncate">{seg.name}</span>
                <span className="font-medium tabular-nums" style={{ color: "hsl(var(--expense))" }}>
                  +{formatCurrency(seg.over)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums">
            {formatCurrency(totalSpent)}{" "}
            <span className="opacity-50">of</span>{" "}
            {formatCurrency(totalBudget)}
          </span>
          {overCategories.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: "hsl(var(--expense) / 0.12)",
                color: "hsl(var(--expense))",
              }}
            >
              {overCategories.length} over budget
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

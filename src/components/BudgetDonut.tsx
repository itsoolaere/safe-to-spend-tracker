import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryData {
  name: string;
  spent: number;
  budget: number;
}

interface BudgetDonutProps {
  categories: CategoryData[];
}

const R = 76;
const CX = 100;
const CY = 100;
const C = 2 * Math.PI * R;
const SW = 18;

const OVER_OPACITIES = [1, 0.72, 0.52, 0.36, 0.24];

function formatShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`;
  return `₦${Math.round(amount)}`;
}

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

  const { withinBudget, remaining, overCategories, ringTotal, pct } = computed;

  if (computed.totalBudget === 0) return null;

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
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex gap-6 items-center">

          {/* Donut */}
          <div className="relative flex-shrink-0" style={{ width: 170, height: 170 }}>
            <svg viewBox="0 0 200 200" width="170" height="170">
              {/* Base ring — remaining */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={SW}
              />
              {/* Within-budget arc */}
              {withinArc > 0 && (
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={SW}
                  strokeDasharray={`${withinArc} ${C}`}
                  strokeDashoffset={C}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              )}
              {/* Over-budget arcs */}
              {overArcData.map((seg, i) => (
                <circle
                  key={seg.name}
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={`hsl(var(--expense) / ${OVER_OPACITIES[Math.min(i, OVER_OPACITIES.length - 1)]})`}
                  strokeWidth={SW}
                  strokeDasharray={`${seg.arc} ${C}`}
                  strokeDashoffset={C - seg.offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              ))}
            </svg>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-heading leading-none">{pct}%</span>
              <span className="text-xs text-muted-foreground mt-1">used</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Within budget */}
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-primary" />
              <span className="flex-1 text-sm">Within budget</span>
              <span className="text-sm font-semibold tabular-nums">{formatShort(withinBudget)}</span>
            </div>
            {/* Remaining */}
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-muted" />
              <span className="flex-1 text-sm text-muted-foreground">Remaining</span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{formatShort(remaining)}</span>
            </div>

            {/* Over-budget section */}
            {overArcData.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--expense))" }}>Over budget</p>
                  <div className="space-y-2.5">
                    {overArcData.map((seg, i) => (
                      <div key={seg.name} className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: `hsl(var(--expense) / ${OVER_OPACITIES[Math.min(i, OVER_OPACITIES.length - 1)]})` }}
                        />
                        <span className="flex-1 text-sm text-muted-foreground truncate">{seg.name}</span>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: "hsl(var(--expense))" }}>
                          +{formatShort(seg.over)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums">
            {formatShort(computed.totalSpent)}{" "}
            <span className="opacity-50">of</span>{" "}
            {formatShort(computed.totalBudget)}
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

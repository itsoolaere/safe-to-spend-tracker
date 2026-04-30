import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarData {
  name: string;
  amount: number;
}

interface CategoryBarChartProps {
  title: string;
  data: BarData[];
  type: "expense" | "income";
  overBudgetNames?: Set<string>;
  emptyMessage: string;
}

const CHART_HEIGHT = 140;
const BAR_MAX_HEIGHT = CHART_HEIGHT * 0.9;

function formatShort(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
}

const ABBR: Record<string, string> = {
  Entertainment: "Entertain.",
  Investments: "Invest.",
  Transportation: "Transport.",
  Miscellaneous: "Misc.",
  Subscriptions: "Subscript.",
  "Home care": "Home care",
  "Personal care": "Personal",
};

function shortenLabel(name: string, max = 9): string {
  if (ABBR[name]) return ABBR[name];
  if (name.length <= max) return name;
  // Multi-word: let line-clamp-2 handle wrapping naturally
  if (name.includes(" ")) return name;
  // Single long word: truncate
  return name.slice(0, max - 1) + "…";
}

export default function CategoryBarChart({ title, data, type, overBudgetNames, emptyMessage }: CategoryBarChartProps) {
  const maxAmount = data.length > 0 ? Math.max(...data.map((d) => d.amount)) : 0;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">{emptyMessage}</p>
        ) : (
          <>
            {/* Bar area — all bars share a bottom baseline */}
            <div
              className="flex items-end gap-1"
              style={{ height: CHART_HEIGHT }}
            >
              {data.map((item) => {
                const barHeight = maxAmount > 0
                  ? Math.max(4, (item.amount / maxAmount) * BAR_MAX_HEIGHT)
                  : 4;
                const isOver = overBudgetNames?.has(item.name) ?? false;
                const color = type === "income"
                  ? "hsl(var(--income))"
                  : isOver
                    ? "hsl(var(--expense))"
                    : "hsl(var(--expense) / 0.5)";

                return (
                  <div
                    key={item.name}
                    className="flex-1 flex flex-col items-center justify-end"
                    style={{ height: "100%" }}
                  >
                    <span className="text-[10px] text-muted-foreground tabular-nums mb-1 leading-tight text-center">
                      {formatShort(item.amount)}
                    </span>
                    <div
                      style={{
                        height: barHeight,
                        width: "100%",
                        maxWidth: 36,
                        background: color,
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Category labels below baseline */}
            <div className="flex gap-1 mt-2">
              {data.map((item) => (
                <div key={item.name} className="flex-1 text-center">
                  <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                    {shortenLabel(item.name)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

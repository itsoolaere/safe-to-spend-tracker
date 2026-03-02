import { useState, useMemo, useCallback } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";
import { Transaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

// Stable palette mapped to chart tokens + extras
const CATEGORY_COLORS = [
  "hsl(29, 46%, 59%)",   // chart-1 / primary
  "hsl(152, 28%, 49%)",  // chart-2 / income
  "hsl(0, 42%, 64%)",    // chart-3 / expense
  "hsl(220, 40%, 55%)",  // chart-4
  "hsl(280, 35%, 55%)",  // chart-5
  "hsl(190, 50%, 45%)",  // chart-6
  "hsl(45, 60%, 50%)",
  "hsl(340, 40%, 55%)",
  "hsl(160, 40%, 40%)",
  "hsl(260, 30%, 60%)",
  "hsl(100, 35%, 45%)",
  "hsl(15, 55%, 50%)",
];

const TOTAL_COLOR = "hsl(36, 6%, 45%)"; // muted-foreground

type ChartType = "line" | "column";
type TimeRange = "3M" | "6M" | "YTD" | "1Y" | "custom";

function getMonthsForRange(range: TimeRange, customStart?: string, customEnd?: string): string[] {
  const now = new Date();
  let start: Date;
  let end = new Date(now.getFullYear(), now.getMonth(), 1);

  if (range === "custom" && customStart && customEnd) {
    const [sy, sm] = customStart.split("-").map(Number);
    const [ey, em] = customEnd.split("-").map(Number);
    start = new Date(sy, sm - 1, 1);
    end = new Date(ey, em - 1, 1);
  } else if (range === "YTD") {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    const months = range === "3M" ? 2 : range === "6M" ? 5 : 11;
    start = new Date(now.getFullYear(), now.getMonth() - months, 1);
  }

  const result: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getAvailableMonths(): { value: string; label: string }[] {
  const now = new Date();
  const months: { value: string; label: string }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    months.push({ value: val, label });
  }
  return months;
}

interface DrillDownData {
  month: string;
  category: string;
  entries: Transaction[];
}

export default function TrendsView() {
  const { data } = useBudget();
  const { transactions, categories } = data;

  const allCategories = useMemo(() => [
    ...categories.income.map(c => ({ name: c, type: "income" as const })),
    ...categories.expense.map(c => ({ name: c, type: "expense" as const })),
  ], [categories]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<ChartType>("line");
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);

  const availableMonths = useMemo(() => getAvailableMonths(), []);

  const toggleCategory = useCallback((name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const months = useMemo(
    () => getMonthsForRange(timeRange, customStart, customEnd),
    [timeRange, customStart, customEnd]
  );

  const selectedCategories = useMemo(
    () => allCategories.filter(c => selected.has(c.name)),
    [allCategories, selected]
  );

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allCategories.forEach((c, i) => {
      map[c.name] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    return map;
  }, [allCategories]);

  const chartData = useMemo(() => {
    return months.map(month => {
      const row: Record<string, any> = { month: formatMonthLabel(month), monthKey: month };
      let total = 0;
      selectedCategories.forEach(cat => {
        const amount = transactions
          .filter(t => t.date.startsWith(month) && t.category === cat.name && t.type === cat.type)
          .reduce((s, t) => s + t.amount, 0);
        row[cat.name] = amount;
        total += amount;
      });
      row["Total"] = total;
      return row;
    });
  }, [months, selectedCategories, transactions]);

  const hasData = chartData.some(d => d["Total"] > 0);

  const handleChartClick = useCallback((monthKey: string, category: string) => {
    const entries = transactions.filter(
      t => t.date.startsWith(monthKey) && t.category === category
    );
    if (entries.length > 0) {
      setDrillDown({ month: monthKey, category, entries });
    }
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm min-w-[140px]">
        <p className="font-heading font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-3 text-xs">
            <span style={{ color: p.color }}>{p.dataKey}</span>
            <span className="font-medium text-foreground">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Category selector */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Income</p>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.filter(c => c.type === "income").map(cat => {
              const isSelected = selected.has(cat.name);
              const color = colorMap[cat.name];
              return (
                <button
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                  style={{
                    backgroundColor: isSelected ? color : "transparent",
                    borderColor: color,
                    color: isSelected ? "#fff" : color,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expense</p>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.filter(c => c.type === "expense").map(cat => {
              const isSelected = selected.has(cat.name);
              const color = colorMap[cat.name];
              return (
                <button
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                  style={{
                    backgroundColor: isSelected ? color : "transparent",
                    borderColor: color,
                    color: isSelected ? "#fff" : color,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Time range chips */}
        <div className="flex gap-1">
          {(["3M", "6M", "YTD", "1Y"] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                timeRange === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  timeRange === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-3" align="start">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Select value={customStart} onValueChange={v => { setCustomStart(v); setTimeRange("custom"); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Start month" /></SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Select value={customEnd} onValueChange={v => { setCustomEnd(v); setTimeRange("custom"); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="End month" /></SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Chart type toggle */}
        <div className="flex gap-0.5 ml-auto bg-secondary rounded-full p-0.5">
          <button
            onClick={() => setChartType("line")}
            className={`p-1.5 rounded-full transition-colors ${
              chartType === "line" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
            aria-label="Line chart"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType("column")}
            className={`p-1.5 rounded-full transition-colors ${
              chartType === "column" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
            aria-label="Column chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-4 pb-2 px-2">
          {!hasData ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm italic">
                no entries for this period. start logging to see your trends.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "line" ? (
                <LineChart data={chartData} onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const monthKey = e.activePayload[0].payload.monthKey;
                    const category = e.activePayload[0].dataKey;
                    if (category !== "Total") handleChartClick(monthKey, category);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 15%, 87%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  {selectedCategories.map(cat => (
                    <Line
                      key={cat.name}
                      type="monotone"
                      dataKey={cat.name}
                      stroke={colorMap[cat.name]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: "pointer" }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="Total"
                    stroke={TOTAL_COLOR}
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={false}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const monthKey = e.activePayload[0].payload.monthKey;
                    const category = e.activePayload[0].dataKey;
                    if (category !== "Total") handleChartClick(monthKey, category);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 15%, 87%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  {selectedCategories.map(cat => (
                    <Bar
                      key={cat.name}
                      dataKey={cat.name}
                      fill={colorMap[cat.name]}
                      radius={[4, 4, 0, 0]}
                      barSize={selectedCategories.length > 4 ? 8 : 14}
                      cursor="pointer"
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Drill-down popover */}
      {drillDown && (
        <Card className="border-none shadow-sm animate-fade-in">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-heading font-semibold text-sm">
                {drillDown.category} · {formatMonthLabel(drillDown.month)}
              </p>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setDrillDown(null)}>
                Close
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {drillDown.entries.map(t => (
                <div key={t.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">
                    {t.description || "No description"}
                  </span>
                  <span className={`font-medium ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs font-medium mt-2 pt-2 border-t text-foreground">
              Total: {formatCurrency(drillDown.entries.reduce((s, t) => s + t.amount, 0))}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

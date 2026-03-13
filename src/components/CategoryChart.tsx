import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CategoryTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  transactions: { category: string; description: string; amount: number }[];
}

function CategoryTooltip({ active, payload, label, transactions }: CategoryTooltipProps) {
  if (!active || !payload?.length) return null;
  const items = transactions
    .filter(t => t.category === label)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold mb-1.5">{label}: {formatCurrency(payload[0].value)}</p>
      {items.length > 0 && (
        <div className="space-y-1 border-t pt-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate mr-2">{item.description || "No desc"}</span>
              <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryChartProps {
  title: string;
  data: { name: string; amount: number }[];
  colors: string[];
  transactions: { category: string; description: string; amount: number }[];
  emptyMessage: string;
}

export default function CategoryChart({ title, data, colors, transactions, emptyMessage }: CategoryChartProps) {
  return (
    <Collapsible defaultOpen={data.length > 0} open={data.length === 0 ? false : undefined}>
      <Card className="border-none shadow-sm">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
            <CardTitle className="text-base font-heading">{title}</CardTitle>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pl-2 pr-4 pb-4 pt-0">
            {data.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">{emptyMessage}</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
                <BarChart data={data} layout="vertical" margin={{ left: -10, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CategoryTooltip transactions={transactions} />} cursor={false} />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

import { useMemo, useState, useCallback } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { getFinancialTips, pickTip, type TipState } from "@/lib/tips";

interface QuickTipProps {
  state: TipState;
}

export default function QuickTip({ state }: QuickTipProps) {
  const tips = useMemo(() => getFinancialTips(state), [state]);
  const [current, setCurrent] = useState(() => pickTip(tips));

  const cycle = useCallback(() => {
    setCurrent((prev) => pickTip(tips, prev));
  }, [tips]);

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-4 py-3">
      <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-sm italic text-muted-foreground leading-relaxed">
        {current}
      </p>
      {tips.length > 1 && (
        <button
          type="button"
          onClick={cycle}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Next tip"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

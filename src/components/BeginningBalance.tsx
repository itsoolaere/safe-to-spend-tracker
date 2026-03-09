import { useState, useRef, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatInputAmount } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

export default function BeginningBalance() {
  const { data, period, setBeginningBalance } = useBudget();
  const currentValue = data.beginningBalances[period] ?? 0;
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setInputVal(currentValue > 0 ? formatInputAmount(String(currentValue)) : "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing, currentValue]);

  const save = () => {
    const num = parseFloat(inputVal.replace(/,/g, "")) || 0;
    setBeginningBalance(period, num);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-xs text-muted-foreground">opening:</span>
        <span className="text-xs text-muted-foreground">₦</span>
        <Input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(formatInputAmount(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-6 w-24 text-xs px-1 py-0"
          placeholder="0"
        />
        <button onClick={save} className="text-income hover:opacity-80" aria-label="Save">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="text-muted-foreground hover:opacity-80" aria-label="Cancel">
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Set opening balance for this month"
    >
      opening: {formatCurrency(currentValue)}
    </button>
  );
}

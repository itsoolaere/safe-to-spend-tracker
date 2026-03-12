import { useState, useRef, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatInputAmount } from "@/lib/format";
import { computeOpeningBalance } from "@/lib/balance";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

export default function BeginningBalance() {
  const { data, period, setBeginningBalance, toggleCarryForward } = useBudget();
  const isCarryForwardOff = data.carryForwardDisabled?.includes(period) ?? false;
  const effectiveBalance = computeOpeningBalance(data, period);

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      const stored = data.beginningBalances[period] ?? 0;
      setInputVal(stored > 0 ? formatInputAmount(String(stored)) : "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing, period, data.beginningBalances]);

  const save = () => {
    const num = parseFloat(inputVal.replace(/,/g, "")) || 0;
    setBeginningBalance(period, num);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  // Carry-forward ON: show computed balance with option to start fresh
  if (!isCarryForwardOff) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          opening: {formatCurrency(effectiveBalance)}{" "}
          <span className="opacity-50">(carried forward)</span>
        </span>
        <button
          onClick={() => toggleCarryForward(period)}
          className="underline-offset-4 hover:underline hover:text-foreground transition-colors"
          title="Start this month with a custom opening balance"
        >
          start fresh
        </button>
      </span>
    );
  }

  // Carry-forward OFF: show manual input with option to carry forward
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
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <button
        onClick={() => setEditing(true)}
        className="hover:text-foreground transition-colors"
        title="Set opening balance for this month"
      >
        opening: {formatCurrency(effectiveBalance)}
      </button>
      <button
        onClick={() => toggleCarryForward(period)}
        className="underline-offset-4 hover:underline hover:text-foreground transition-colors"
        title="Use previous month's closing balance"
      >
        carry forward
      </button>
    </span>
  );
}

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AssetCategory, CurrentObligation, FutureObligation } from "@/lib/types";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function AmountInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Input
      type="number"
      min="0"
      step="any"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? "0"}
      className="h-8 text-sm"
    />
  );
}

// ── Asset Row ────────────────────────────────────────────────────────────────

function AssetRow({ asset }: { asset: AssetCategory }) {
  const { updateAsset, renameAsset, deleteAsset } = useBudget();
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [note, setNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(asset.name);

  const handleSave = () => {
    const val = parseFloat(newValue);
    if (isNaN(val) || val < 0) return;
    updateAsset(asset.id, val, note.trim() || undefined);
    setEditing(false);
    setNewValue("");
    setNote("");
  };

  const handleRename = () => {
    if (nameVal.trim()) renameAsset(asset.id, nameVal.trim());
    setRenaming(false);
  };

  return (
    <div className="border rounded-lg px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {renaming ? (
            <div className="flex items-center gap-1">
              <Input
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                className="h-7 text-sm w-32"
                onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
                autoFocus
              />
              <button onClick={handleRename} className="text-income hover:opacity-80"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setRenaming(false)} className="text-muted-foreground hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setRenaming(true); setNameVal(asset.name); }} className="text-sm font-medium hover:text-primary transition-colors truncate">
              {asset.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-heading font-semibold text-sm text-income">{formatCurrency(asset.value)}</span>
          <button
            onClick={() => { setEditing(!editing); setNewValue(String(asset.value)); setNote(""); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Edit value"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {asset.history.length > 0 && (
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => deleteAsset(asset.id)}
            className="text-muted-foreground hover:text-expense transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="space-y-2 pt-1 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">New value</Label>
              <AmountInput value={newValue} onChange={setNewValue} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Note (optional)</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. updated valuation" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {historyOpen && asset.history.length > 0 && (
        <div className="border-t pt-2 space-y-1">
          {asset.history.map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDate(entry.date)}{entry.note ? ` · ${entry.note}` : ""}</span>
              <span>{formatCurrency(entry.previousValue)} → {formatCurrency(entry.newValue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Current Obligation Row ────────────────────────────────────────────────────

function ObligationRow({ obligation }: { obligation: CurrentObligation }) {
  const { updateCurrentObligation, deleteCurrentObligation } = useBudget();
  const [editing, setEditing] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [newRepayment, setNewRepayment] = useState("");
  const [note, setNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSave = () => {
    const bal = parseFloat(newBalance);
    if (isNaN(bal) || bal < 0) return;
    const rep = newRepayment ? parseFloat(newRepayment) : undefined;
    updateCurrentObligation(obligation.id, bal, isNaN(rep as number) ? undefined : rep, note.trim() || undefined);
    setEditing(false);
    setNewBalance("");
    setNewRepayment("");
    setNote("");
  };

  return (
    <div className="border rounded-lg px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{obligation.name}</p>
          {obligation.monthlyRepayment !== undefined && (
            <p className="text-xs text-muted-foreground">{formatCurrency(obligation.monthlyRepayment)}/mo repayment</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-heading font-semibold text-sm text-expense">{formatCurrency(obligation.balance)}</span>
          <button
            onClick={() => { setEditing(!editing); setNewBalance(String(obligation.balance)); setNewRepayment(String(obligation.monthlyRepayment ?? "")); setNote(""); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {obligation.history.length > 0 && (
            <button onClick={() => setHistoryOpen(!historyOpen)} className="text-muted-foreground hover:text-foreground transition-colors">
              {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={() => deleteCurrentObligation(obligation.id)} className="text-muted-foreground hover:text-expense transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="space-y-2 pt-1 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Outstanding balance</Label>
              <AmountInput value={newBalance} onChange={setNewBalance} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Monthly repayment</Label>
              <AmountInput value={newRepayment} onChange={setNewRepayment} placeholder="optional" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Note (optional)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. paid instalment" className="h-8 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {historyOpen && obligation.history.length > 0 && (
        <div className="border-t pt-2 space-y-1">
          {obligation.history.map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDate(entry.date)}{entry.note ? ` · ${entry.note}` : ""}</span>
              <span>{formatCurrency(entry.previousValue)} → {formatCurrency(entry.newValue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Future Obligation Row ─────────────────────────────────────────────────────

function FutureObligationRow({ obligation }: { obligation: FutureObligation }) {
  const { deleteFutureObligation } = useBudget();
  return (
    <div className="border rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{obligation.name}</p>
        <p className="text-xs text-muted-foreground">Starts {formatDate(obligation.startDate)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-heading font-semibold text-sm text-muted-foreground">{formatCurrency(obligation.totalAmount)}</span>
        <button onClick={() => deleteFutureObligation(obligation.id)} className="text-muted-foreground hover:text-expense transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Add Asset Form ─────────────────────────────────────────────────────────

function AddAssetForm({ onClose }: { onClose: () => void }) {
  const { addAsset } = useBudget();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addAsset(name.trim());
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg px-3 py-2.5 space-y-2 bg-secondary/40">
      <div className="space-y-1">
        <Label className="text-xs">Asset name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Business Account" className="h-8 text-sm" autoFocus />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Add Current Obligation Form ──────────────────────────────────────────────

function AddObligationForm({ onClose }: { onClose: () => void }) {
  const { addCurrentObligation } = useBudget();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [repayment, setRepayment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(balance);
    if (!name.trim() || isNaN(bal) || bal < 0) return;
    const rep = repayment ? parseFloat(repayment) : undefined;
    addCurrentObligation(name.trim(), bal, isNaN(rep as number) ? undefined : rep);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg px-3 py-2.5 space-y-2 bg-secondary/40">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Car loan" className="h-8 text-sm" autoFocus />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Outstanding balance</Label>
          <AmountInput value={balance} onChange={setBalance} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Monthly repayment</Label>
          <AmountInput value={repayment} onChange={setRepayment} placeholder="optional" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Add Future Obligation Form ───────────────────────────────────────────────

function AddFutureObligationForm({ onClose }: { onClose: () => void }) {
  const { addFutureObligation } = useBudget();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt < 0 || !startDate) return;
    addFutureObligation(name.trim(), amt, startDate);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg px-3 py-2.5 space-y-2 bg-secondary/40">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Home renovation loan" className="h-8 text-sm" autoFocus />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Total amount</Label>
          <AmountInput value={amount} onChange={setAmount} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Start date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { data } = useBudget();
  const currentMonth = getCurrentMonth();

  const [addingAsset, setAddingAsset] = useState(false);
  const [addingObligation, setAddingObligation] = useState(false);
  const [addingFuture, setAddingFuture] = useState(false);

  const totalAssets = useMemo(() => data.assets.reduce((s, a) => s + a.value, 0), [data.assets]);
  const totalObligations = useMemo(() => data.currentObligations.reduce((s, o) => s + o.balance, 0), [data.currentObligations]);
  const netPosition = totalAssets - totalObligations;
  const isSurplus = netPosition >= 0;

  const monthlyIncome = useMemo(() => {
    const budgetIncome = data.budgets
      .filter(b => b.type === "income" && b.month === currentMonth)
      .reduce((s, b) => s + b.limit, 0);
    if (budgetIncome > 0) return budgetIncome;
    return data.transactions
      .filter(t => t.type === "income" && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
  }, [data.budgets, data.transactions, currentMonth]);

  const incomeMultiple = monthlyIncome > 0 && netPosition !== 0 ? netPosition / monthlyIncome : null;

  return (
    <div className="space-y-6 pb-24 sm:pb-0 max-w-2xl mx-auto">
      <div>
        <h2 className="font-heading text-2xl italic font-medium text-foreground">financial overview.</h2>
        <p className="text-sm text-muted-foreground mt-1">Your assets, obligations, and net position at a glance.</p>
      </div>

      {/* Net Position Card */}
      <Card className={`border-none shadow-sm ${isSurplus ? "bg-income/10" : "bg-expense/10"}`}>
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Net Position</p>
          <p className={`font-heading text-3xl font-bold mt-1 ${isSurplus ? "text-income" : "text-expense"}`}>
            {isSurplus ? "" : "−"}{formatCurrency(Math.abs(netPosition))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isSurplus ? "Surplus" : "Deficit"} · {formatCurrency(totalAssets)} assets − {formatCurrency(totalObligations)} obligations
          </p>
          {incomeMultiple !== null && (
            <p className="text-xs text-muted-foreground italic mt-1">
              {isSurplus
                ? `That's ${incomeMultiple.toFixed(1)}× your monthly income in net surplus.`
                : `Net deficit is ${Math.abs(incomeMultiple).toFixed(1)}× your monthly income.`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assets */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-sm">Assets</h3>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalAssets)} total</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddingAsset(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {data.assets.map(a => <AssetRow key={a.id} asset={a} />)}
          {addingAsset && <AddAssetForm onClose={() => setAddingAsset(false)} />}
          {data.assets.length === 0 && !addingAsset && (
            <p className="text-xs text-muted-foreground text-center py-4">No assets yet. Add one to get started.</p>
          )}
        </div>
      </section>

      {/* Current Obligations */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-sm">Current Obligations</h3>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalObligations)} outstanding</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddingObligation(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {data.currentObligations.map(o => <ObligationRow key={o.id} obligation={o} />)}
          {addingObligation && <AddObligationForm onClose={() => setAddingObligation(false)} />}
          {data.currentObligations.length === 0 && !addingObligation && (
            <p className="text-xs text-muted-foreground text-center py-4">No current obligations.</p>
          )}
        </div>
      </section>

      {/* Future Obligations */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-sm">Future Obligations</h3>
            <p className="text-xs text-muted-foreground">Upcoming commitments — auto-convert to current on start date</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddingFuture(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {data.futureObligations.map(f => <FutureObligationRow key={f.id} obligation={f} />)}
          {addingFuture && <AddFutureObligationForm onClose={() => setAddingFuture(false)} />}
          {data.futureObligations.length === 0 && !addingFuture && (
            <p className="text-xs text-muted-foreground text-center py-4">No future obligations.</p>
          )}
        </div>
      </section>
    </div>
  );
}

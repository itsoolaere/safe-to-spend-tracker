import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatInputAmount, getMonthOptions } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Save, Plus, ArrowLeft, ChevronDown, Lightbulb, FolderPlus, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import BudgetTable from "@/components/BudgetTable";
import ClearBudgetDialog from "@/components/ClearBudgetDialog";
import BudgetMonthlyWidget from "@/components/BudgetMonthlyWidget";

export default function BudgetVsActual() {
  const { data, updateBudgets, addCategory, period, setPeriod, addProjectBudget, deleteProjectBudget } = useBudget();
  const monthOptions = useMemo(() => getMonthOptions(), []);

  // New project dialog state
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectAutoClose, setNewProjectAutoClose] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editLimits, setEditLimits] = useState<Record<string, string>>({});

  const periodBudgets = useMemo(() => data.budgets.filter((b) => b.month === period), [data.budgets, period]);
  const expenseBudgets = periodBudgets.filter((b) => b.type === "expense");
  const incomeBudgets = periodBudgets.filter((b) => b.type === "income");

  const monthlyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions.
    filter((t) => t.type === "expense" && t.date.startsWith(period)).
    forEach((t) => {map[t.category] = (map[t.category] || 0) + t.amount;});
    return map;
  }, [data.transactions, period]);

  const monthlyIncome = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions.
    filter((t) => t.type === "income" && t.date.startsWith(period)).
    forEach((t) => {map[t.category] = (map[t.category] || 0) + t.amount;});
    return map;
  }, [data.transactions, period]);

  const periodTransactions = useMemo(
    () => data.transactions.filter((t) => t.date.startsWith(period)),
    [data.transactions, period]
  );

  const hasEdits = Object.keys(editLimits).length > 0;

  const totalExpenseBudget = expenseBudgets.filter((b) => b.limit > 0).reduce((s, b) => s + b.limit, 0);
  const totalIncomeBudget = incomeBudgets.filter((b) => b.limit > 0).reduce((s, b) => s + b.limit, 0);
  const budgetSurplus = totalIncomeBudget - totalExpenseBudget;

  const handleSave = () => {
    const updatedBudgets = data.budgets.map((b) => {
      if (editLimits[b.id] !== undefined) {
        return { ...b, limit: parseFloat(editLimits[b.id].replace(/,/g, "")) || 0 };
      }
      return b;
    });
    updateBudgets(updatedBudgets);
    setEditLimits({});
    toast.success("Budgets updated");
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newType, newCatName.trim());
    setNewCategory(newCatName.trim());
    setNewCatName("");
    setShowNewCat(false);
    toast.success("Category added");
  };

  const handleAddBudget = () => {
    if (!newCategory) { toast.error("Select a category"); return; }
    const amount = parseFloat(newAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }

    updateBudgets([...data.budgets, { id: crypto.randomUUID(), category: newCategory, limit: amount, type: newType, month: period, note: newNote.trim() || undefined }]);
    setNewCategory("");
    setNewAmount("");
    setNewNote("");
    toast.success("Budget entry added");
  };

  const handleDelete = (_type: "income" | "expense") => (id: string) => {
    updateBudgets(data.budgets.filter((b) => b.id !== id));
    toast.success("Budget removed");
  };

  const hasAnyBudgets = periodBudgets.some((b) => b.limit > 0);

  const formPanel = (
    <Collapsible open={formOpen} onOpenChange={setFormOpen}>
      <Card className="border-none shadow-sm bg-card/60">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer">
            <CardTitle className="text-base font-heading flex items-center justify-between">
              New Budget Entry
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${formOpen ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs h-5 flex items-center">Type</Label>
                <Select value={newType} onValueChange={(v: "expense" | "income") => { setNewType(v); setNewCategory(""); setShowNewCat(false); setNewCatName(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="h-5 flex items-center justify-between">
                  <Label className="text-xs">Category</Label>
                  <button
                    type="button"
                    onClick={() => { setShowNewCat(!showNewCat); setNewCatName(""); }}
                    className="text-xs text-primary hover:underline"
                  >
                    {showNewCat ? "Cancel" : "+ New"}
                  </button>
                </div>
                {showNewCat && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category name"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
                  </div>
                )}
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {data.categories[newType].map((c) =>
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs h-5 flex items-center">Limit Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                  <Input
                    className="pl-7"
                    placeholder="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(formatInputAmount(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs">Note (optional)</Label>
                <Input
                  placeholder="e.g. weekly groceries, rent, etc."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <Button onClick={handleAddBudget} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  const summaryPanel = hasAnyBudgets && (
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-4 py-3">
      <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
      <p className="text-sm italic text-muted-foreground leading-relaxed">
        Income budget of{" "}
        <span className="text-income not-italic font-medium">{formatCurrency(totalIncomeBudget)}</span>
        {" "}against expense budget of{" "}
        <span className="not-italic font-medium">{formatCurrency(totalExpenseBudget)}</span>
        {" "}— leaving{" "}
        <span className={`not-italic font-medium ${budgetSurplus >= 0 ? "text-income" : "text-expense"}`}>
          {formatCurrency(Math.abs(budgetSurplus))}
        </span>
        {budgetSurplus >= 0 ? " in planned surplus." : " as a planned deficit."}
      </p>
    </div>
  );

  const incomTablePanel = (
    <div className="rounded-xl bg-card/40 backdrop-blur-sm p-4">
      <BudgetTable type="income" label="Income Budgets" budgets={incomeBudgets} actuals={monthlyIncome} transactions={periodTransactions} editLimits={editLimits} setEditLimits={setEditLimits} onDelete={handleDelete("income")} onSave={handleSave} />
    </div>
  );

  const expenseTablePanel = (
    <div className="rounded-xl bg-card/40 backdrop-blur-sm p-4">
      <BudgetTable type="expense" label="Expense Budgets" budgets={expenseBudgets} actuals={monthlyExpenses} transactions={periodTransactions} editLimits={editLimits} setEditLimits={setEditLimits} onDelete={handleDelete("expense")} onSave={handleSave} />
    </div>
  );

  const handleCreateProject = () => {
    if (!newProjectName.trim()) { toast.error("Enter a project name"); return; }
    addProjectBudget({
      name: newProjectName.trim(),
      categories: [],
      status: "active",
      createdAt: new Date().toISOString(),
      autoClose: newProjectAutoClose,
    });
    setNewProjectName("");
    setNewProjectAutoClose(false);
    setNewProjectOpen(false);
    toast.success("Project budget created");
  };

  const projectBudgets = data.projectBudgets ?? [];

  const projectsPanel = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm">Projects</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewProjectOpen(true)}>
              <FolderPlus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">New Project Budget</TooltipContent>
        </Tooltip>
      </div>
      {projectBudgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <button
            onClick={() => setNewProjectOpen(true)}
            className="text-xs text-primary hover:underline mt-1"
          >
            Create your first project budget
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm divide-y divide-border/30">
          {projectBudgets.map(proj => {
            const totalBudget = (data.projectBudgetLines ?? [])
              .filter(l => l.projectId === proj.id)
              .reduce((s, l) => s + l.limit, 0);
            const spent = (data.projectExpenses ?? [])
              .filter(e => e.projectId === proj.id)
              .reduce((s, e) => s + e.amount, 0);
            const pct = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
            return (
              <div key={proj.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/budget/projects/${proj.id}`}
                    className="text-sm font-medium hover:text-primary flex items-center gap-1.5 truncate"
                  >
                    {proj.name}
                    <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalBudget > 0
                      ? `${formatCurrency(spent)} of ${formatCurrency(totalBudget)} · ${pct}%`
                      : "No budget lines yet"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    proj.status === "active"
                      ? "bg-income/15 text-income"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {proj.status === "active" ? "Active" : "Closed"}
                  </span>
                  <button
                    onClick={() => { deleteProjectBudget(proj.id); toast.success("Project deleted"); }}
                    className="text-muted-foreground hover:text-expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const emptyPanel = (
    <Card className="border-none shadow-sm">
      <CardContent className="py-12 text-center text-muted-foreground text-sm">
        No budgets set for this month. Add one above to get started.
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* New Project Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">New Project Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Project Name</Label>
              <Input
                placeholder="e.g. Kitchen renovation, Wedding, Trip to Abuja"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateProject()}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-close when exhausted</p>
                <p className="text-xs text-muted-foreground">Closes when spending reaches 100%</p>
              </div>
              <Switch checked={newProjectAutoClose} onCheckedChange={setNewProjectAutoClose} />
            </div>
            <Button onClick={handleCreateProject} className="w-full">
              <FolderPlus className="w-4 h-4 mr-1.5" /> Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h2 className="font-heading font-bold tracking-tight text-lg">Budget</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Plan my money</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) =>
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
          {hasEdits &&
          <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          }
          {hasAnyBudgets && <ClearBudgetDialog />}
        </div>
      </div>

      {/* Desktop layout: two columns */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        {/* Left: budget snapshot widget + projects */}
        <div className="space-y-6">
          <BudgetMonthlyWidget />
          {projectsPanel}
        </div>

        {/* Right: form → summary → income → expense */}
        <div className="space-y-4">
          {formPanel}
          {summaryPanel}
          {hasAnyBudgets ? (
            <div className="space-y-4">
              {incomTablePanel}
              {expenseTablePanel}
            </div>
          ) : emptyPanel}
        </div>
      </div>

      {/* Mobile layout: widget → projects → form → summary → income → expense */}
      <div className="lg:hidden space-y-4">
        <BudgetMonthlyWidget />
        {projectsPanel}
        {formPanel}
        {summaryPanel}
        {hasAnyBudgets ? (
          <div className="space-y-4">
            {incomTablePanel}
            {expenseTablePanel}
          </div>
        ) : emptyPanel}
      </div>
    </div>
  );

}
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatInputAmount } from "@/lib/format";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, CalendarIcon, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectBudgetWidget from "@/components/ProjectBudgetWidget";

export default function ProjectBudgetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, updateProjectBudget, deleteProjectBudget, addProjectExpense, deleteProjectExpense } = useBudget();

  const project = useMemo(
    () => (data.projectBudgets ?? []).find(p => p.id === projectId),
    [data.projectBudgets, projectId]
  );
  const projectExpenses = useMemo(
    () => (data.projectExpenses ?? []).filter(e => e.projectId === projectId),
    [data.projectExpenses, projectId]
  );

  // State — all hooks called unconditionally
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project?.name ?? "");
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(formatInputAmount(String(project?.totalBudget ?? 0)));
  const [newCatName, setNewCatName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expDate, setExpDate] = useState<Date>(new Date());
  const [expCalOpen, setExpCalOpen] = useState(false);
  const [linkedTxId, setLinkedTxId] = useState("");

  const linkedTxIds = useMemo(
    () => new Set((data.projectExpenses ?? []).filter(e => e.transactionId).map(e => e.transactionId!)),
    [data.projectExpenses]
  );
  const linkableTransactions = useMemo(
    () => data.transactions.filter(t => t.type === "expense" && !linkedTxIds.has(t.id)).slice(0, 60),
    [data.transactions, linkedTxIds]
  );

  if (!project) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="ghost" asChild>
          <Link to="/budget">Back to Budget</Link>
        </Button>
      </div>
    );
  }

  const totalSpent = projectExpenses.reduce((s, e) => s + e.amount, 0);

  const saveName = () => {
    if (!nameInput.trim()) return;
    updateProjectBudget(project.id, { name: nameInput.trim() });
    setEditingName(false);
    toast.success("Project name updated");
  };

  const saveBudget = () => {
    const amount = parseFloat(budgetInput.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    updateProjectBudget(project.id, { totalBudget: amount });
    setEditingBudget(false);
    toast.success("Budget updated");
  };

  const addCategoryToProject = () => {
    if (!newCatName.trim()) return;
    if (project.categories.includes(newCatName.trim())) { toast.error("Category already exists"); return; }
    updateProjectBudget(project.id, { categories: [...project.categories, newCatName.trim()] });
    setNewCatName("");
    toast.success("Category added");
  };

  const removeCategoryFromProject = (cat: string) => {
    updateProjectBudget(project.id, { categories: project.categories.filter(c => c !== cat) });
    toast.success("Category removed");
  };

  const prefillFromTransaction = (txId: string) => {
    setLinkedTxId(txId);
    const tx = data.transactions.find(t => t.id === txId);
    if (!tx) return;
    setExpAmount(formatInputAmount(String(tx.amount)));
    setExpCategory(tx.category);
    setExpDescription(tx.description);
    setExpDate(new Date(tx.date + "T12:00:00"));
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!expCategory) { toast.error("Select a category"); return; }

    addProjectExpense({
      projectId: project.id,
      category: expCategory,
      amount,
      description: expDescription,
      date: format(expDate, "yyyy-MM-dd"),
      transactionId: linkedTxId || undefined,
    });

    // Auto-close check
    if (project.autoClose && (totalSpent + amount) >= project.totalBudget) {
      updateProjectBudget(project.id, { status: "closed", closedAt: new Date().toISOString() });
      toast.success("Expense added — project auto-closed, budget exhausted!");
    } else {
      toast.success("Expense added");
    }

    setExpAmount("");
    setExpCategory("");
    setExpDescription("");
    setExpDate(new Date());
    setLinkedTxId("");
  };

  const handleDeleteProject = () => {
    deleteProjectBudget(project.id);
    toast.success("Project deleted");
    window.history.back();
  };

  const settingsPanel = (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Budget Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total budget */}
        <div className="space-y-1.5">
          <Label className="text-xs">Total Budget</Label>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                <Input
                  className="pl-7"
                  value={budgetInput}
                  onChange={e => setBudgetInput(formatInputAmount(e.target.value))}
                  onKeyDown={e => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditingBudget(false); }}
                  autoFocus
                />
              </div>
              <Button size="sm" onClick={saveBudget}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingBudget(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-heading font-semibold text-lg">{formatCurrency(project.totalBudget)}</p>
              <button
                onClick={() => { setEditingBudget(true); setBudgetInput(formatInputAmount(String(project.totalBudget))); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Auto-close toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Auto-close when exhausted</p>
            <p className="text-xs text-muted-foreground">Closes automatically when spending reaches 100%</p>
          </div>
          <Switch
            checked={project.autoClose}
            onCheckedChange={v => updateProjectBudget(project.id, { autoClose: v })}
          />
        </div>
      </CardContent>
    </Card>
  );

  const categoriesPanel = (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategoryToProject()}
            className="text-xs"
          />
          <Button size="sm" onClick={addCategoryToProject}><Plus className="w-4 h-4" /></Button>
        </div>
        {project.categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">No categories yet. Add one to start logging expenses.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.categories.map(cat => (
              <div key={cat} className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-1 text-xs">
                {cat}
                <button
                  onClick={() => removeCategoryFromProject(cat)}
                  className="text-muted-foreground hover:text-expense ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const logExpensePanel = project.status === "active" && (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Log Expense</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Link to existing transaction */}
        {linkableTransactions.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs block text-left w-full">Link existing transaction (optional)</Label>
            <Select value={linkedTxId} onValueChange={prefillFromTransaction}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Import from a transaction" />
              </SelectTrigger>
              <SelectContent>
                {linkableTransactions.map(tx => (
                  <SelectItem key={tx.id} value={tx.id}>
                    {tx.date} · {tx.category} · {formatCurrency(tx.amount)}
                    {tx.description ? ` · ${tx.description}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedTxId && (
              <button
                type="button"
                onClick={() => setLinkedTxId("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear link
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs block text-left w-full">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
              <Input
                className="pl-7"
                placeholder="0"
                value={expAmount}
                onChange={e => setExpAmount(formatInputAmount(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs block text-left w-full">Category</Label>
            <Select value={expCategory} onValueChange={setExpCategory}>
              <SelectTrigger>
                <SelectValue placeholder={project.categories.length === 0 ? "Add a category first" : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {project.categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs block text-left w-full">Date</Label>
            <Popover open={expCalOpen} onOpenChange={setExpCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs px-2.5")}>
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{format(expDate, "MMM d, yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expDate}
                  onSelect={d => { if (d) { setExpDate(d); setExpCalOpen(false); } }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs block text-left w-full">Note (optional)</Label>
            <Input
              placeholder="What was this for?"
              className="text-xs"
              value={expDescription}
              onChange={e => setExpDescription(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleAddExpense} className="w-full" disabled={project.categories.length === 0}>
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </Button>
      </CardContent>
    </Card>
  );

  const recentExpensesPanel = (
    <div className="space-y-2">
      <h3 className="font-heading font-semibold text-sm">Recent Expenses</h3>
      {projectExpenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses logged yet.</p>
      ) : (
        <div className="space-y-2">
          {[...projectExpenses]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(exp => (
              <div
                key={exp.id}
                className="flex items-center justify-between bg-card/60 rounded-lg px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{exp.category}</p>
                    {exp.transactionId && (
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">linked</span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-muted-foreground truncate">{exp.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{exp.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="font-heading font-semibold text-expense">{formatCurrency(exp.amount)}</p>
                  <button
                    onClick={() => { deleteProjectExpense(exp.id); toast.success("Expense removed"); }}
                    className="text-muted-foreground hover:text-expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/budget"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") { setEditingName(false); setNameInput(project.name); }
                }}
                className="font-heading font-bold text-lg h-9 max-w-xs"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={saveName}><Check className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { setEditingName(false); setNameInput(project.name); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-lg truncate">{project.name}</h2>
              <button
                onClick={() => setEditingName(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-muted-foreground text-sm mt-0.5">Project budget</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            project.status === "active"
              ? "bg-income/15 text-income"
              : "bg-secondary text-muted-foreground"
          }`}>
            {project.status === "active" ? "Active" : "Closed"}
          </span>
          {project.status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateProjectBudget(project.id, { status: "closed", closedAt: new Date().toISOString() });
                toast.success("Project closed");
              }}
            >
              Close
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateProjectBudget(project.id, { status: "active", closedAt: undefined });
                toast.success("Project reopened");
              }}
            >
              Reopen
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDeleteProject} className="text-muted-foreground hover:text-expense">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop: two columns */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        {/* Left: widget + recent expenses */}
        <div className="space-y-4">
          <ProjectBudgetWidget project={project} expenses={projectExpenses} />
          {recentExpensesPanel}
        </div>
        {/* Right: settings + categories + log expense */}
        <div className="space-y-4">
          {settingsPanel}
          {categoriesPanel}
          {logExpensePanel}
        </div>
      </div>

      {/* Mobile: single column */}
      <div className="lg:hidden space-y-4">
        <ProjectBudgetWidget project={project} expenses={projectExpenses} />
        {settingsPanel}
        {categoriesPanel}
        {logExpensePanel}
        {recentExpensesPanel}
      </div>
    </div>
  );
}

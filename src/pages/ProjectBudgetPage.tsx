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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, CalendarIcon, Plus, Trash2, Pencil, Check, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectBudgetWidget from "@/components/ProjectBudgetWidget";

export default function ProjectBudgetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    data,
    updateProjectBudget,
    deleteProjectBudget,
    addProjectBudgetLine,
    updateProjectBudgetLines,
    deleteProjectBudgetLine,
    addProjectExpense,
    deleteProjectExpense,
  } = useBudget();

  const project = useMemo(
    () => (data.projectBudgets ?? []).find(p => p.id === projectId),
    [data.projectBudgets, projectId]
  );
  const projectLines = useMemo(
    () => (data.projectBudgetLines ?? []).filter(l => l.projectId === projectId),
    [data.projectBudgetLines, projectId]
  );
  const projectExpenses = useMemo(
    () => (data.projectExpenses ?? []).filter(e => e.projectId === projectId),
    [data.projectExpenses, projectId]
  );

  // Editable name
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project?.name ?? "");

  // Budget line form
  const [lineCategory, setLineCategory] = useState("");
  const [lineAmount, setLineAmount] = useState("");
  const [lineNote, setLineNote] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editLimits, setEditLimits] = useState<Record<string, string>>({});

  // Log expense form
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

  const expenseByCategory: Record<string, number> = {};
  projectExpenses.forEach(e => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });
  const totalBudget = projectLines.reduce((s, l) => s + l.limit, 0);
  const totalSpent = projectExpenses.reduce((s, e) => s + e.amount, 0);

  const saveName = () => {
    if (!nameInput.trim()) return;
    updateProjectBudget(project.id, { name: nameInput.trim() });
    setEditingName(false);
    toast.success("Project name updated");
  };

  const addCategoryToProject = () => {
    if (!newCatName.trim()) return;
    if (project.categories.includes(newCatName.trim())) { toast.error("Category already exists"); return; }
    updateProjectBudget(project.id, { categories: [...project.categories, newCatName.trim()] });
    setNewCatName("");
    setShowNewCat(false);
    toast.success("Category added");
  };

  const handleAddBudgetLine = () => {
    if (!lineCategory) { toast.error("Select a category"); return; }
    const amount = parseFloat(lineAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    addProjectBudgetLine({ projectId: project.id, category: lineCategory, limit: amount, note: lineNote.trim() || undefined });
    setLineCategory("");
    setLineAmount("");
    setLineNote("");
    toast.success("Budget line added");
  };

  const hasLineEdits = Object.keys(editLimits).length > 0;

  const handleSaveLines = () => {
    const updated = (data.projectBudgetLines ?? []).map(l =>
      editLimits[l.id] !== undefined
        ? { ...l, limit: parseFloat(editLimits[l.id].replace(/,/g, "")) || 0 }
        : l
    );
    updateProjectBudgetLines(updated);
    setEditLimits({});
    toast.success("Budget updated");
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
    if (project.autoClose && (totalSpent + amount) >= totalBudget && totalBudget > 0) {
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

  // --- Panel definitions ---

  const budgetLinesPanel = (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading">Budget Lines</CardTitle>
          {hasLineEdits && (
            <Button size="sm" onClick={handleSaveLines}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Add line form */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
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
                    onKeyDown={e => e.key === "Enter" && addCategoryToProject()}
                    className="text-xs"
                  />
                  <Button type="button" size="sm" onClick={addCategoryToProject}>Add</Button>
                </div>
              )}
              <Select value={lineCategory} onValueChange={setLineCategory}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {project.categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
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
                  value={lineAmount}
                  onChange={e => setLineAmount(formatInputAmount(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs h-5 flex items-center">Note (optional)</Label>
              <Input
                placeholder="e.g. materials, labour"
                value={lineNote}
                onChange={e => setLineNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddBudgetLine()}
              />
            </div>
          </div>
          <Button onClick={handleAddBudgetLine} size="sm" className="w-full sm:w-auto">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
          </Button>
        </div>

        {/* Lines table */}
        {projectLines.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
              <span>Category / Note</span>
              <span>{totalSpent > 0 ? `${formatCurrency(totalSpent)} spent of ` : ""}{formatCurrency(totalBudget)} budget</span>
            </div>
            <div className="divide-y divide-border rounded-xl overflow-hidden bg-card shadow-sm">
              {projectLines.map(line => {
                const actual = expenseByCategory[line.category] || 0;
                const pct = line.limit > 0 ? Math.min((actual / line.limit) * 100, 100) : 0;
                const over = actual > line.limit;
                const isEditing = line.id in editLimits;

                return (
                  <div key={line.id} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium">{line.category}</span>
                        {line.note && <span className="text-xs text-muted-foreground"> · {line.note}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditing ? (
                          <Input
                            className="h-6 text-xs text-right w-24"
                            value={editLimits[line.id]}
                            onChange={e => setEditLimits(p => ({ ...p, [line.id]: formatInputAmount(e.target.value) }))}
                            onKeyDown={e => e.key === "Enter" && handleSaveLines()}
                            autoFocus
                          />
                        ) : (
                          <button
                            className={`text-xs font-medium inline-flex items-center gap-1 hover:text-primary transition-colors group ${over ? "text-expense" : ""}`}
                            onClick={() => setEditLimits(p => ({ ...p, [line.id]: String(line.limit) }))}
                          >
                            {formatCurrency(line.limit)}
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                        <button
                          className="text-muted-foreground hover:text-expense p-0.5"
                          onClick={() => { deleteProjectBudgetLine(line.id); toast.success("Budget line removed"); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-1 mt-1.5 ${over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const settingsPanel = (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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

  const logExpensePanel = project.status === "active" && (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Log Expense</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
              <button type="button" onClick={() => setLinkedTxId("")} className="text-xs text-muted-foreground hover:text-foreground">
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
              <Input className="pl-7" placeholder="0" value={expAmount} onChange={e => setExpAmount(formatInputAmount(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs block text-left w-full">Category</Label>
            <Select value={expCategory} onValueChange={setExpCategory}>
              <SelectTrigger>
                <SelectValue placeholder={project.categories.length === 0 ? "Add categories first" : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {project.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            <Input placeholder="What was this for?" className="text-xs" value={expDescription} onChange={e => setExpDescription(e.target.value)} />
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
              <div key={exp.id} className="flex items-center justify-between bg-card/60 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{exp.category}</p>
                    {exp.transactionId && (
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">linked</span>
                    )}
                  </div>
                  {exp.description && <p className="text-xs text-muted-foreground truncate">{exp.description}</p>}
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
              <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-muted-foreground text-sm mt-0.5">Project budget</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            project.status === "active" ? "bg-income/15 text-income" : "bg-secondary text-muted-foreground"
          }`}>
            {project.status === "active" ? "Active" : "Closed"}
          </span>
          {project.status === "active" ? (
            <Button size="sm" variant="outline" onClick={() => {
              updateProjectBudget(project.id, { status: "closed", closedAt: new Date().toISOString() });
              toast.success("Project closed");
            }}>
              Close
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => {
              updateProjectBudget(project.id, { status: "active", closedAt: undefined });
              toast.success("Project reopened");
            }}>
              Reopen
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { deleteProjectBudget(project.id); toast.success("Project deleted"); window.history.back(); }}
            className="text-muted-foreground hover:text-expense"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop: two columns */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <div className="space-y-4">
          <ProjectBudgetWidget project={project} budgetLines={projectLines} expenses={projectExpenses} />
          {recentExpensesPanel}
        </div>
        <div className="space-y-4">
          {budgetLinesPanel}
          {settingsPanel}
          {logExpensePanel}
        </div>
      </div>

      {/* Mobile: single column */}
      <div className="lg:hidden space-y-4">
        <ProjectBudgetWidget project={project} budgetLines={projectLines} expenses={projectExpenses} />
        {budgetLinesPanel}
        {settingsPanel}
        {logExpensePanel}
        {recentExpensesPanel}
      </div>
    </div>
  );
}

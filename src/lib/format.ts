export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}₦${formatted}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getMonthOptions(includeAll = false) {
  const months: { value: string; label: string }[] = [];
  if (includeAll) months.push({ value: "all", label: "All Time" });
  const year = new Date().getFullYear();
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    const val = `${year}-${String(m + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: includeAll ? "long" : "short", year: "numeric" });
    months.push({ value: val, label });
  }
  return months;
}

export function formatInputAmount(val: string): string {
  const clean = val.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
}

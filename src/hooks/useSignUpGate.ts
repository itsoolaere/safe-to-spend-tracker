import { useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useAuth } from "@/context/AuthContext";

const GUEST_START_KEY = "guest_started_at";

function getGuestStart(): number {
  const stored = localStorage.getItem(GUEST_START_KEY);
  if (stored) return Number(stored);
  const now = Date.now();
  localStorage.setItem(GUEST_START_KEY, String(now));
  return now;
}

export function useSignUpGate() {
  const { user } = useAuth();
  const { data } = useBudget();

  const shouldPromptSignUp = useMemo(() => {
    // Authenticated users never see the gate
    if (user) return false;

    const guestStart = getGuestStart();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const expired = Date.now() - guestStart > weekMs;

    const incomeCount = data.transactions.filter((t) => t.type === "income").length;
    const expenseCount = data.transactions.filter((t) => t.type === "expense").length;
    const thresholdMet = incomeCount >= 1 && expenseCount >= 7;

    return expired || thresholdMet;
  }, [user, data.transactions]);

  return { shouldPromptSignUp };
}

import { useMemo, useState, useEffect, useCallback } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useAuth } from "@/context/AuthContext";

const GUEST_START_KEY = "guest_started_at";
export const GUEST_MAX_INCOME = 1;
export const GUEST_MAX_EXPENSE = 7;

const MANUAL_TRIGGER_EVENT = "signup-gate-manual";
const DISMISS_EVENT = "signup-gate-dismiss";

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
  const [manualTrigger, setManualTriggerState] = useState(false);
  const [dismissed, setDismissedState] = useState(false);

  useEffect(() => {
    const onManual = () => { setManualTriggerState(true); setDismissedState(false); };
    const onDismiss = () => setDismissedState(true);
    window.addEventListener(MANUAL_TRIGGER_EVENT, onManual);
    window.addEventListener(DISMISS_EVENT, onDismiss);
    return () => {
      window.removeEventListener(MANUAL_TRIGGER_EVENT, onManual);
      window.removeEventListener(DISMISS_EVENT, onDismiss);
    };
  }, []);

  useEffect(() => {
    if (user) { setManualTriggerState(false); setDismissedState(false); }
  }, [user]);

  const setManualTrigger = useCallback((v: boolean) => {
    if (v) window.dispatchEvent(new Event(MANUAL_TRIGGER_EVENT));
    else setManualTriggerState(false);
  }, []);

  const dismiss = useCallback(() => {
    window.dispatchEvent(new Event(DISMISS_EVENT));
    setManualTriggerState(false);
  }, []);

  const gateInfo = useMemo(() => {
    if (user) return { shouldPromptSignUp: false, isGateLocked: false, reason: "", freeLeft: Infinity, incomeLeft: 0, expenseLeft: 0 };

    const guestStart = getGuestStart();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const expired = Date.now() - guestStart > weekMs;

    const incomeCount = data.transactions.filter((t) => t.type === "income").length;
    const expenseCount = data.transactions.filter((t) => t.type === "expense").length;
    const thresholdMet = incomeCount >= GUEST_MAX_INCOME && expenseCount >= GUEST_MAX_EXPENSE;

    const incomeLeft = Math.max(0, GUEST_MAX_INCOME - incomeCount);
    const expenseLeft = Math.max(0, GUEST_MAX_EXPENSE - expenseCount);
    const freeLeft = incomeLeft + expenseLeft;

    const isGateLocked = expired || thresholdMet;

    let reason = "";
    if (expired) {
      reason = "your free trial week has ended.";
    } else if (thresholdMet) {
      reason = `you've reached the guest limit of ${GUEST_MAX_INCOME} income and ${GUEST_MAX_EXPENSE} expense entries.`;
    }

    const showModal = (isGateLocked && !dismissed) || manualTrigger;

    return { shouldPromptSignUp: showModal, isGateLocked, reason, freeLeft, incomeLeft, expenseLeft };
  }, [user, data.transactions, manualTrigger, dismissed]);

  return { ...gateInfo, manualTrigger, setManualTrigger, dismiss };
}

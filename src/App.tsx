import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import BudgetVsActual from "@/pages/BudgetVsActual";
import TransactionHistory from "@/pages/TransactionHistory";
import NotFound from "./pages/NotFound";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import { useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

function AppRoutes() {
  const { passwordRecovery, clearPasswordRecovery } = useAuth();

  return (
    <>
      <ResetPasswordModal open={passwordRecovery} onDone={clearPasswordRecovery} />
      <Routes>
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/reset-password" element={<Navigate to="/" replace />} />
        <Route
          path="/*"
          element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/budget" element={<BudgetVsActual />} />
                <Route path="/history" element={<TransactionHistory />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BudgetProvider>
            <AppRoutes />
          </BudgetProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

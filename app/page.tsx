"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PieChart,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/lib/supabase";
import type { DashboardSummary, Transaction, Debt } from "@/types/financial";

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } =
          await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false })
            .limit(5);

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
        }

        // Fetch active debts
        const { data: debtsData, error: debtsError } = await supabase
          .from("debts")
          .select("*")
          .eq("status", "active")
          .order("total_amount", { ascending: false })
          .limit(5);

        if (debtsError) {
          console.error("Error fetching debts:", debtsError);
        }

        // Calculate dashboard summary from transactions
        if (transactionsData) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const monthlyTransactions = transactionsData.filter((t) => {
            const date = new Date(t.date);
            return (
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            );
          });

          const monthlyIncome = monthlyTransactions
            .filter((t) => t.category === "income")
            .reduce((sum, t) => sum + t.amount, 0);

          const monthlyExpenses = monthlyTransactions
            .filter((t) => t.category !== "income")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const monthlyDebtPayments = (debtsData || [])
            .filter((d) => {
              // Assuming 'due_day' can be used to infer monthly payments
              // This logic might need adjustment based on how debt payments are tracked
              const paymentDate = new Date(
                currentYear,
                currentMonth,
                d.due_day
              );
              return (
                paymentDate.getMonth() === currentMonth &&
                paymentDate.getFullYear() === currentYear
              );
            })
            .reduce((sum, d) => sum + (d.installment_amount || 0), 0); // Assuming 'installment_amount' for monthly payment

          const totalDebtBalance = (debtsData || []).reduce(
            (sum, d) => sum + d.total_amount,
            0
          );

          setDashboardData({
            monthly_income: monthlyIncome,
            monthly_expenses: monthlyExpenses,
            monthly_balance: monthlyIncome - monthlyExpenses,
            monthly_debt_payments: monthlyDebtPayments,
            total_debt_balance: totalDebtBalance,
          });
        }

        setTransactions(transactionsData || []);
        setDebts(debtsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-6 w-6 mr-2" />
                  Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData?.monthly_balance?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2" />
                  Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData?.monthly_income?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="h-6 w-6 mr-2" />
                  Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData?.monthly_expenses?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Transações Recentes</h2>
            <div className="bg-card rounded-lg shadow-md overflow-hidden border">
              <div className="p-4 border-b">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="entretenimento">
                      Entretenimento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-4 border-b last:border-b-0"
                  >
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="text-lg font-semibold">
                        {transaction.description}
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {(transaction.amount as number).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Dívidas</h2>
            <div className="bg-card rounded-lg shadow-md overflow-hidden border">
              <div className="p-4 border-b">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as dívidas</SelectItem>
                    <SelectItem value="pendentes">Pendentes</SelectItem>
                    <SelectItem value="pagas">Pagas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {debts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex justify-between items-center p-4 border-b last:border-b-0"
                  >
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Vencimento: {debt.due_day}º dia do mês
                      </div>
                      <div className="text-lg font-semibold">{debt.name}</div>
                    </div>
                    <div className="text-lg font-bold">
                      {(debt.total_amount as number).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

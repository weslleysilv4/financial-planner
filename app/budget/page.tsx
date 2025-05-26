"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  TrendingDown,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Budget, Transaction, Debt } from "@/types/financial";

interface BudgetWithActual extends Budget {
  actual_amount: number;
  difference: number;
}

export default function BudgetPage() {
  const [budgetItems, setBudgetItems] = useState<BudgetWithActual[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const defaultCategories = [
    "Receitas",
    "Moradia",
    "Alimentação",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Outros",
  ];

  useEffect(() => {
    fetchBudgetData();
    fetchDebts();
  }, [selectedMonth, selectedYear]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);

      // Fetch budget items
      const { data: budgetData, error: budgetError } = await supabase
        .from("budget")
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      if (budgetError) throw budgetError;

      // Fetch actual amounts from transactions
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-31`;

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("category, subcategory, amount")
        .gte("date", startDate)
        .lte("date", endDate);

      if (transactionsError) throw transactionsError;

      // Calculate actual amounts by category
      const actualAmounts: Record<string, number> = {};

      // Fetch transactions for the selected month to calculate actual amounts
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .gte(
          "date",
          `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
        )
        .lt(
          "date",
          `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`
        );

      transactionsData?.forEach((transaction: Transaction) => {
        if (
          transaction.category === "fixed_expense" ||
          transaction.category === "variable_expense"
        ) {
          actualAmounts[transaction.subcategory || "other"] =
            (actualAmounts[transaction.subcategory || "other"] || 0) +
            Math.abs(transaction.amount);
        }
      });

      // Combine budget and actual data
      const budgetWithActual: BudgetWithActual[] = (budgetData || []).map(
        (budget: Budget) => ({
          ...budget,
          actual_amount: actualAmounts[budget.category] || 0,
          difference:
            budget.planned_amount - (actualAmounts[budget.category] || 0),
        })
      );

      // Add categories that have actual amounts but no budget
      Object.keys(actualAmounts).forEach((category) => {
        if (!budgetWithActual.find((item) => item.category === category)) {
          budgetWithActual.push({
            id: `temp-${category}`,
            user_id: "",
            month: selectedMonth,
            year: selectedYear,
            category,
            planned_amount: 0,
            actual_amount: actualAmounts[category],
            difference: -actualAmounts[category],
            created_at: "",
            updated_at: "",
          });
        }
      });

      setBudgetItems(budgetWithActual);
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error("Error fetching debts:", error);
    }
  };

  const handleSaveEdit = async (budgetId: string) => {
    try {
      const amount = Number.parseFloat(editValue);
      if (isNaN(amount)) return;

      const budgetItem = budgetItems.find((item) => item.id === budgetId);
      if (!budgetItem) return;

      if (budgetId.startsWith("temp-")) {
        // Create new budget item
        const { error } = await supabase.from("budget").insert([
          {
            month: selectedMonth,
            year: selectedYear,
            category: budgetItem.category,
            planned_amount: amount,
          },
        ]);

        if (error) throw error;
      } else {
        // Update existing budget item
        const { error } = await supabase
          .from("budget")
          .update({ planned_amount: amount })
          .eq("id", budgetId);

        if (error) throw error;
      }

      await fetchBudgetData();
      setEditingId(null);
      setEditValue("");
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory || !newAmount) return;

    try {
      const { error } = await supabase.from("budget").insert([
        {
          month: selectedMonth,
          year: selectedYear,
          category: newCategory,
          planned_amount: Number.parseFloat(newAmount),
        },
      ]);

      if (error) throw error;

      await fetchBudgetData();
      setNewCategory("");
      setNewAmount("");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return "text-green-600";
    if (difference < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      alimentacao: "text-chart-1",
      transporte: "text-chart-2",
      saude: "text-chart-3",
      entretenimento: "text-chart-4",
      outros: "text-chart-5",
    };
    return colors[category] || "text-muted-foreground";
  };

  const totalPlanned = budgetItems.reduce(
    (sum, item) => sum + item.planned_amount,
    0
  );
  const totalActual = budgetItems.reduce(
    (sum, item) => sum + item.actual_amount,
    0
  );
  const totalDifference = totalPlanned - totalActual;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-3xl font-bold text-foreground">Orçamento</h1>
              <p className="text-muted-foreground">
                Gerencie seu orçamento mensal e controle seus gastos por
                categoria.
              </p>
            </div>

            <div className="flex space-x-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) =>
                  setSelectedMonth(Number.parseInt(value))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleDateString("pt-BR", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(value) =>
                  setSelectedYear(Number.parseInt(value))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="new-category">Categoria</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      {debts.map((debt) => (
                        <SelectItem
                          key={debt.id}
                          value={`Dívida: ${debt.name}`}
                        >
                          Dívida: {debt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="new-amount">Valor Planejado (R$)</Label>
                  <Input
                    id="new-amount"
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddCategory}
                    disabled={!newCategory || !newAmount}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Orçamento -{" "}
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
                  "pt-BR",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p>
                    Nenhum orçamento encontrado. Crie seu primeiro orçamento!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria Orçamentária</TableHead>
                        <TableHead>Planejado (R$)</TableHead>
                        <TableHead>Realizado (R$)</TableHead>
                        <TableHead>Diferença (R$)</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.category}
                          </TableCell>
                          <TableCell>
                            {editingId === item.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-32"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(item.id)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditValue("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>
                                  {formatCurrency(item.planned_amount)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditValue(
                                      item.planned_amount.toString()
                                    );
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(item.actual_amount)}
                          </TableCell>
                          <TableCell
                            className={getDifferenceColor(item.difference)}
                          >
                            {formatCurrency(item.difference)}
                          </TableCell>
                          <TableCell>
                            {item.difference < 0 && (
                              <span className="text-xs text-destructive">
                                Acima do planejado
                              </span>
                            )}
                            {item.difference > 0 && (
                              <span className="text-xs text-green-600">
                                Dentro do orçamento
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totals Row */}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell>{formatCurrency(totalPlanned)}</TableCell>
                        <TableCell>{formatCurrency(totalActual)}</TableCell>
                        <TableCell
                          className={getDifferenceColor(totalDifference)}
                        >
                          {formatCurrency(totalDifference)}
                        </TableCell>
                        <TableCell>
                          {totalDifference < 0 && (
                            <span className="text-xs text-destructive">
                              Déficit
                            </span>
                          )}
                          {totalDifference > 0 && (
                            <span className="text-xs text-green-600">
                              Superávit
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Planejado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalPlanned)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Realizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">
                  {formatCurrency(totalActual)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diferença</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getDifferenceColor(
                    totalDifference
                  )}`}
                >
                  {formatCurrency(totalDifference)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalDifference >= 0 ? "Superávit" : "Déficit"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

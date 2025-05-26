"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { supabase } from "@/lib/supabase";
import type { Transaction, Debt } from "@/types/financial";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    category: "income" as
      | "income"
      | "fixed_expense"
      | "variable_expense"
      | "debt_payment",
    subcategory: "",
    amount: "",
    account_source: "",
    debt_id: "",
  });

  useEffect(() => {
    fetchTransactions();
    fetchDebts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const transactionData = {
        date: formData.date,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        amount: Number.parseFloat(formData.amount),
        account_source: formData.account_source || null,
        debt_id: formData.debt_id || null,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", editingTransaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert([transactionData]);

        if (error) throw error;
      }

      await fetchTransactions();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      subcategory: transaction.subcategory || "",
      amount: Math.abs(transaction.amount).toString(),
      account_source: transaction.account_source || "",
      debt_id: transaction.debt_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      description: "",
      category: "income",
      subcategory: "",
      amount: "",
      account_source: "",
      debt_id: "",
    });
    setEditingTransaction(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      income: "default",
      fixed_expense: "secondary",
      variable_expense: "outline",
      debt_payment: "destructive",
    } as const;

    const labels = {
      income: "Receita",
      fixed_expense: "Despesa Fixa",
      variable_expense: "Despesa Variável",
      debt_payment: "Pagamento Dívida",
    };

    return (
      <Badge variant={variants[category as keyof typeof variants]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
      return false;
    }
    if (formData.date && !transaction.date.startsWith(formData.date)) {
      return false;
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Meus Lançamentos
              </h1>
              <p className="text-muted-foreground">
                Registre todas as suas transações financeiras
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction
                      ? "Editar Lançamento"
                      : "Adicionar Novo Lançamento"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Valor (R$) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            category: value as any,
                            subcategory: "",
                            debt_id: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="fixed_expense">
                            Despesa Fixa
                          </SelectItem>
                          <SelectItem value="variable_expense">
                            Despesa Variável
                          </SelectItem>
                          <SelectItem value="debt_payment">
                            Pagamento Dívida
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subcategory">Subcategoria</Label>
                      {formData.category === "debt_payment" ? (
                        <Select
                          value={formData.debt_id}
                          onValueChange={(value) => {
                            const selectedDebt = debts.find(
                              (d) => d.id === value
                            );
                            setFormData({
                              ...formData,
                              debt_id: value,
                              subcategory: selectedDebt?.name || "",
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a dívida" />
                          </SelectTrigger>
                          <SelectContent>
                            {debts.map((debt) => (
                              <SelectItem key={debt.id} value={debt.id}>
                                {debt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="subcategoria"
                          value={formData.subcategory}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subcategory: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="account_source">Conta/Origem</Label>
                    <Input
                      id="account_source"
                      value={formData.account_source}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          account_source: e.target.value,
                        })
                      }
                      placeholder="Ex: Conta Corrente, Carteira, etc."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingTransaction
                        ? "Atualizar Lançamento"
                        : "Salvar Lançamento"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-category">Categoria</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="fixed_expense">
                        Despesa Fixa
                      </SelectItem>
                      <SelectItem value="variable_expense">
                        Despesa Variável
                      </SelectItem>
                      <SelectItem value="debt_payment">
                        Pagamento Dívida
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-month">Mês/Ano</Label>
                  <Input
                    id="filter-month"
                    type="month"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p>Nenhum lançamento encontrado.</p>
                  <p className="text-sm">
                    Clique em "Adicionar Lançamento" para começar.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Mês/Ano</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Subcategoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Conta/Origem</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>
                            {getMonthYear(transaction.date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(transaction.category)}
                          </TableCell>
                          <TableCell>
                            {transaction.subcategory || "-"}
                          </TableCell>
                          <TableCell
                            className={
                              transaction.amount >= 0
                                ? "text-green-600"
                                : "text-destructive"
                            }
                          >
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {transaction.account_source || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

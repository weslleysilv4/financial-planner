"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
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
import { Progress } from "@/components/ui/progress";
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
import type { Debt } from "@/types/financial";

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    monthly_interest_rate: "",
    minimum_payment: "",
    due_day: "",
    priority_strategy: "avalanche" as "avalanche" | "snowball" | "custom",
    status: "active" as "active" | "negotiated" | "paid",
    notes: "",
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error("Error fetching debts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const debtData = {
        name: formData.name,
        total_amount: Number.parseFloat(formData.total_amount),
        monthly_interest_rate:
          Number.parseFloat(formData.monthly_interest_rate) || 0,
        minimum_payment: Number.parseFloat(formData.minimum_payment),
        due_day: Number.parseInt(formData.due_day),
        priority_strategy: formData.priority_strategy,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingDebt) {
        const { error } = await supabase
          .from("debts")
          .update(debtData)
          .eq("id", editingDebt.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("debts").insert([
          {
            name: debtData.name,
            total_amount: debtData.total_amount,
            monthly_interest_rate: debtData.monthly_interest_rate,
            minimum_payment: debtData.minimum_payment,
            due_day: debtData.due_day,
            priority_strategy: debtData.priority_strategy as
              | "avalanche"
              | "snowball"
              | "custom",
            status: debtData.status as "active" | "negotiated" | "paid",
            notes: debtData.notes,
          },
        ]);

        if (error) throw error;
      }

      await fetchDebts();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving debt:", error);
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      total_amount: debt.total_amount.toString(),
      monthly_interest_rate: debt.monthly_interest_rate.toString(),
      minimum_payment: debt.minimum_payment.toString(),
      due_day: debt.due_day.toString(),
      priority_strategy: debt.priority_strategy,
      status: debt.status,
      notes: debt.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta dívida?")) return;

    try {
      const { error } = await supabase.from("debts").delete().eq("id", id);

      if (error) throw error;
      await fetchDebts();
    } catch (error) {
      console.error("Error deleting debt:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      total_amount: "",
      monthly_interest_rate: "",
      minimum_payment: "",
      due_day: "",
      priority_strategy: "avalanche",
      status: "active",
      notes: "",
    });
    setEditingDebt(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "destructive",
      negotiated: "secondary",
      paid: "default",
    } as const;

    const labels = {
      active: "Ativa",
      negotiated: "Negociada",
      paid: "Paga",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityLabel = (strategy: string) => {
    const labels = {
      avalanche: "Avalanche",
      snowball: "Bola de Neve",
      custom: "Personalizada",
    };
    return labels[strategy as keyof typeof labels];
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Minhas Dívidas
              </h1>
              <p className="text-muted-foreground">
                Gerencie todas as suas dívidas em um só lugar
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Nova Dívida
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDebt ? "Editar Dívida" : "Adicionar Nova Dívida"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome da Dívida *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_amount">
                        Valor Total Devido (R$) *
                      </Label>
                      <Input
                        id="total_amount"
                        type="number"
                        step="0.01"
                        value={formData.total_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthly_interest_rate">
                        Taxa de Juros Mensal (%)
                      </Label>
                      <Input
                        id="monthly_interest_rate"
                        type="number"
                        step="0.01"
                        value={formData.monthly_interest_rate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthly_interest_rate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimum_payment">
                        Pagamento Mínimo (R$) *
                      </Label>
                      <Input
                        id="minimum_payment"
                        type="number"
                        step="0.01"
                        value={formData.minimum_payment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minimum_payment: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="due_day">Dia do Vencimento</Label>
                      <Input
                        id="due_day"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.due_day}
                        onChange={(e) =>
                          setFormData({ ...formData, due_day: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority_strategy">
                        Estratégia de Prioridade
                      </Label>
                      <Select
                        value={formData.priority_strategy}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            priority_strategy: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="avalanche">Avalanche</SelectItem>
                          <SelectItem value="snowball">Bola de Neve</SelectItem>
                          <SelectItem value="custom">Personalizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="negotiated">Negociada</SelectItem>
                          <SelectItem value="paid">Paga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
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
                      {editingDebt ? "Atualizar Dívida" : "Salvar Dívida"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Dívidas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : debts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p>Nenhuma dívida cadastrada ainda.</p>
                  <p className="text-sm">
                    Clique em "Adicionar Nova Dívida" para começar.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome da Dívida</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Taxa Juros (%)</TableHead>
                        <TableHead>Pag. Mínimo</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Estratégia</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debts.map((debt) => (
                        <TableRow key={debt.id}>
                          <TableCell className="font-medium">
                            {debt.name}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(debt.total_amount)}
                          </TableCell>
                          <TableCell>{debt.monthly_interest_rate}%</TableCell>
                          <TableCell>
                            {formatCurrency(debt.minimum_payment)}
                          </TableCell>
                          <TableCell>Dia {debt.due_day}</TableCell>
                          <TableCell>
                            {getPriorityLabel(debt.priority_strategy)}
                          </TableCell>
                          <TableCell>{getStatusBadge(debt.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(debt)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(debt.id)}
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

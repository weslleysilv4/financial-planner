"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft } from "lucide-react";
import { resetPasswordAction } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");

    const email = formData.get("email") as string;
    setEmail(email);

    try {
      const result = await resetPasswordAction(email);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
        setSuccessMessage(result.message || "Email de recuperação enviado!");
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-green-600 dark:text-green-400">
                Email enviado!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">{successMessage}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Enviamos um link para <strong>{email}</strong>. Verifique sua
                caixa de entrada e siga as instruções no email.
              </p>
              <Button asChild>
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Planner Financeiro
          </h1>
          <p className="mt-2 text-muted-foreground">Recupere o acesso à sua conta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Esqueceu a senha?
            </CardTitle>
            <CardDescription className="text-center">
              Digite seu email para receber um link de redefinição de senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar link de recuperação
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

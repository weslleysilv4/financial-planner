import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth-server";

interface ProtectedPageProps {
  children: ReactNode;
}

export default async function ProtectedPage({ children }: ProtectedPageProps) {
  await requireAuth(); // This will redirect to login if not authenticated

  return <>{children}</>;
}

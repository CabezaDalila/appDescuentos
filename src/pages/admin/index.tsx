import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";
import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { useAdmin } from "@/hooks/useAdmin";
import { LayoutAdmin } from "@/layouts/layout-admin";
import { Shield } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AdminPage() {
  const { isAdmin, adminLoading, user } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!user && !adminLoading) {
      router.push("/login");
    }
  }, [user, adminLoading, router]);

  if (!user || adminLoading) {
    return null;
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos de administrador para acceder a esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LayoutAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
          </div>
          <p className="text-muted-foreground">
            Dashboard principal con métricas y estadísticas de la plataforma
          </p>
        </div>

        {/* Dashboard con métricas */}
        <AdminDashboard />

      </div>
    </LayoutAdmin>
  );
}

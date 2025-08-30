import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/Share/tabs";
import { ManualDiscountsManager } from "@/components/admin/ManualDiscountsManager";
import { ScrapingScriptsManager } from "@/components/admin/ScrapingScriptsManager";
import { useAdmin } from "@/hooks/useAdmin";
import { Code, Gift, Shield } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const { isAdmin, adminLoading, user } = useAdmin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("scripts");

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
        </div>
        <p className="text-muted-foreground">
          Gestiona scripts de scraping y carga descuentos manualmente
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Scripts de Scraping
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Descuentos Manuales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-6">
          <ScrapingScriptsManager />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <ManualDiscountsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

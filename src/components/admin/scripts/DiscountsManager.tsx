import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/Share/tabs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DiscountApprovalManager } from "./DiscountApprovalManager";
import { ManualDiscountsManager } from "./ManualDiscountsManager";

export function DiscountsManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("manual");

  useEffect(() => {
    // Si estamos en /admin/approvals, activar el tab de aprobaciones
    if (router.pathname === "/admin/approvals") {
      setActiveTab("approvals");
      // Redirigir a /admin/discounts pero mantener el tab activo
      router.replace("/admin/discounts?tab=approvals", undefined, {
        shallow: true,
      });
    } else if (router.query.tab === "approvals") {
      setActiveTab("approvals");
    } else {
      setActiveTab("manual");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, router.query.tab]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="manual">Descuentos Manuales</TabsTrigger>
          <TabsTrigger value="approvals">Pendiente de Aprobación</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="space-y-6">
          <ManualDiscountsManager />
        </TabsContent>
        <TabsContent value="approvals" className="space-y-6">
          <DiscountApprovalManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Button } from "@/components/Share/button";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DiscountApprovalManager } from "./DiscountApprovalManager";
import { ManualDiscountsManager } from "./ManualDiscountsManager";

export function DiscountsManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [showForm, setShowForm] = useState(false);

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

  // Cerrar el formulario cuando cambia el tab
  useEffect(() => {
    setShowForm(false);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Título común con botón */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Descuentos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los descuentos de la plataforma
          </p>
        </div>
        {activeTab === "manual" && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Nuevo Descuento
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs como botones */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("manual")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "manual"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Descuentos Manuales
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "approvals"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Pendiente de Aprobación
          </button>
        </nav>
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {activeTab === "manual" && (
          <ManualDiscountsManager
            showForm={showForm}
            onShowFormChange={setShowForm}
          />
        )}
        {activeTab === "approvals" && <DiscountApprovalManager />}
      </div>
    </div>
  );
}

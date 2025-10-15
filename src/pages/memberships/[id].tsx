import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { Membership } from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { getMembershipById } from "@/lib/firebase/memberships";
import { ArrowLeft, Copy, Edit, Eye, Share, Trash2, Wifi } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MembershipDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  useEffect(() => {
    if (!id || !user || loading) return;

    const loadMembership = async () => {
      setLoadingMembership(true);
      try {
        const membershipData = await getMembershipById(id as string);
        setMembership(membershipData as Membership);
      } catch (error) {
        console.error("Error cargando membresía:", error);
        router.push("/memberships");
      } finally {
        setLoadingMembership(false);
      }
    };

    loadMembership();
  }, [id, user, loading, router]);

  if (loading || loadingMembership) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando membresía...
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Membresía no encontrada
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2);
  };

  const getStatusColor = () => {
    if (membership.status === "active") return "bg-green-500";
    if (membership.status === "inactive") return "bg-gray-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (membership.status === "active") return "Activa";
    if (membership.status === "inactive") return "Inactiva";
    return "Inactiva";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/memberships")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Detalles</h1>
          <button
            onClick={() => router.push("/memberships")}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Tarjeta principal de membresía */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Header de la membresía */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: membership.color || "#6B7280" }}
              >
                {getInitials(membership.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {membership.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  Gestiona tu membresía y tarjetas asociadas
                </p>
              </div>
            </div>

            {/* Estado y categoría */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Estado</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()} text-white`}
                >
                  {getStatusText()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Categoría</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  {membership.category}
                </span>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 mb-6"></div>

            {/* Sección de tarjetas */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tarjetas
                </h3>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/memberships/${membership.id}/add-card`)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span className="mr-1">+</span>
                  Añadir
                </Button>
              </div>

              {/* Tarjeta de ejemplo */}
              {membership.name === "Banco Galicia" && (
                <div className="relative mb-4">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl p-6 text-white">
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">VI</span>
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Gold
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-white" />
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Número de tarjeta */}
                    <div className="mb-6">
                      <div className="text-xl font-mono tracking-wider mb-2">
                        **** **** **** ****
                      </div>
                      <div className="text-sm opacity-90">Crédito</div>
                    </div>

                    {/* Fecha de vencimiento */}
                    <div className="text-right text-sm">12/28</div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="flex items-center justify-between mt-4 px-2">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
                        <Copy className="h-4 w-4" />
                        <span className="text-sm">Copiar</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
                        <Share className="h-4 w-4" />
                        <span className="text-sm">Compartir</span>
                      </button>
                    </div>
                    <button className="text-red-600 hover:text-red-800 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mensaje si no hay tarjetas */}
              {membership.name !== "Banco Galicia" && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No tienes tarjetas asociadas</p>
                  <p className="text-sm">Agrega una tarjeta para comenzar</p>
                </div>
              )}
            </div>

            {/* Acciones generales */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/memberships/${membership.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-3" />
                Editar información
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  // TODO: Implementar eliminación
                  console.log("Eliminar membresía:", membership.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Eliminar membresía
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

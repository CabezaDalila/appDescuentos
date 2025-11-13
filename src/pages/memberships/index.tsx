import { Button } from "@/components/Share/button";
import { Input } from "@/components/Share/input";
import {
  CreateMembershipData,
  Membership,
  MEMBERSHIP_CATEGORIES,
} from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { useCachedMemberships } from "@/hooks/useCachedMemberships";
import {
  checkMembershipExists,
  createMembership,
  deleteCardFromMembership,
  deleteMembership,
  updateMembership,
} from "@/lib/firebase/memberships";
import type { MembershipItem } from "@/types/membership";

import { ArrowLeft, Plus, Search } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
type TabType = "all" | "active" | "inactive";

export default function MembershipsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollY, setScrollY] = useState(0);

  // Usar hook con caché para membresías
  const {
    activeMemberships,
    inactiveMemberships,
    loading: loadingMemberships,
    refreshMemberships,
  } = useCachedMemberships();

  const allMemberships = [...activeMemberships, ...inactiveMemberships];

  const handleCreateMembership = async (
    membershipData: CreateMembershipData & { cards?: unknown[] }
  ) => {
    if (!user) return;

    try {
      const exists = await checkMembershipExists(
        membershipData.name,
        membershipData.category
      );
      if (exists) {
        return;
      }

      await createMembership({ ...membershipData, userId: user.uid });
      await refreshMemberships();
    } catch (err) {
      console.error("Error al crear la membresía:", err);
    }
  };

  const handleUpdateMembership = async (
    membershipId: string,
    updateData: Record<string, unknown>
  ) => {
    try {
      await updateMembership(membershipId, updateData);
      await refreshMemberships();
    } catch (error) {
      console.error("Error al actualizar la membresía:", error);
    }
  };

  const handleDeleteMembership = async (
    membershipId: string,
    membershipName: string
  ) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la membresía "${membershipName}"?`
      )
    ) {
      return;
    }

    try {
      await deleteMembership(membershipId);
      await refreshMemberships();
      toast.success("Membresía eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar la membresía:", error);
      toast.error("Error al eliminar la membresía");
    }
  };

  const handleScroll = () => {
    setScrollY(window.scrollY);
  };

  // Función para calcular el total de elementos (tarjetas + membresías)
  const getTotalItemsCount = () => {
    return activeMemberships.length + inactiveMemberships.length;
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleDeleteCardFromMembership = async (
    membershipId: string,
    cardId: string
  ) => {
    try {
      const result = await deleteCardFromMembership(membershipId, cardId);

      if (result.membershipDeleted) {
        // Si se eliminó la membresía completa, recargar la lista
        await refreshMemberships();
        return result;
      } else {
        // Si solo se eliminó la tarjeta, recargar para actualizar contadores
        await refreshMemberships();
        return result;
      }
    } catch (error) {
      console.error("Error al eliminar tarjeta de Firestore:", error);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  const filteredMemberships = useMemo(() => {
    let filtered;

    // Filtrar por tab activo primero
    if (activeTab === "active") {
      filtered = activeMemberships;
    } else if (activeTab === "inactive") {
      filtered = inactiveMemberships;
    } else {
      // Para "Todas": combinar activas e inactivas manteniendo el orden
      filtered = [...activeMemberships, ...inactiveMemberships];
    }

    // Luego filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((membership) => {
        const name = membership.isCard
          ? membership.membershipName || ""
          : membership.name || "";
        const category = membership.isCard
          ? membership.membershipCategory || ""
          : membership.category || "";
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return filtered;
  }, [activeTab, activeMemberships, inactiveMemberships, searchQuery]);

  if (loading || loadingMemberships) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando membresías...
      </div>
    );
  }

  const headerOpacity = Math.max(0.7, 1 - scrollY / 200);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 transition-opacity duration-200 safe-area-pt"
        style={{ opacity: headerOpacity }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/profile")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 ml-4">
            <h1 className="text-lg font-bold text-gray-900">Mis Membresías</h1>
            <div className="text-sm text-gray-600 mt-1">
              {activeMemberships.length} activas • {inactiveMemberships.length}{" "}
              inactivas
            </div>
          </div>
          <Button
            onClick={() => router.push("/memberships/add")}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Añadir
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar membresías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Todas ({getTotalItemsCount()})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "active"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Activas ({activeMemberships.length})
          </button>
          <button
            onClick={() => setActiveTab("inactive")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "inactive"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Inactivas ({inactiveMemberships.length})
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 py-4 pb-20">
        {filteredMemberships.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {searchQuery
                ? "No se encontraron membresías"
                : "No tienes membresías"}
            </div>
            <p className="text-gray-400 text-sm mb-6">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Agrega tu primera membresía para comenzar"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push("/memberships/add")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar membresía
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemberships.map((membership) => (
              <MembershipListItem
                key={`${membership.id}-${activeTab}`}
                membership={membership}
                isActive={
                  membership.isCard
                    ? membership.card?.status === "active" ||
                      membership.card?.status === undefined
                    : membership.status === "active" ||
                      membership.status === undefined
                }
                onDelete={handleDeleteMembership}
                onEdit={(id) => router.push(`/memberships/${id}/edit`)}
                onView={(id) => router.push(`/memberships/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para mostrar cada membresía o tarjeta en la lista
function MembershipListItem({
  membership,
  isActive,
  onDelete,
  onEdit,
  onView,
}: {
  membership: MembershipItem;
  isActive: boolean;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) {
  const router = useRouter();

  const getCategoryIcon = (category: Membership["category"]) => {
    switch (category) {
      case "banco":
        return "🏦";
      case "club":
        return "🏆";
      case "salud":
        return "❤️";
      case "educacion":
        return "🎓";
      case "seguro":
        return "🛡️";
      case "telecomunicacion":
        return "📱";
      default:
        return "🏢";
    }
  };

  const getStatusText = () => {
    if (isActive) return "Activa";
    return "Inactiva";
  };

  const getStatusColor = () => {
    if (isActive) return "bg-green-50 text-green-700 border-green-200";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const truncateName = (name: string, maxLength: number = 18) => {
    if (name.length <= maxLength) return name;

    // Estrategias de truncado inteligente
    const words = name.split(" ");

    // Si es un banco, mantener "Banco" + primera palabra del nombre
    if (name.toLowerCase().includes("banco")) {
      const bankName = words.find(
        (word) =>
          !word.toLowerCase().includes("banco") &&
          !word.toLowerCase().includes("de") &&
          !word.toLowerCase().includes("la") &&
          !word.toLowerCase().includes("el") &&
          word.length > 2
      );
      if (bankName) {
        return `Banco ${bankName}`;
      }
    }

    // Para universidades, mantener "U" + primeras letras
    if (name.toLowerCase().includes("universidad")) {
      const city = words.find(
        (word) =>
          !word.toLowerCase().includes("universidad") &&
          !word.toLowerCase().includes("de") &&
          !word.toLowerCase().includes("nacional") &&
          word.length > 2
      );
      if (city) {
        return `U ${city}`;
      }
    }

    // Para otros casos, mantener las primeras palabras importantes
    const importantWords = words.filter(
      (word) =>
        word.length > 2 &&
        !["de", "la", "el", "y", "del", "los", "las"].includes(
          word.toLowerCase()
        )
    );

    if (importantWords.length >= 2) {
      return `${importantWords[0]} ${importantWords[1]}`;
    }

    // Fallback: truncar con puntos suspensivos
    return name.substring(0, maxLength - 3) + "...";
  };

  const getCardColor = (name: string, category: Membership["category"]) => {
    // Colores específicos para entidades conocidas usando las constantes
    const colorMap: { [key: string]: string } = {
      // Bancos
      "banco galicia": "bg-orange-500",
      "banco santander": "bg-red-600",
      "banco nación": "bg-blue-700",
      "banco provincia": "bg-green-600",
      "banco ciudad": "bg-blue-500",
      "banco macro": "bg-yellow-600",
      "banco itaú": "bg-red-500",
      "banco hsbc": "bg-red-700",
      "banco bbva": "bg-blue-600",
      "banco supervielle": "bg-green-700",

      // Clubs
      "club la nación": "bg-blue-600",
      "club clarín": "bg-orange-600",
      "club personal": "bg-red-500",
      "club movistar": "bg-blue-500",
      "club claro": "bg-red-600",
      "club despegar": "bg-green-600",
      "club mercado libre": "bg-yellow-500",

      // Salud
      osde: "bg-green-500",
      "swiss medical": "bg-blue-500",
      medicus: "bg-green-600",
      galeno: "bg-blue-600",
      omint: "bg-purple-500",
      "accord salud": "bg-green-700",
      "sancor salud": "bg-blue-700",

      // Educación
      "universidad de buenos aires": "bg-purple-500",
      "universidad nacional de la plata": "bg-blue-600",
      "universidad nacional de córdoba": "bg-red-600",
      "universidad de palermo": "bg-purple-600",
      "universidad de san andrés": "bg-blue-700",
      "universidad católica argentina": "bg-yellow-600",

      // Seguros
      "la caja": "bg-orange-500",
      "federación patronal": "bg-blue-600",
      "sancor seguros": "bg-green-600",
      allianz: "bg-red-500",
      zurich: "bg-blue-700",
      mapfre: "bg-red-600",
      "provincia seguros": "bg-green-700",

      // Telecomunicaciones
      personal: "bg-red-500",
      movistar: "bg-blue-500",
      claro: "bg-red-600",
      telecom: "bg-blue-600",
      fibertel: "bg-orange-500",
      cablevisión: "bg-blue-700",
      directv: "bg-purple-600",
    };

    const lowerName = name.toLowerCase();
    return colorMap[lowerName] || getCategoryDefaultColor(category);
  };

  const getCategoryDefaultColor = (category: Membership["category"]) => {
    switch (category) {
      case "banco":
        return "bg-blue-500";
      case "club":
        return "bg-green-500";
      case "salud":
        return "bg-red-500";
      case "educacion":
        return "bg-purple-500";
      case "seguro":
        return "bg-orange-500";
      case "telecomunicacion":
        return "bg-blue-600";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryLabel = (category: Membership["category"]) => {
    const categoryObj = MEMBERSHIP_CATEGORIES.find(
      (cat: { value: string; label: string }) => cat.value === category
    );
    return categoryObj?.label || category;
  };

  // Función para normalizar el nombre del banco (agregar "Banco" si no lo tiene)
  const normalizeBankName = (
    name: string,
    category: Membership["category"]
  ) => {
    if (category === "banco" && !name.toLowerCase().startsWith("banco")) {
      return `Banco ${name}`;
    }
    return name;
  };

  return (
    <div
      className={`rounded-xl border p-3 transition-colors duration-200 cursor-pointer ${
        isActive
          ? "bg-white border-gray-200 hover:shadow-md hover:shadow-gray-200/30 hover:border-gray-300"
          : "bg-gray-50 border-gray-100 hover:bg-gray-100 opacity-75"
      }`}
      onClick={() =>
        onView(
          membership.isCard
            ? membership.membershipId || ""
            : membership.id || ""
        )
      }
    >
      <div className="flex items-center justify-between h-[70px]">
        <div className="flex items-center gap-3 flex-1">
          {/* Icono más pequeño */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              isActive
                ? `${getCardColor(
                    normalizeBankName(
                      membership.isCard
                        ? membership.membershipName || ""
                        : membership.name || "",
                      (membership.isCard
                        ? membership.membershipCategory
                        : membership.category) as Membership["category"]
                    ),
                    (membership.isCard
                      ? membership.membershipCategory
                      : membership.category) as Membership["category"]
                  )} text-white shadow-md`
                : `${getCardColor(
                    normalizeBankName(
                      membership.isCard
                        ? membership.membershipName || ""
                        : membership.name || "",
                      (membership.isCard
                        ? membership.membershipCategory
                        : membership.category) as Membership["category"]
                    ),
                    (membership.isCard
                      ? membership.membershipCategory
                      : membership.category) as Membership["category"]
                  )} text-white opacity-60`
            }`}
          >
            {getInitials(
              membership.isCard
                ? normalizeBankName(
                    membership.membershipName || "",
                    membership.membershipCategory as Membership["category"]
                  )
                : normalizeBankName(
                    membership.name || "",
                    membership.category as Membership["category"]
                  )
            )}
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Nombre principal con marca de tarjeta */}
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`font-semibold text-sm leading-tight ${
                  isActive ? "text-gray-900" : "text-gray-500"
                }`}
                title={
                  membership.isCard
                    ? `${normalizeBankName(
                        membership.membershipName || "",
                        membership.membershipCategory as Membership["category"]
                      )} - ${membership.card.brand} ${membership.card.level}`
                    : normalizeBankName(
                        membership.name || "",
                        membership.category as Membership["category"]
                      )
                }
              >
                {membership.isCard
                  ? truncateName(
                      normalizeBankName(
                        membership.membershipName || "",
                        membership.membershipCategory as Membership["category"]
                      )
                    )
                  : truncateName(
                      normalizeBankName(
                        membership.name || "",
                        membership.category as Membership["category"]
                      )
                    )}
              </h3>
              {membership.isCard && membership.card?.brand && (
                <span
                  className={`px-2 py-0.5 text-xs rounded font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {membership.card.brand}
                </span>
              )}
            </div>

            {/* Información secundaria */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${
                  isActive ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {getCategoryLabel(
                  (membership.isCard
                    ? membership.membershipCategory
                    : membership.category) as Membership["category"]
                )}
              </span>

              {membership.isCard ? (
                <>
                  {membership.card?.level && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded font-medium ${
                        isActive
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {membership.card.level}
                    </span>
                  )}
                  {membership.card?.type && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded font-medium ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {membership.card.type}
                    </span>
                  )}
                </>
              ) : membership.cards && membership.cards.length > 0 ? (
                <span
                  className={`px-2 py-0.5 text-xs rounded font-medium ${
                    isActive
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {membership.cards.length} tarjeta
                  {membership.cards.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            {/* Detalles adicionales de tarjetas (solo para membresías completas) */}
            {!membership.isCard &&
              membership.cards &&
              membership.cards.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {membership.cards.slice(0, 2).map((card, index) => (
                    <span
                      key={card.id || index}
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        isActive
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {card.brand} {card.level}
                    </span>
                  ))}
                  {membership.cards.length > 2 && (
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        isActive
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      +{membership.cards.length - 2} más
                    </span>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`px-4 py-2 text-xs rounded-full font-semibold border ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
}

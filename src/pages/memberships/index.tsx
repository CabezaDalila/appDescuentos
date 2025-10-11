import { Button } from "@/components/Share/button";
import { Input } from "@/components/Share/input";
import {
  CreateMembershipData,
  Membership,
  MEMBERSHIP_CATEGORIES,
} from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import {
  checkMembershipExists,
  createMembership,
  deleteCardFromMembership,
  deleteMembership,
  getActiveMemberships,
  getInactiveMemberships,
  updateMembership,
} from "@/lib/firebase/memberships";

import { ArrowLeft, ChevronDown, Filter, Plus, Search } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
type TabType = "all" | "active" | "inactive";

export default function MembershipsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // const [selectedFilter, setSelectedFilter] = useState<string>("");
  const filterRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const [activeMemberships, setActiveMemberships] = useState<Membership[]>([]);
  const [inactiveMemberships, setInactiveMemberships] = useState<Membership[]>(
    []
  );
  const [loadingMemberships, setLoadingMemberships] = useState(true);

  const allMemberships = [...activeMemberships, ...inactiveMemberships];

  const loadMemberships = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingMemberships(true);
      const [active, inactive] = await Promise.all([
        getActiveMemberships(),
        getInactiveMemberships(),
      ]);
      setActiveMemberships(active);
      setInactiveMemberships(inactive);
    } catch (error) {
      console.error("Error al cargar las membresías:", error);
      // toast.error('Error al cargar las membresías');
    } finally {
      setLoadingMemberships(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    loadMemberships();
  }, [user, loading, loadMemberships]);

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
      loadMemberships();
    } catch (err) {
      console.error("❌ Error al crear la membresía:", err);
    }
  };

  const handleUpdateMembership = async (
    membershipId: string,
    updateData: Record<string, unknown>
  ) => {
    try {
      await updateMembership(membershipId, updateData);
      loadMemberships();
    } catch (error) {
      console.error("❌ Error al actualizar la membresía:", error);
    }
  };

  const handleDeleteMembership = async (membershipId: string) => {
    try {
      await deleteMembership(membershipId);
      loadMemberships();
    } catch (error) {
      console.error("❌ Error al eliminar la membresía:", error);
    }
  };

  const handleScroll = () => {
    setScrollY(window.scrollY);
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
        loadMemberships();
        return result;
      } else {
        // Si solo se eliminó la tarjeta, recargar para actualizar contadores
        loadMemberships();
        return result;
      }
    } catch (error) {
      console.error("❌ Error al eliminar tarjeta de Firestore:", error);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  const getFilteredMemberships = () => {
    let filtered = allMemberships;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (membership) =>
          membership.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          membership.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por tab activo
    if (activeTab === "active") {
      filtered = activeMemberships;
    } else if (activeTab === "inactive") {
      filtered = inactiveMemberships;
    }

    return filtered;
  };

  const filteredMemberships = getFilteredMemberships();

  if (loading || loadingMemberships) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando membresías...
      </div>
    );
  }

  const filterOptions = [
    { id: "type", label: "Por tipo", icon: "🏷️" },
    { id: "status", label: "Por estado", icon: "📊" },
    { id: "recent", label: "Más recientes", icon: "🕒" },
  ];

  const headerOpacity = Math.max(0.7, 1 - scrollY / 200);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 transition-opacity duration-200"
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
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar membresías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-gray-300 hover:border-gray-400"
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className="h-3 w-3" />
            </Button>

            {/* Dropdown de filtros */}
            {showFilters && (
              <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-48">
                <div className="py-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        // setSelectedFilter(option.id);
                        setShowFilters(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-sm">{option.icon}</span>
                      <span className="text-sm text-gray-900">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            Todas ({allMemberships.length})
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
          <div className="space-y-6">
            {activeTab === "all" && (
              <>
                {activeMemberships.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        Activas
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {activeMemberships.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeMemberships.map((membership) => (
                        <MembershipListItem
                          key={membership.id}
                          membership={membership}
                          isActive={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {inactiveMemberships.length > 0 && (
                  <div className={activeMemberships.length > 0 ? "mt-8" : ""}>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        Inactivas
                      </h3>
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                        {inactiveMemberships.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {inactiveMemberships.map((membership) => (
                        <MembershipListItem
                          key={membership.id}
                          membership={membership}
                          isActive={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "active" && (
              <div className="space-y-3">
                {activeMemberships.map((membership) => (
                  <MembershipListItem
                    key={membership.id}
                    membership={membership}
                    isActive={true}
                  />
                ))}
              </div>
            )}

            {activeTab === "inactive" && (
              <div className="space-y-3">
                {inactiveMemberships.map((membership) => (
                  <MembershipListItem
                    key={membership.id}
                    membership={membership}
                    isActive={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Espacio adicional para poder hacer scroll y probar el efecto */}
        <div className="h-96 bg-gradient-to-b from-transparent to-gray-100 rounded-lg mt-8 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-sm">
              Scroll hacia abajo para ver el efecto de desvanecimiento
            </div>
            <div className="text-xs mt-2">La barra se atenúa gradualmente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar cada membresía en la lista
function MembershipListItem({
  membership,
  isActive,
}: {
  membership: Membership;
  isActive: boolean;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

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
    if (isActive) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Icono */}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${getCardColor(
              membership.name,
              membership.category
            )}`}
          >
            {getInitials(membership.name)}
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base leading-tight">
              {membership.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                {getCategoryIcon(membership.category)}
                {getCategoryLabel(membership.category)}
              </span>
              {membership.cards.length > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                  {membership.cards.length} tarjeta
                  {membership.cards.length > 1 ? "s" : ""}
                </span>
              )}
              {membership.cards.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {membership.cards.slice(0, 2).map((card, index) => (
                    <span
                      key={card.id || index}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {card.brand} {card.level}
                    </span>
                  ))}
                  {membership.cards.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      +{membership.cards.length - 2} más
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estado y menú */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-48">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      router.push(`/memberships/${membership.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-gray-600">👁️</span>
                    <span className="text-sm text-gray-900">Ver detalles</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      router.push(`/memberships/${membership.id}/edit`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-gray-600">✏️</span>
                    <span className="text-sm text-gray-900">Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // TODO: Implementar eliminación
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                  >
                    <span className="text-red-600">🗑️</span>
                    <span className="text-sm text-red-600">Eliminar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

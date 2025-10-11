import { Button } from "@/components/Share/button";
import { Input } from "@/components/Share/input";
<<<<<<< Updated upstream
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import {
  CreateMembershipData,
  Membership,
  MEMBERSHIP_CATEGORIES,
} from "@/constants/membership";
=======
>>>>>>> Stashed changes
import { useAuth } from "@/hooks/useAuth";
import {
  getActiveMemberships,
  getInactiveMemberships,
} from "@/lib/firebase/memberships";
<<<<<<< Updated upstream
import { Filter, Plus, Search, SortAsc } from "lucide-react";
=======
import { Membership } from "@/types/membership";
import { ArrowLeft, ChevronDown, Filter, Plus, Search } from "lucide-react";
>>>>>>> Stashed changes
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

type TabType = "all" | "active" | "inactive";

export default function MembershipsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const filterRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const [activeMemberships, setActiveMemberships] = useState<Membership[]>([]);
  const [inactiveMemberships, setInactiveMemberships] = useState<Membership[]>(
    []
  );
  const [loadingMemberships, setLoadingMemberships] = useState(true);

  const allMemberships = [...activeMemberships, ...inactiveMemberships];

  useEffect(() => {
    if (!user || loading) return;

    const loadMemberships = async () => {
      setLoadingMemberships(true);
<<<<<<< Updated upstream
      const data = await getUserMemberships();
      setMemberships(data);
    } catch {
      // toast.error('Error al cargar las membresías');
    } finally {
      setLoadingMemberships(false);
    }
  };

  const handleCreateMembership = async (
    membershipData: CreateMembershipData & { cards?: any[] }
  ) => {
    try {
      const exists = await checkMembershipExists(
        membershipData.name,
        membershipData.category
      );
      if (exists) {
        return;
      }

      await createMembership(membershipData);
      loadMemberships();
    } catch (err) {
      console.error("❌ Error al crear la membresía:", err);
    }
  };

  const handleUpdateMembership = async (
    membershipId: string,
    updateData: any
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
=======
      try {
        const [active, inactive] = await Promise.all([
          getActiveMemberships(),
          getInactiveMemberships(),
        ]);
        setActiveMemberships(active);
        setInactiveMemberships(inactive);
      } catch (error) {
        console.error("Error cargando membresías:", error);
      } finally {
        setLoadingMemberships(false);
      }
    };

    loadMemberships();
  }, [user, loading]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Efecto de scroll para la barra
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
>>>>>>> Stashed changes

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

<<<<<<< Updated upstream
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
=======
  const getFilteredMemberships = () => {
    let filtered = allMemberships;

    if (activeTab === "active") {
      filtered = activeMemberships;
    } else if (activeTab === "inactive") {
      filtered = inactiveMemberships;
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (membership) =>
          membership.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          membership.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
>>>>>>> Stashed changes
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
                        setSelectedFilter(option.id);
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "bank":
      case "banco":
        return "🏦";
      case "club":
        return "🏆";
      case "health":
      case "salud":
        return "❤️";
      case "university":
      case "universidad":
      case "education":
      case "educacion":
        return "🎓";
      default:
        return "🏢";
    }
  };

  const getStatusText = () => {
    if (isActive) return "Activa";
    if (membership.status === "graduated") return "Graduado";
    return "Inactiva";
  };

  const getStatusColor = () => {
    if (isActive) return "bg-green-100 text-green-800";
    if (membership.status === "graduated") return "bg-gray-100 text-gray-800";
    return "bg-gray-100 text-gray-800";
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getCardColor = (name: string) => {
    // Colores específicos para nombres conocidos
    const colorMap: { [key: string]: string } = {
      "banco galicia": "bg-orange-500",
      "club la nación": "bg-blue-600",
      "universidad de buenos aires": "bg-purple-500",
      osde: "bg-green-500",
    };

    const lowerName = name.toLowerCase();
    return colorMap[lowerName] || "bg-gray-500";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Icono */}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${getCardColor(
              membership.name
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
                {membership.category}
              </span>
              {membership.tier && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                  {membership.tier}
                </span>
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

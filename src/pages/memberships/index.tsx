import AddMembershipUnifiedModal from "@/components/memberships/AddMembershipUnifiedModal";
import MembershipDetailModal from "@/components/memberships/MembershipDetailModal";
import MembershipList from "@/components/memberships/MembershipList";
import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { useAuth } from "@/hooks/useAuth";
import {
  addCardToMembership,
  checkMembershipExists,
  createMembership,
  deleteCardFromMembership,
  deleteMembership,
  getUserMemberships,
  updateCardInMembership,
  updateMembership,
} from "@/lib/firebase/memberships";
import {
  CreateMembershipData,
  Membership,
  MEMBERSHIP_CATEGORIES,
} from "@/types/membership";
import { Filter, Plus, Search, SortAsc } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Memberships() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name-asc" | "name-desc" | "recent" | "oldest"
  >("name-asc");

  useEffect(() => {
    if (!user || authLoading) return;
    loadMemberships();
  }, [user, authLoading]);

  const loadMemberships = async () => {
    try {
      setLoadingMemberships(true);
      const data = await getUserMemberships();
      setMemberships(data);
    } catch (error) {
      // toast.error('Error al cargar las membresías');
    } finally {
      setLoadingMemberships(false);
    }
  };

  const handleCreateMembership = async (
    membershipData: CreateMembershipData & { cards?: any[] }
  ) => {
    try {
      console.log("🔍 Verificando si la membresía ya existe...");
      const exists = await checkMembershipExists(
        membershipData.name,
        membershipData.category
      );
      if (exists) {
        console.log("⚠️ Membresía ya existe");
        alert('Ya tienes una membresía con ese nombre en esa categoría');
        return;
      }
      
      console.log("🚀 Creando membresía en Firestore:", membershipData);
      await createMembership(membershipData);
      console.log("✅ Membresía creada exitosamente en Firestore");
      alert('Membresía creada exitosamente');
      loadMemberships();
    } catch (error) {
      console.error("❌ Error al crear la membresía:", error);
      alert('Error al crear la membresía. Inténtalo de nuevo.');
    }
  };

  const handleUpdateMembership = async (
    membershipId: string,
    updateData: any
  ) => {
    try {
      console.log("🔄 Actualizando membresía:", membershipId, updateData);
      await updateMembership(membershipId, updateData);
      console.log("✅ Membresía actualizada exitosamente");
      alert('Membresía actualizada exitosamente');
      loadMemberships();
    } catch (error) {
      console.error("❌ Error al actualizar la membresía:", error);
      alert('Error al actualizar la membresía. Inténtalo de nuevo.');
    }
  };

  const handleDeleteMembership = async (membershipId: string) => {
    try {
      console.log("🗑️ Eliminando membresía:", membershipId);
      await deleteMembership(membershipId);
      console.log("✅ Membresía eliminada exitosamente");
      alert('Membresía eliminada exitosamente');
      loadMemberships();
    } catch (error) {
      console.error("❌ Error al eliminar la membresía:", error);
      alert('Error al eliminar la membresía. Inténtalo de nuevo.');
    }
  };

  const handleMembershipClick = (membership: Membership) => {
    setSelectedMembership(membership);
    setShowDetailModal(true);
  };

  const handleDeleteCardFromMembership = async (
    membershipId: string,
    cardId: string
  ) => {
    try {
      console.log("🗑️ Eliminando tarjeta:", cardId, "de membresía:", membershipId);
      const result = await deleteCardFromMembership(membershipId, cardId);
      console.log("📋 Resultado de eliminación:", result);
      
      if (result.membershipDeleted) {
        // Si se eliminó la membresía completa, recargar la lista
        console.log("🏦 Membresía eliminada completamente - Recargando lista");
        loadMemberships();
        return result;
      } else {
        // Si solo se eliminó la tarjeta, recargar para actualizar contadores
        console.log("💳 Solo tarjeta eliminada - Recargando para actualizar contadores");
        loadMemberships();
        return result;
      }
    } catch (error) {
      console.error("❌ Error al eliminar tarjeta de Firestore:", error);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  // Filtrar y ordenar membresías
  const filteredAndSortedMemberships = memberships
    .filter(
      (m) =>
        (!searchTerm ||
          m.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === "all" || m.category === categoryFilter)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando usuario...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Usuario no autenticado
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Header de sección */}
      <div className="container mx-auto px-4 pt-8 pb-2 max-w-6xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none text-gray-600"
            aria-label="Volver"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left w-5 h-5"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl text-gray-700 font-bold flex-1 ml-2">
            Mis Membresías
          </h1>
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-none"
            size="sm"
          >
            <Plus className="h-5 w-5 mr-2" /> Agregar
          </Button>
        </div>
        {/* Filtros y buscador */}
        <div className="space-y-3 mb-4">
          {/* Buscador arriba */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Buscar membresías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-full bg-white border border-gray-200 focus:ring-2 focus:ring-violet-200 w-full"
            />
          </div>
          {/* Filtros abajo en la misma línea */}
          <div className="flex gap-2 items-center">
            {/* Filtro por categoría */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-full bg-white border border-gray-200 px-2 flex-1">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue>
                  {categoryFilter === "all"
                    ? "Todos"
                    : MEMBERSHIP_CATEGORIES.find(
                        (c) => c.value === categoryFilter
                      )?.label || "Todos"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MEMBERSHIP_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Ordenamiento */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="rounded-full bg-white border border-gray-200 px-2 flex-1">
                <SortAsc className="h-4 w-4 mr-1" />
                <SelectValue>
                  {sortBy === "name-asc"
                    ? "A-Z"
                    : sortBy === "name-desc"
                    ? "Z-A"
                    : sortBy === "recent"
                    ? "Más recientes"
                    : sortBy === "oldest"
                    ? "Más antiguas"
                    : "Ordenar por"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">A-Z</SelectItem>
                <SelectItem value="name-desc">Z-A</SelectItem>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <Card>
          <CardContent className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto pb-32">
            {loadingMemberships ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Cargando membresías...</div>
              </div>
            ) : (
              <MembershipList
                memberships={filteredAndSortedMemberships}
                onMembershipClick={handleMembershipClick}
                showAddButton={false}
                showHeader={false}
                showFilters={false}
                showStats={false}
              />
            )}
          </CardContent>
        </Card>
      </main>
      {/* Modal de detalle */}
      <MembershipDetailModal
        membership={selectedMembership}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMembership(null);
        }}
        onUpdate={handleUpdateMembership}
        onDelete={handleDeleteMembership}
        onAddCard={addCardToMembership}
        onUpdateCard={updateCardInMembership}
        onDeleteCard={handleDeleteCardFromMembership}
      />
      {/* Modal unificado para agregar membresía */}
      <AddMembershipUnifiedModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateMembership}
      />
    </div>
  );
}

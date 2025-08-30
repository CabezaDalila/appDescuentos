import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Plus, Filter, Search, SortAsc } from "lucide-react";
import MembershipList from "@/components/memberships/MembershipList";
import MembershipDetailModal from "@/components/memberships/MembershipDetailModal";
import AddMembershipModal from "@/components/memberships/AddMembershipModal";
import { 
  getUserMemberships, 
  createMembership, 
  updateMembership, 
  deleteMembership,
  addCardToMembership,
  updateCardInMembership,
  deleteCardFromMembership,
  checkMembershipExists
} from "@/lib/firebase/memberships";
import { Membership, CreateMembershipData, MEMBERSHIP_CATEGORIES } from "@/types/membership";
import toast from "react-hot-toast";
import { Input } from "@/components/Share/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Share/select";

export default function Memberships() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "recent" | "oldest">("name-asc");

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

  const handleCreateMembership = async (membershipData: CreateMembershipData) => {
    try {
      const exists = await checkMembershipExists(membershipData.name, membershipData.category);
      if (exists) {
        // toast.error('Ya tienes una membresía con ese nombre en esa categoría');
        return;
      }
      await createMembership(membershipData);
      // toast.success('Membresía creada exitosamente');
      loadMemberships();
    } catch (error) {
      // toast.error('Error al crear la membresía');
    }
  };

  const handleUpdateMembership = async (membershipId: string, updateData: any) => {
    try {
      await updateMembership(membershipId, updateData);
      // toast.success('Membresía actualizada exitosamente');
      loadMemberships();
    } catch (error) {
      // toast.error('Error al actualizar la membresía');
    }
  };

  const handleDeleteMembership = async (membershipId: string) => {
    try {
      await deleteMembership(membershipId);
      // toast.success('Membresía eliminada exitosamente');
      loadMemberships();
    } catch (error) {
      // toast.error('Error al eliminar la membresía');
    }
  };

  const handleMembershipClick = (membership: Membership) => {
    setSelectedMembership(membership);
    setShowDetailModal(true);
  };

  const handleDeleteCardFromMembership = async (membershipId: string, cardId: string) => {
    await deleteCardFromMembership(membershipId, cardId);
  };

  // Filtrar y ordenar membresías
  const filteredAndSortedMemberships = memberships
    .filter(m =>
      (!searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === "all" || m.category === categoryFilter)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  if (authLoading) {
    return <div className="flex justify-center items-center h-40 text-gray-500">Cargando usuario...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-40 text-gray-500">Usuario no autenticado</div>;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Header de sección */}
      <div className="container mx-auto px-4 pt-8 pb-2 max-w-6xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none"
            aria-label="Volver"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-5 h-5"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <h1 className="text-2xl font-bold flex-1 ml-2">Mis Membresías</h1>
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-full px-5 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-none"
            size="sm"
          >
            <Plus className="h-5 w-5 mr-1" /> Añadir
          </Button>
        </div>
        {/* Filtros y buscador */}
        <div className="space-y-3 mb-4">
          {/* Buscador arriba */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar membresías..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
                    : MEMBERSHIP_CATEGORIES.find(c => c.value === categoryFilter)?.label || "Todos"}
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
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
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
                <div className="text-gray-400">Cargando membresías...</div>
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
      {/* Modal para agregar membresía */}
      <AddMembershipModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateMembership}
      />
    </div>
  );
} 
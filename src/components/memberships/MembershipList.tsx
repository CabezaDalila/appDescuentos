import { Filter, Search, SortAsc } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Membership, MEMBERSHIP_CATEGORIES } from "../../types/membership";
import { Button } from "../Share/button";
import { Input } from "../Share/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Share/select";
import MembershipCard from "./MembershipCard";

interface MembershipListProps {
  memberships: Membership[];
  onMembershipClick?: (membership: Membership) => void;
  onAddMembership?: () => void;
  showAddButton?: boolean;
  showHeader?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
}

type SortOption = "name-asc" | "name-desc" | "recent" | "oldest";

const MembershipList: React.FC<MembershipListProps> = ({
  memberships,
  onMembershipClick,
  onAddMembership,
  showAddButton = true,
  showHeader = true,
  showFilters = true,
  showStats = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Filtrar y ordenar membresías
  const filteredAndSortedMemberships = useMemo(() => {
    let filtered = memberships;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((membership) =>
        membership.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (membership) => membership.category === categoryFilter
      );
    }

    // Ordenar
    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }

    return filtered;
  }, [memberships, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl font-semibold">Mis Membresías</h2>
          {showAddButton && onAddMembership && (
            <Button onClick={onAddMembership} className="w-full sm:w-auto">
              + Añadir Membresía
            </Button>
          )}
        </div>
      )}
      {/* Filtros y búsqueda */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Buscar membresía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Filtro por categoría */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {MEMBERSHIP_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Ordenamiento */}
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger>
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguas</SelectItem>
              <SelectItem value="name-asc">A-Z</SelectItem>
              <SelectItem value="name-desc">Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Estadísticas */}
      {showStats && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredAndSortedMemberships.length} de {memberships.length}{" "}
            membresías
          </span>
          <span>
            {memberships.filter((m) => m.status === "active").length} activas
          </span>
        </div>
      )}
      {/* Lista de membresías */}
      {filteredAndSortedMemberships.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== "all" ? (
              <>
                <p className="text-lg font-medium mb-2">
                  No se encontraron membresías
                </p>
                <p className="text-sm">
                  Intenta ajustar los filtros o términos de búsqueda
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">No tienes membresías</p>
                <p className="text-sm">
                  Comienza agregando tu primera membresía
                </p>
              </>
            )}
          </div>
          {showAddButton && onAddMembership && (
            <Button
              onClick={onAddMembership}
              variant="outline"
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              + Añadir Primera Membresía
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedMemberships.map((membership) => (
            <MembershipCard
              key={membership.id}
              membership={membership}
              variant="list"
              onClick={() => onMembershipClick?.(membership)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MembershipList;

import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { EmptyState } from "@/components/home/empty-state";
import { SearchDropdown } from "@/components/home/SearchDropdown";
import { EXPLORE_CATEGORIES } from "@/constants/categories";
import {
  getDiscountsBySearch,
  getHomePageDiscounts,
  getNearbyDiscounts,
  getPersonalizedDiscounts,
} from "@/lib/discounts";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import type { UserCredential } from "@/types/credentials";
import { Discount } from "@/types/discount";
import { matchesCategory } from "@/utils/category-mapping";
import { getFavoriteIds } from "@/utils/favorites";
import { Filter, Search as SearchIcon, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

// Tipo para descuentos de la página de inicio
type HomePageDiscount = {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  points: number;
  distance: string;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
};

type SearchDiscount = Discount | HomePageDiscount;

export default function Search() {
  const router = useRouter();
  const { category, search, q, location, lat, lng, personalized, openId } =
    router.query as Record<string, unknown>;

  const [filteredDiscounts, setFilteredDiscounts] = useState<SearchDiscount[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLocationFilter, setIsLocationFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftNearby, setDraftNearby] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Discount[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    EXPLORE_CATEGORIES.forEach((c) => (map[c.id] = c.label));
    map["favoritos"] = "Favoritos";
    return map;
  }, []);
  const [maxCategoryChips, setMaxCategoryChips] = useState(2);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQueryList = window.matchMedia("(min-width: 1024px)"); // lg breakpoint
    const applyBreakpoint = (matches: boolean) =>
      setMaxCategoryChips(matches ? 4 : 2);
    applyBreakpoint(mediaQueryList.matches);
    const handleBreakpointChange = (event: MediaQueryListEvent) =>
      applyBreakpoint(event.matches);
    if (mediaQueryList.addEventListener)
      mediaQueryList.addEventListener("change", handleBreakpointChange);
    else mediaQueryList.addListener(handleBreakpointChange);
    return () => {
      if (mediaQueryList.removeEventListener)
        mediaQueryList.removeEventListener("change", handleBreakpointChange);
      else mediaQueryList.removeListener(handleBreakpointChange);
    };
  }, []);

  useEffect(() => {
    const currentUrlTerm =
      typeof search === "string" ? search : typeof q === "string" ? q : "";
    const handler = setTimeout(async () => {
      const next = searchTerm.trim();

      // Buscar sugerencias con debounce (evita tildeos)
      if (next.length >= 2) {
        try {
          setIsSearching(true);
          const results = await getDiscountsBySearch(next);
          setSearchResults(results);
          const isFocused =
            inputRef.current !== null &&
            typeof document !== "undefined" &&
            document.activeElement === inputRef.current;
          // Solo mostrar el dropdown si el input está enfocado
          setShowSearchResults(isFocused);
        } catch {
          setSearchResults([]);
          setShowSearchResults(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }

      // Mantener la URL sincronizada con 'search'
      if (next === currentUrlTerm) return;
      if (next.length === 0) {
        const baseQuery: Record<string, string> = {};
        if (typeof category === "string")
          baseQuery.category = category as string;
        router.push({ pathname: "/search", query: baseQuery }, undefined, {
          shallow: false,
        });
      } else if (next.length >= 2) {
        const queryObj: Record<string, string> = { search: next };
        if (typeof category === "string")
          queryObj.category = category as string;
        router.push({ pathname: "/search", query: queryObj }, undefined, {
          shallow: false,
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, search, q, category, router]);

  const applyFilters = (
    allDiscounts: SearchDiscount[],
    selectedCategoryIds?: string[]
  ) => {
    let filtered = allDiscounts;

    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      // Preparar unión entre 'favoritos' y categorías
      const includeFavorites = selectedCategoryIds.includes("favoritos");
      const categoryIdsOnly = selectedCategoryIds.filter(
        (categoryId) => categoryId !== "favoritos"
      );
      setSelectedCategories(selectedCategoryIds);

      if (allDiscounts.length > 0) {
        const favoriteIdSet = includeFavorites
          ? new Set(getFavoriteIds())
          : null;

        if ("name" in allDiscounts[0]) {
          // Datos completos tipo Discount
          const fullDiscounts = allDiscounts as Discount[];
          filtered = fullDiscounts.filter((discountItem) => {
            const isFavorite = includeFavorites
              ? favoriteIdSet!.has(discountItem.id)
              : false;
            const matchesCat =
              categoryIdsOnly.length === 0
                ? false
                : categoryIdsOnly.some((categoryId) =>
                    matchesCategory(discountItem.category, categoryId)
                  );
            return (
              isFavorite ||
              matchesCat ||
              (!includeFavorites && categoryIdsOnly.length === 0)
            );
          }) as SearchDiscount[];
        } else {
          // Datos resumidos tipo HomePageDiscount
          filtered = (allDiscounts as HomePageDiscount[]).filter(
            (discountItem) => {
              const isFavorite = includeFavorites
                ? favoriteIdSet!.has(discountItem.id)
                : false;
              const matchesCat =
                categoryIdsOnly.length === 0
                  ? false
                  : categoryIdsOnly.some((categoryId) =>
                      matchesCategory(discountItem.category || "", categoryId)
                    );
              return (
                isFavorite ||
                matchesCat ||
                (!includeFavorites && categoryIdsOnly.length === 0)
              );
            }
          ) as SearchDiscount[];
        }
      }
    } else {
      setSelectedCategories([]);
    }

    setFilteredDiscounts(filtered);
  };

  // Cargar descuentos y aplicar filtros
  useEffect(() => {
    // Si viene una orden de abrir un detalle, redirigir a la vista de detalle y limpiar la query
    if (typeof openId === "string" && openId.length > 0) {
      const id = openId;
      // Limpiar openId de la URL sin recargar toda la página
      const cleanQuery: Record<string, string> = {};
      Object.entries(router.query).forEach(([k, v]) => {
        if (k === "openId") return;
        if (typeof v === "string") cleanQuery[k] = v;
      });
      router.replace({ pathname: "/search", query: cleanQuery }, undefined, {
        shallow: true,
      });
      router.push(`/discount/${id}`);
      return;
    }
    const loadDiscounts = async () => {
      try {
        setLoading(true);
        let data: SearchDiscount[] = [];

        // Verificar si hay filtro de ubicación
        const hasLocationFilter = location === "true" && lat && lng;
        setIsLocationFilter(!!hasLocationFilter);
        setDraftNearby(!!hasLocationFilter);

        if (hasLocationFilter) {
          const latitude = parseFloat(lat as string);
          const longitude = parseFloat(lng as string);

          data = await getNearbyDiscounts(latitude, longitude, 1.5);
        } else if (personalized === "true") {
          // Construir memberships y credenciales del usuario y traer personalizadas
          const memberships = await getActiveMemberships();
          const membershipNames: string[] = [];
          const credentials: UserCredential[] = [];
          memberships.forEach((m: unknown) => {
            const item = m as {
              name?: string;
              membershipName?: string;
              membershipCategory?: string;
              isCard?: boolean;
              card?: { type?: string; brand?: string; level?: string };
            };
            const name = item.name || item.membershipName;
            if (typeof name === "string" && name.trim().length > 0) {
              membershipNames.push(name);
            }
            if (
              item.isCard &&
              item.membershipCategory === "banco" &&
              item.card
            ) {
              const bank = name as string;
              const { type, brand, level } = item.card || {};
              // Tipar estrictamente usando los mismos valores del selector
              if (
                bank &&
                typeof type === "string" &&
                typeof brand === "string" &&
                typeof level === "string"
              ) {
                // Los valores provienen del selector y son válidos;
                // forzamos el tipo específico de forma segura
                credentials.push({
                  bank,
                  type: type as UserCredential["type"],
                  brand: brand as UserCredential["brand"],
                  level: level as UserCredential["level"],
                });
              }
            }
          });
          data = await getPersonalizedDiscounts(membershipNames, credentials);
        } else if (
          (search && typeof search === "string") ||
          (q && typeof q === "string")
        ) {
          const urlTerm = (search || q) as string;
          data = await getDiscountsBySearch(urlTerm);
          const isFocused =
            inputRef.current !== null &&
            typeof document !== "undefined" &&
            document.activeElement === inputRef.current;
          if (!isFocused) {
            setSearchTerm(urlTerm);
          }
        } else {
          data = await getHomePageDiscounts();
        }

        // Obtener categorías desde la URL (nuevo 'categories', compat 'category')
        let urlCategories: string[] = [];
        const categoriesRaw = router.query.categories as unknown;
        if (typeof categoriesRaw === "string") {
          urlCategories = (categoriesRaw as string)
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
        } else if (typeof category === "string") {
          urlCategories = [category as string];
        }

        // Aplicar filtros inmediatamente después de cargar los datos
        applyFilters(data, urlCategories);
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, [search, q, category, location, lat, lng, personalized, openId, router]);

  const updateCategoriesInUrl = (cats: string[]) => {
    const queryObj: Record<string, string> = {};
    if (searchTerm.trim().length >= 2) queryObj.search = searchTerm.trim();
    if (cats.length > 0) queryObj.categories = cats.join(",");
    router.push({ pathname: "/search", query: queryObj });
  };

  const handleClearCategory = (cat?: string) => {
    if (cat) {
      const next = selectedCategories.filter((c) => c !== cat);
      setSelectedCategories(next);
      updateCategoriesInUrl(next);
    } else {
      setSelectedCategories([]);
      updateCategoriesInUrl([]);
    }
  };

  // Helper geolocation
  const getCurrentPosition = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation no soportada"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  // (clear location se hace inline donde se usa)

  const categoryInfoName =
    selectedCategories.length > 0
      ? categoryLabelMap[selectedCategories[0]]
      : undefined;

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header removido para una vista más limpia */}

      {/* Buscador en la vista de resultados */}
      <div className="px-4 pt-1">
        <div className="relative max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="¿Qué estás buscando hoy?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() =>
              searchTerm.trim().length >= 2 && setShowSearchResults(true)
            }
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 caret-purple-600 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white shadow-sm"
          />
          {/* Panel de filtros */}
          {showFilters && (
            <div
              className="absolute z-40 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-3"
              style={{ top: "100%" }}
            >
              <div className="mb-2 text-sm font-semibold text-gray-900">
                Categorías
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {EXPLORE_CATEGORIES.map((categoryDef) => (
                  <label
                    key={categoryDef.id}
                    className="flex items-center gap-2 text-sm text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={draftCategories.includes(categoryDef.id)}
                      onChange={(e) => {
                        setDraftCategories((prev) =>
                          e.target.checked
                            ? Array.from(new Set([...prev, categoryDef.id]))
                            : prev.filter(
                                (categoryId) => categoryId !== categoryDef.id
                              )
                        );
                      }}
                    />
                    <span
                      className={
                        draftCategories.includes(categoryDef.id)
                          ? "text-purple-700 font-medium"
                          : "text-gray-800"
                      }
                    >
                      {categoryDef.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-900">
                Otros
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={draftCategories.includes("favoritos")}
                    onChange={(e) => {
                      setDraftCategories((prev) =>
                        e.target.checked
                          ? Array.from(new Set([...prev, "favoritos"]))
                          : prev.filter((x) => x !== "favoritos")
                      );
                    }}
                  />
                  <span
                    className={
                      draftCategories.includes("favoritos")
                        ? "text-purple-700 font-medium"
                        : "text-gray-800"
                    }
                  >
                    Favoritos
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={draftNearby}
                    onChange={(e) => setDraftNearby(e.target.checked)}
                  />
                  <span
                    className={
                      draftNearby
                        ? "text-purple-700 font-medium"
                        : "text-gray-800"
                    }
                  >
                    Cerca de ti
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  className="text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => {
                    setDraftCategories([]);
                    setDraftNearby(false);
                  }}
                >
                  Limpiar
                </button>
                <button
                  className="text-sm text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md"
                  onClick={async () => {
                    setShowFilters(false);
                    setSelectedCategories(draftCategories);
                    // Construir query
                    const queryObj: Record<string, string> = {};
                    if (searchTerm.trim().length >= 2)
                      queryObj.search = searchTerm.trim();
                    if (draftCategories.length > 0)
                      queryObj.categories = draftCategories.join(",");
                    if (draftNearby) {
                      try {
                        const pos = await getCurrentPosition();
                        queryObj.location = "true";
                        queryObj.lat = String(pos.lat);
                        queryObj.lng = String(pos.lng);
                      } catch {
                        // Si falla geolocalización, mantener sin ubicación
                      }
                    }
                    router.push({ pathname: "/search", query: queryObj });
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
          <SearchDropdown
            isOpen={showSearchResults}
            isSearching={isSearching}
            searchTerm={searchTerm}
            results={searchResults}
            onSelect={(d) => {
              // En la vista de búsqueda, seleccionar un item abre el detalle directamente
              setShowSearchResults(false);
              router.push(`/discount/${d.id}`);
            }}
          />
        </div>
      </div>

      {/* Filtros: siempre visible */}
      <div className="px-4 py-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* No mostramos chip del término de búsqueda; solo chips de filtros aplicados */}

          {selectedCategories.slice(0, maxCategoryChips).map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs"
            >
              <Filter className="w-3 h-3" />
              {categoryLabelMap[cat] || cat}
              <button
                onClick={() => handleClearCategory(cat)}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedCategories.length > maxCategoryChips && (
            <button
              className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs hover:bg-purple-100"
              onClick={() => setShowFilters(true)}
              title={selectedCategories
                .slice(maxCategoryChips)
                .map((categoryId) => categoryLabelMap[categoryId] || categoryId)
                .join(", ")}
            >
              +{selectedCategories.length - maxCategoryChips}
            </button>
          )}

          {isLocationFilter && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs">
              <Filter className="w-3 h-3" />
              Cerca de ti
              <button
                onClick={() =>
                  router.push({
                    pathname: "/search",
                    query: { search: searchTerm },
                  })
                }
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Botón Filtros al final de la misma fila */}
          <button
            className="inline-flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 ml-auto"
            onClick={() => {
              setDraftCategories(selectedCategories);
              setDraftNearby(isLocationFilter);
              setShowFilters((s) => !s);
            }}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 pt-2 pb-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando descuentos...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <EmptyState
            type={
              isLocationFilter
                ? "no-nearby"
                : selectedCategories.length > 0
                ? "filtered-empty"
                : searchTerm
                ? "no-results"
                : "no-discounts"
            }
            categoryName={categoryInfoName}
            onClearFilter={
              isLocationFilter
                ? () =>
                    router.push({
                      pathname: "/search",
                      query: { search: searchTerm },
                    })
                : selectedCategories.length > 0
                ? handleClearCategory
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredDiscounts.length} descuento
                {filteredDiscounts.length !== 1 ? "s" : ""} encontrado
                {filteredDiscounts.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiscounts.map((discount) => {
                // Determinar si es un HomePageDiscount o Discount
                const isHomePageDiscount = "title" in discount;

                return (
                  <CardDiscountCompact
                    key={discount.id}
                    id={discount.id}
                    title={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).title
                        : (discount as Discount).name || ""
                    }
                    image={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).image
                        : (discount as Discount).imageUrl || ""
                    }
                    category={discount.category || ""}
                    points={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).points
                        : 0
                    }
                    distance={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).distance
                        : "0.5 km"
                    }
                    expiration={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).expiration
                        : "30 días"
                    }
                    discountPercentage={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).discountPercentage ||
                          "0"
                        : (
                            discount as Discount
                          ).discountPercentage?.toString() || "0"
                    }
                    onNavigateToDetail={() => {
                      const distance = isHomePageDiscount
                        ? (discount as HomePageDiscount).distance
                        : undefined;
                      const url = distance
                        ? `/discount/${
                            discount.id
                          }?distance=${encodeURIComponent(distance)}`
                        : `/discount/${discount.id}`;
                      router.push(url);
                    }}
                    onFavoriteChange={(changedId, isFav) => {
                      // Si está aplicado el filtro de favoritos, quitar de la lista al dejar de ser favorito
                      if (selectedCategories.includes("favoritos") && !isFav) {
                        setFilteredDiscounts((prev) =>
                          prev.filter((d) => d.id !== changedId)
                        );
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

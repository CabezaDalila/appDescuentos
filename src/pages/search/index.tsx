import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { EmptyState } from "@/components/home/empty-state";
import { SearchSection } from "@/components/home/search-section";
import { PageHeader } from "@/components/Share/page-header";
import { EXPLORE_CATEGORIES } from "@/constants/categories";
import {
  getDiscountsBySearch,
  getHomePageDiscounts,
  getNearbyDiscounts,
  getPersonalizedDiscounts,
  MAX_DISTANCE_KM,
} from "@/lib/discounts";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import type { UserCredential } from "@/types/credentials";
import { Discount } from "@/types/discount";
import { getImageByCategory, matchesCategory } from "@/utils/category-mapping";
import { getFavoriteIds } from "@/utils/favorites";
import { Filter, X } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [allDiscounts, setAllDiscounts] = useState<SearchDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const hasInitialLoad = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLocationFilter, setIsLocationFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftNearby, setDraftNearby] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Discount[]>([]);
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
          // El SearchSection maneja el estado de showSearchResults a través de onSearchFocus
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

  // Función para aplicar filtros localmente (sin recargar desde servidor)
  const applyFiltersLocal = (
    discounts: SearchDiscount[],
    categoryIds: string[]
  ) => {
    let filtered = discounts;

    if (categoryIds && categoryIds.length > 0) {
      const includeFavorites = categoryIds.includes("favoritos");
      const categoryIdsOnly = categoryIds.filter(
        (categoryId) => categoryId !== "favoritos"
      );

      if (discounts.length > 0) {
        const favoriteIdSet = includeFavorites
          ? new Set(getFavoriteIds())
          : null;

        if ("name" in discounts[0]) {
          const fullDiscounts = discounts as Discount[];
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
          filtered = (discounts as HomePageDiscount[]).filter(
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
    }

    setFilteredDiscounts(filtered);
  };

  // Función para aplicar filtros en tiempo real (sin cerrar el popup) - solo filtra localmente
  const applyFiltersRealtime = useCallback(async () => {
    setSelectedCategories(draftCategories);
    setIsLocationFilter(draftNearby);

    // Aplicar filtros localmente sin recargar desde el servidor
    if (draftNearby) {
      // Si se activa el filtro de ubicación, necesitamos recargar
      try {
        const pos = await getCurrentPosition();
        const queryObj: Record<string, string> = {};
        if (searchTerm.trim().length >= 2) queryObj.search = searchTerm.trim();
        if (draftCategories.length > 0)
          queryObj.categories = draftCategories.join(",");
        queryObj.location = "true";
        queryObj.lat = String(pos.lat);
        queryObj.lng = String(pos.lng);
        router.push({ pathname: "/search", query: queryObj }, undefined, {
          shallow: true,
        });
      } catch {
        // Si falla geolocalización, solo aplicar filtros de categorías localmente
        applyFiltersLocal(allDiscounts, draftCategories);
      }
    } else {
      // Solo aplicar filtros de categorías localmente
      applyFiltersLocal(allDiscounts, draftCategories);
    }
  }, [draftCategories, draftNearby, allDiscounts, searchTerm, router]);

  // Sincronizar drafts con los valores actuales cuando se abre el popup
  useEffect(() => {
    if (showFilters) {
      setDraftCategories(selectedCategories);
      setDraftNearby(isLocationFilter);
    }
  }, [showFilters, selectedCategories, isLocationFilter]);

  // Aplicar filtros en tiempo real cuando cambian los drafts (solo si el popup está abierto)
  useEffect(() => {
    if (showFilters) {
      // Usar un pequeño delay para evitar múltiples llamadas rápidas
      const timeoutId = setTimeout(() => {
        applyFiltersRealtime();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [draftCategories, draftNearby, showFilters, applyFiltersRealtime]);

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

    // Si solo cambian las categorías y ya tenemos datos cargados, solo aplicar filtros localmente
    const categoriesRaw = router.query.categories as unknown;
    const urlCategories: string[] = [];
    if (typeof categoriesRaw === "string") {
      urlCategories.push(
        ...(categoriesRaw as string)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      );
    } else if (typeof category === "string") {
      urlCategories.push(category as string);
    }

    // Si solo cambió categories y ya tenemos datos, solo filtrar localmente
    const hasOnlyCategoryChange =
      hasInitialLoad.current &&
      allDiscounts.length > 0 &&
      !location &&
      !lat &&
      !lng &&
      !personalized &&
      !search &&
      !q;

    if (hasOnlyCategoryChange) {
      // Solo aplicar filtros localmente sin recargar
      applyFilters(allDiscounts, urlCategories);
      return;
    }

    const loadDiscounts = async () => {
      try {
        setLoading(true);

        // Verificar si hay filtro de ubicación
        const hasLocationFilter = location === "true" && lat && lng;
        setIsLocationFilter(!!hasLocationFilter);
        setDraftNearby(!!hasLocationFilter);
        if (hasLocationFilter) {
          setFilteredDiscounts([]);
        }

        let data: SearchDiscount[] = [];

        if (hasLocationFilter) {
          const latitude = parseFloat(lat as string);
          const longitude = parseFloat(lng as string);

          data = await getNearbyDiscounts(latitude, longitude, MAX_DISTANCE_KM);
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
          setSearchTerm(urlTerm);
        } else {
          data = await getHomePageDiscounts();
        }

        // Guardar todos los descuentos sin filtrar
        setAllDiscounts(data);
        hasInitialLoad.current = true;

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

  // (clear location se hace inline donde se usa)

  // Función para aplicar filtros y cerrar el popup
  const applyFiltersAndClose = () => {
    // Solo cerrar el popup - los filtros ya se aplicaron en tiempo real
    setShowFilters(false);

    // Actualizar la URL sin recargar (solo para mantener sincronización con la URL)
    // Usar replace en lugar de push para evitar que se dispare el useEffect de carga
    const queryObj: Record<string, string> = {};
    if (searchTerm.trim().length >= 2) queryObj.search = searchTerm.trim();
    if (draftCategories.length > 0)
      queryObj.categories = draftCategories.join(",");
    if (draftNearby) {
      // Si hay filtro de ubicación, ya se manejó en applyFiltersRealtime
      const lat = router.query.lat as string;
      const lng = router.query.lng as string;
      if (lat && lng) {
        queryObj.location = "true";
        queryObj.lat = lat;
        queryObj.lng = lng;
      }
    }
    router.replace({ pathname: "/search", query: queryObj }, undefined, {
      shallow: true,
    });
  };

  // Función para limpiar todos los filtros y mostrar todos los descuentos
  const handleViewAllDiscounts = () => {
    setSelectedCategories([]);
    setIsLocationFilter(false);
    setSearchTerm("");
    router.push({ pathname: "/search", query: {} });
  };

  const categoryInfoName =
    selectedCategories.length > 0
      ? categoryLabelMap[selectedCategories[0]]
      : undefined;

  return (
    <div className="w-full min-h-screen bg-gray-50 with-bottom-nav-pb">
      {/* Header y buscador unificados en sticky */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Header con título y botón de retroceso */}
        <PageHeader
          title="Buscar"
          onBack={() => {
            // Resetear el estado de búsqueda
            setSearchTerm("");
            setSelectedCategories([]);
            setShowSearchResults(false);
            setSearchResults([]);
            setIsLocationFilter(false);
            // Redirigir al home
            router.push("/home");
          }}
        />

        {/* Buscador y filtros */}
        <div className="border-b border-gray-200">
          <div className="py-3">
            <SearchSection
              searchTerm={searchTerm}
              searchResults={searchResults}
              isSearching={isSearching}
              showSearchResults={showSearchResults}
              onSearchChange={setSearchTerm}
              onSearchFocus={() =>
                searchTerm.trim().length >= 2 && setShowSearchResults(true)
              }
              onSearchBlur={() =>
                setTimeout(() => setShowSearchResults(false), 200)
              }
              onClearSearch={() => {
                setSearchTerm("");
                setShowSearchResults(false);
              }}
              onSelectResult={(d) => {
                setShowSearchResults(false);
                router.push(`/discount/${d.id}`);
              }}
              showFilterButton={true}
              hasActiveFilters={
                selectedCategories.length > 0 || isLocationFilter
              }
              onFilterClick={() => {
                setDraftCategories(selectedCategories);
                setDraftNearby(isLocationFilter);
                setShowFilters((s) => !s);
              }}
              compact={true}
            />

            {/* Panel de filtros - Popup desde abajo estilo Spotify */}
            {showFilters && (
              <>
                {/* Overlay oscuro con backdrop blur */}
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                  onClick={applyFiltersAndClose}
                />
                {/* Popup que sale desde abajo - no tapa la barra de navegación */}
                <div
                  className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] md:max-h-[80vh] lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-3xl lg:w-full lg:max-h-[90vh] xl:max-w-4xl"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Handle bar */}
                  <div className="flex justify-center pt-2 pb-1.5 sm:pt-3 sm:pb-2 md:pt-4 md:pb-3 lg:hidden">
                    <div className="w-12 h-1.5 sm:w-14 sm:h-1.5 bg-gray-300 rounded-full" />
                  </div>

                  {/* Contenido con scroll en tablets si es necesario */}
                  <div className="flex-1 overflow-y-auto px-3 pb-2 sm:px-4 sm:pb-3 md:px-6 md:pb-4 lg:px-8 lg:pb-5 xl:px-10 xl:pb-6">
                    <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4 md:text-xl md:mb-5 lg:text-2xl lg:mb-6">
                        Categorías
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-2 md:gap-3 md:grid-cols-3 lg:gap-4 lg:grid-cols-4 xl:grid-cols-4 xl:gap-5">
                        {EXPLORE_CATEGORIES.map((categoryDef) => (
                          <label
                            key={categoryDef.id}
                            className={`flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 p-2 sm:p-2.5 md:p-3 lg:p-3.5 xl:p-4 rounded-lg cursor-pointer transition-all ${
                              draftCategories.includes(categoryDef.id)
                                ? "bg-purple-50 border-2 border-purple-300 shadow-sm sm:shadow-md"
                                : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={draftCategories.includes(categoryDef.id)}
                              onChange={(e) => {
                                setDraftCategories((prev) =>
                                  e.target.checked
                                    ? Array.from(
                                        new Set([...prev, categoryDef.id])
                                      )
                                    : prev.filter(
                                        (categoryId) =>
                                          categoryId !== categoryDef.id
                                      )
                                );
                              }}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 flex-shrink-0"
                            />
                            <span
                              className={`text-xs sm:text-sm md:text-base lg:text-base xl:text-lg ${
                                draftCategories.includes(categoryDef.id)
                                  ? "text-purple-700 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {categoryDef.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 sm:mt-5 sm:pt-5 md:mt-6 md:pt-6 lg:mt-8 lg:pt-8 xl:mt-10 xl:pt-10 border-t border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4 md:text-xl md:mb-5 lg:text-2xl lg:mb-6">
                        Otros filtros
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 xl:gap-5">
                        <label
                          className={`flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 p-2 sm:p-2.5 md:p-3 lg:p-3.5 xl:p-4 rounded-lg cursor-pointer transition-all ${
                            draftCategories.includes("favoritos")
                              ? "bg-purple-50 border-2 border-purple-300 shadow-sm sm:shadow-md"
                              : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95"
                          }`}
                        >
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
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 flex-shrink-0"
                          />
                          <span
                            className={`text-xs sm:text-sm md:text-base lg:text-base xl:text-lg ${
                              draftCategories.includes("favoritos")
                                ? "text-purple-700 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            Favoritos
                          </span>
                        </label>
                        <label
                          className={`flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 p-2 sm:p-2.5 md:p-3 lg:p-3.5 xl:p-4 rounded-lg cursor-pointer transition-all ${
                            draftNearby
                              ? "bg-green-50 border-2 border-green-300 shadow-sm sm:shadow-md"
                              : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={draftNearby}
                            onChange={(e) => setDraftNearby(e.target.checked)}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-0 flex-shrink-0"
                          />
                          <span
                            className={`text-xs sm:text-sm md:text-base lg:text-base xl:text-lg ${
                              draftNearby
                                ? "text-green-700 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            Cerca de ti
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Botones fijos en la parte inferior */}
                  <div className="border-t border-gray-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-5 xl:px-10 xl:py-6 flex justify-end gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                    <button
                      className="px-5 py-2 sm:px-6 sm:py-2.5 md:px-7 md:py-3 lg:px-8 lg:py-3.5 xl:px-10 xl:py-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors shadow-sm sm:shadow-md"
                      onClick={() => {
                        setDraftCategories([]);
                        setDraftNearby(false);
                      }}
                    >
                      Limpiar
                    </button>
                    <button
                      className="px-5 py-2 sm:px-6 sm:py-2.5 md:px-7 md:py-3 lg:px-8 lg:py-3.5 xl:px-10 xl:py-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg transition-colors shadow-md sm:shadow-lg"
                      onClick={applyFiltersAndClose}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chips de filtros activos */}
          {(selectedCategories.length > 0 || isLocationFilter) && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategories.slice(0, maxCategoryChips).map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    <Filter className="w-3 h-3" />
                    {categoryLabelMap[cat] || cat}
                    <button
                      onClick={() => handleClearCategory(cat)}
                      className="ml-0.5 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Quitar filtro ${
                        categoryLabelMap[cat] || cat
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {selectedCategories.length > maxCategoryChips && (
                  <button
                    className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
                    onClick={() => setShowFilters(true)}
                    title={selectedCategories
                      .slice(maxCategoryChips)
                      .map(
                        (categoryId) =>
                          categoryLabelMap[categoryId] || categoryId
                      )
                      .join(", ")}
                  >
                    +{selectedCategories.length - maxCategoryChips}
                  </button>
                )}

                {isLocationFilter && (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    <Filter className="w-3 h-3" />
                    Cerca de ti
                    <button
                      onClick={() =>
                        router.push({
                          pathname: "/search",
                          query: { search: searchTerm },
                        })
                      }
                      className="ml-0.5 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      aria-label="Quitar filtro de ubicación"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 pt-4 pb-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLocationFilter
                ? "Calculando descuentos cercanos..."
                : "Cargando descuentos..."}
            </p>
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
              isLocationFilter || selectedCategories.length > 0
                ? handleViewAllDiscounts
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
                        : (discount as Discount).imageUrl ||
                          (discount as Discount).image ||
                          getImageByCategory(discount.category)
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
                        setFilteredDiscounts((prev) => {
                          const updated = prev.filter(
                            (d) => d.id !== changedId
                          );
                          // Si quedó vacía la lista y el filtro de favoritos está activo, redirigir a home
                          if (updated.length === 0) {
                            router.push("/home");
                          }
                          return updated;
                        });
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

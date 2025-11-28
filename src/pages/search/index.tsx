import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { EmptyState } from "@/components/home/empty-state";
import { SearchSection } from "@/components/home/search-section";
import { PageHeader } from "@/components/Share/page-header";
import { EXPLORE_CATEGORIES } from "@/constants/categories";
import {
  getDiscountsBySearch,
  getHomePageDiscounts,
  getNearbyDiscountsProgressive,
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
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
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
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const touchStartScrollTop = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQueryList = window.matchMedia("(min-width: 1024px)");
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

      if (next.length >= 2) {
        try {
          setIsSearching(true);
          const results = await getDiscountsBySearch(next);
          setSearchResults(results);
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

  const applyFiltersRealtime = useCallback(async () => {
    setSelectedCategories(draftCategories);
    setIsLocationFilter(draftNearby);

    if (draftNearby) {
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
        applyFiltersLocal(allDiscounts, draftCategories);
      }
    } else {
      applyFiltersLocal(allDiscounts, draftCategories);
    }
  }, [draftCategories, draftNearby, allDiscounts, searchTerm, router]);

  useEffect(() => {
    if (showFilters) {
      setDraftCategories(selectedCategories);
      setDraftNearby(isLocationFilter);
      setDragY(0);
    }
  }, [showFilters, selectedCategories, isLocationFilter]);

  useEffect(() => {
    if (showFilters) {
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

  useEffect(() => {
    if (typeof openId === "string" && openId.length > 0) {
      const id = openId;
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

    const hasLocationFilter = location === "true" && lat && lng;
    const hasOnlyCategoryChange =
      hasInitialLoad.current &&
      allDiscounts.length > 0 &&
      !hasLocationFilter &&
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
        setFilteredDiscounts([]);
        setAllDiscounts([]);

        const hasLocationFilter = location === "true" && lat && lng;
        setIsLocationFilter(!!hasLocationFilter);
        setDraftNearby(!!hasLocationFilter);

        setLoading(true);

        let data: SearchDiscount[] = [];

        if (hasLocationFilter) {
          const latitude = parseFloat(lat as string);
          const longitude = parseFloat(lng as string);

          setLoadingMore(true);
          setLoading(true);

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

          const finalData = await getNearbyDiscountsProgressive(
            latitude,
            longitude,
            MAX_DISTANCE_KM,
            (batch, isComplete) => {
              if (batch.length > 0) {
                setAllDiscounts((prev) => {
                  const combined = [...prev, ...batch];
                  const unique = combined.filter(
                    (discount, index, self) =>
                      index === self.findIndex((d) => d.id === discount.id)
                  );
                  const sorted = unique.sort((a, b) => {
                    const distanceA =
                      "distance" in a && a.distance
                        ? parseFloat(a.distance.replace(/[^\d.]/g, ""))
                        : 999;
                    const distanceB =
                      "distance" in b && b.distance
                        ? parseFloat(b.distance.replace(/[^\d.]/g, ""))
                        : 999;
                    return distanceA - distanceB;
                  });

                  if (urlCategories.length === 0) {
                    setFilteredDiscounts(sorted);
                  }

                  setLoading(false);

                  return sorted;
                });
              }

              if (isComplete) {
                setLoading(false);
                setLoadingMore(false);
              }
            },
            5
          );

          data = finalData;

          setLoading(false);
          setLoadingMore(false);

          setAllDiscounts(finalData);
          hasInitialLoad.current = true;

          if (urlCategories.length > 0) {
            applyFilters(finalData, urlCategories);
          } else {
            const sortedFinal = [...finalData].sort((a, b) => {
              const distanceA =
                "distance" in a && a.distance
                  ? parseFloat(a.distance.replace(/[^\d.]/g, ""))
                  : 999;
              const distanceB =
                "distance" in b && b.distance
                  ? parseFloat(b.distance.replace(/[^\d.]/g, ""))
                  : 999;
              return distanceA - distanceB;
            });
            setFilteredDiscounts(sortedFinal);
          }

          return;
        } else if (personalized === "true") {
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
              if (
                bank &&
                typeof type === "string" &&
                typeof brand === "string" &&
                typeof level === "string"
              ) {
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

        setAllDiscounts(data);
        hasInitialLoad.current = true;

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

        applyFilters(data, urlCategories);
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const applyFiltersAndClose = () => {
    setShowFilters(false);
    setDragY(0);

    const queryObj: Record<string, string> = {};
    if (searchTerm.trim().length >= 2) queryObj.search = searchTerm.trim();
    if (draftCategories.length > 0)
      queryObj.categories = draftCategories.join(",");
    if (draftNearby) {
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1024) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = contentRef.current?.scrollTop || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1024) return;
    if (touchStartY.current === null) return;

    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;
    const scrollTop = contentRef.current?.scrollTop || 0;
    const isAtTop = scrollTop === 0;

    if (diffY > 0 && (isAtTop || dragY > 0)) {
      if (dragY > 10 || (isAtTop && diffY > 10)) {
        e.preventDefault();
        setDragY(diffY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (window.innerWidth >= 1024) return;

    const threshold = 100;

    if (dragY > threshold) {
      applyFiltersAndClose();
    } else {
      setDragY(0);
    }

    touchStartY.current = null;
    touchStartScrollTop.current = null;
  };

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
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <PageHeader
          title="Buscar"
          onBack={() => {
            setSearchTerm("");
            setSelectedCategories([]);
            setShowSearchResults(false);
            setSearchResults([]);
            setIsLocationFilter(false);
            router.push("/home");
          }}
        />

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

            {showFilters && (
              <>
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in transition-opacity duration-200"
                  style={{
                    opacity: dragY > 0 ? 0.6 - dragY / 500 : undefined,
                  }}
                  onClick={applyFiltersAndClose}
                />
                <div
                  ref={modalRef}
                  className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] md:max-h-[80vh] lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-3xl lg:w-full lg:max-h-[90vh] xl:max-w-4xl transition-transform duration-200 ease-out"
                  style={{
                    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
                    opacity: dragY > 0 ? 1 - dragY / 300 : undefined,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex justify-center pt-2 pb-1.5 sm:pt-3 sm:pb-2 md:pt-4 md:pb-3 lg:hidden cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                  >
                    <div className="w-12 h-1.5 sm:w-14 sm:h-1.5 bg-gray-300 rounded-full" />
                  </div>

                  <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-6"
                    style={{ touchAction: dragY > 0 ? "none" : "pan-y" }}
                  >
                    <div className="pt-4 pb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-5 lg:mb-6">
                        Filtros
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {EXPLORE_CATEGORIES.map((categoryDef) => (
                          <label
                            key={categoryDef.id}
                            className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-lg cursor-pointer transition-all ${
                              draftCategories.includes(categoryDef.id)
                                ? "bg-purple-50 border-2 border-purple-300 shadow-sm"
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
                              className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 flex-shrink-0"
                            />
                            <span
                              className={`text-sm sm:text-base ${
                                draftCategories.includes(categoryDef.id)
                                  ? "text-purple-700 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {categoryDef.label}
                            </span>
                          </label>
                        ))}
                        <label
                          className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-lg cursor-pointer transition-all ${
                            draftCategories.includes("favoritos")
                              ? "bg-purple-50 border-2 border-purple-300 shadow-sm"
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
                            className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 flex-shrink-0"
                          />
                          <span
                            className={`text-sm sm:text-base ${
                              draftCategories.includes("favoritos")
                                ? "text-purple-700 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            Favoritos
                          </span>
                        </label>
                        <label
                          className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-lg cursor-pointer transition-all ${
                            draftNearby
                              ? "bg-purple-50 border-2 border-purple-300 shadow-sm"
                              : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={draftNearby}
                            onChange={(e) => setDraftNearby(e.target.checked)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 flex-shrink-0"
                          />
                          <span
                            className={`text-sm sm:text-base ${
                              draftNearby
                                ? "text-purple-700 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            Cerca de ti
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex justify-end gap-3">
                    <button
                      className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors"
                      onClick={() => {
                        setDraftCategories([]);
                        setDraftNearby(false);
                      }}
                    >
                      Limpiar
                    </button>
                    <button
                      className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-medium text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg transition-colors"
                      onClick={applyFiltersAndClose}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

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

      <div className="px-4 pt-4 pb-4">
        {loading || (isLocationFilter && loadingMore) ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLocationFilter
                ? "Calculando descuentos cercanos..."
                : "Cargando descuentos..."}
            </p>
          </div>
        ) : filteredDiscounts.length === 0 && !loadingMore ? (
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiscounts.map((discount) => {
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
                          : undefined
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
                      discountLocation={
                        isHomePageDiscount
                          ? (discount as HomePageDiscount).location
                            ? {
                                latitude: (discount as HomePageDiscount)
                                  .location!.latitude,
                                longitude: (discount as HomePageDiscount)
                                  .location!.longitude,
                              }
                            : undefined
                          : (discount as Discount).location
                          ? {
                              latitude: (discount as Discount).location!
                                .latitude,
                              longitude: (discount as Discount).location!
                                .longitude,
                            }
                          : undefined
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
                        if (
                          selectedCategories.includes("favoritos") &&
                          !isFav
                        ) {
                          setFilteredDiscounts((prev) => {
                            const updated = prev.filter(
                              (d) => d.id !== changedId
                            );
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

              {loadingMore && filteredDiscounts.length > 0 && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <p className="text-sm">
                      Buscando más descuentos cercanos...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

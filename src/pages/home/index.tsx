import { EXPLORE_CATEGORIES } from "@/constants/categories";
import { useCachedDiscounts } from "@/hooks/useCachedDiscounts";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserCredentials } from "@/hooks/useUserCredentials";
import { getDiscountsBySearch, getTrendingDiscounts } from "@/lib/discounts";
import { Discount, HomePageDiscount } from "@/types/discount";
import { isUserEligibleForDiscountRestrictions } from "@/utils/membership-match";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

// Componentes de la página de inicio
import { QuickActionsSection } from "@/components/home/categories-section";
import { DiscountsSection } from "@/components/home/discounts-section";
import { ExploreCategoriesSection } from "@/components/home/explore-categories-section";
import { Header } from "@/components/home/header";
import { PersonalizedOffersSection } from "@/components/home/personalized-offers-section";
import { SearchSection } from "@/components/home/search-section";
import { TrendingSection } from "@/components/home/trending-section";

export default function Home() {
  const router = useRouter();
  const { getUnreadCount } = useNotifications();

  // Usar hook con caché para descuentos
  const { discounts, loading } = useCachedDiscounts();

  const [greeting, setGreeting] = useState("Buenas noches");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Discount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const {
    userMemberships,
    userCredentials,
    loading: membershipsLoading,
  } = useUserCredentials();
  const [trendingDiscounts, setTrendingDiscounts] = useState<HomePageDiscount[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Determinar saludo según la hora del día
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Buenos días");
    } else if (hour < 18) {
      setGreeting("Buenas tardes");
    } else {
      setGreeting("Buenas noches");
    }
  }, []);

  // Cargar descuentos de tendencias
  useEffect(() => {
    const loadTrending = async () => {
      try {
        setTrendingLoading(true);
        const trending = await getTrendingDiscounts(5); // Máximo 5, solo con promedio > 0
        setTrendingDiscounts(trending);
      } catch (error) {
        console.error("Error cargando tendencias:", error);
        setTrendingDiscounts([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    loadTrending();
  }, []);

  // Función de búsqueda con Firebase y debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Debounce de búsqueda y manejo de dropdown (como en /buscar)
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const handler = setTimeout(async () => {
      if (term.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      try {
        setIsSearching(true);
        const results = await getDiscountsBySearch(term);
        const eligibleResults = results.filter((discount) =>
          isUserEligibleForDiscountRestrictions(
            userMemberships,
            userCredentials,
            discount,
            { requireRestrictions: true, strictPriority: true }
          )
        );
        setSearchResults(eligibleResults);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error al buscar descuentos:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, userMemberships, userCredentials]);

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navegar a búsqueda para categorías normales
    router.push(`/search?category=${categoryId}`);
  };

  const handleNavigateToDetail = (discountId: string, url?: string) => {
    router.push(url || `/discount/${discountId}`);
  };

  const handleSelectSearchResult = (discount: Discount) => {
    const term = discount.name || "";
    setSearchTerm(term);
    setShowSearchResults(false);
    // Navegar a la vista de búsqueda con el término aplicado y solicitar abrir detalle
    const query: Record<string, string> = { openId: discount.id } as Record<
      string,
      string
    >;
    if (term.trim().length >= 2) query.search = term.trim();
    router.push({ pathname: "/search", query });
  };

  const handleOfferClick = (discountId: string, url?: string) => {
    router.push(url || `/discount/${discountId}`);
  };

  // Usar todas las categorías disponibles
  const selectedCategories = EXPLORE_CATEGORIES;

  const membershipFilteredDiscounts = useMemo(() => {
    return discounts.filter((discount) =>
      isUserEligibleForDiscountRestrictions(
        userMemberships,
        userCredentials,
        discount,
        { requireRestrictions: true, strictPriority: true }
      )
    );
  }, [discounts, userMemberships, userCredentials]);

  const membershipFilteredTrendingDiscounts = useMemo(() => {
    return trendingDiscounts.filter((discount) =>
      isUserEligibleForDiscountRestrictions(
        userMemberships,
        userCredentials,
        discount,
        { requireRestrictions: true, strictPriority: true }
      )
    );
  }, [trendingDiscounts, userMemberships, userCredentials]);

  return (
    <div className="w-full max-w-full min-h-screen bg-white overflow-x-hidden pb-24 lg:pb-0">
      {/* Header y Search - Siempre en la parte superior */}
      <div className="sticky top-0 z-40 bg-white border-none safe-area-pt">
        <Header
          greeting={greeting}
          notificationCount={getUnreadCount()}
          onNotificationClick={() => router.push("/notifications")}
        />

        <SearchSection
          searchTerm={searchTerm}
          searchResults={searchResults}
          isSearching={isSearching}
          showSearchResults={showSearchResults}
          onSearchChange={handleSearch}
          onSearchFocus={() =>
            searchTerm.trim().length >= 2 && setShowSearchResults(true)
          }
          onSearchBlur={() =>
            setTimeout(() => setShowSearchResults(false), 200)
          }
          onClearSearch={clearSearch}
          onSelectResult={handleSelectSearchResult}
          showFilterButton={true}
          onFilterClick={() => {
            const term = searchTerm.trim();
            const query: Record<string, string> = {};
            if (term.length >= 2) query.search = term;
            query.filters = "true";
            router.push({ pathname: "/search", query });
          }}
        />
      </div>

      {/* Acciones rápidas */}
      <div className="px-3 sm:px-4 lg:px-4 xl:px-6 2xl:px-8 mt-2">
        <QuickActionsSection onCategoryClick={handleCategoryClick} />
      </div>

      {/* Contenido principal con layout responsivo */}
      <div className="lg:flex lg:gap-6 lg:px-4 xl:px-6 2xl:px-8">
        {/* Columna izquierda - Acciones rápidas y categorías */}
        <div className="lg:w-1/4 xl:w-1/5 2xl:w-1/6 lg:flex-shrink-0">
          <ExploreCategoriesSection
            categories={selectedCategories}
            onCategoryClick={handleCategoryClick}
            onViewAll={() => router.push("/search")}
          />
        </div>

        {/* Ofertas y descuentos */}
        <div className="lg:w-3/4 xl:w-4/5 2xl:w-5/6 lg:flex-1">
          <PersonalizedOffersSection
            onOfferClick={handleOfferClick}
            userMemberships={userMemberships}
            userCredentials={userCredentials}
            membershipsLoading={membershipsLoading}
          />

          <TrendingSection
            discounts={membershipFilteredTrendingDiscounts}
            onOfferClick={handleOfferClick}
            onViewAll={() => router.push("/search")}
            loading={trendingLoading}
          />

          <DiscountsSection
            discounts={membershipFilteredDiscounts}
            loading={loading}
            onDiscountClick={handleNavigateToDetail}
            onViewAll={() => router.push("/search")}
          />
        </div>
      </div>
    </div>
  );
}

import { EXPLORE_CATEGORIES } from "@/constants/categories";
import { getDiscountsBySearch, getHomePageDiscounts } from "@/lib/discounts";
import { Discount } from "@/types/discount";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

  const [greeting, setGreeting] = useState("Buenas noches");
  const [notificationCount, setNotificationCount] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Discount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Cargar descuentos desde Firebase
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        setLoading(true);
        const data = await getHomePageDiscounts();
        setDiscounts(data);
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, []);

  // Función de búsqueda con Firebase y debounce
  const handleSearch = async (value: string) => {
    setSearchTerm(value);

    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Mostrar resultados si hay texto
    if (value.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await getDiscountsBySearch(value);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error al buscar descuentos:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navegar a la página de búsqueda con el filtro de categoría
    router.push(`/search?category=${categoryId}`);
  };

  // const handleBankClick = (bankId: string) => {
  //   // Navegar a la página de búsqueda con el filtro de banco
  //   router.push(`/search?bank=${bankId}`);
  // };

  const handleOfferClick = (offerId: string) => {
    // Navegar al detalle de la oferta
    router.push(`/discount/${offerId}`);
  };

  const handleNavigateToDetail = (discountId: string) => {
    router.push(`/discount/${discountId}`);
  };

  const handleSelectSearchResult = (discount: Discount) => {
    setSearchTerm(discount.name);
    setShowSearchResults(false);
    // Aquí puedes navegar al detalle del descuento si quieres
    router.push(`/discount/${discount.id}`);
  };

  const selectedCategories = EXPLORE_CATEGORIES.filter((category) =>
    ["food", "fashion", "technology", "home"].includes(category.id)
  );

  return (
    <div className="w-full min-h-screen bg-white">
      <Header
        greeting={greeting}
        notificationCount={notificationCount}
        onNotificationClick={() => router.push("/notifications")}
        onThemeToggle={() => console.log("Toggle theme")}
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
        onSearchBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
        onClearSearch={clearSearch}
        onSelectResult={handleSelectSearchResult}
      />

      <QuickActionsSection onCategoryClick={handleCategoryClick} />

      <ExploreCategoriesSection
        categories={selectedCategories}
        onCategoryClick={handleCategoryClick}
        onViewAll={() => router.push("/search")}
      />

      {/* <PopularBanksSection
        onBankClick={handleBankClick}
        onViewAll={() => router.push("/search")}
      /> */}

      <PersonalizedOffersSection onOfferClick={handleOfferClick} />

      <TrendingSection onOfferClick={handleOfferClick} />

      <DiscountsSection
        discounts={discounts}
        loading={loading}
        onDiscountClick={handleNavigateToDetail}
        onViewAll={() => router.push("/search")}
      />
    </div>
  );
}

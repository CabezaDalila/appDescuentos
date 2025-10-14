import { EXPLORE_CATEGORIES } from "@/constants/categories";
import { Card, Membership } from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { getDiscountsBySearch, getHomePageDiscounts } from "@/lib/discounts";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import { Discount } from "@/types/discount";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Tipo específico para los descuentos de la página de inicio
interface HomePageDiscount {
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
}

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
  const { user } = useAuth();

  const [greeting, setGreeting] = useState("Buenas noches");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Discount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [discounts, setDiscounts] = useState<HomePageDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [userCredentials, setUserCredentials] = useState<
    Array<{
      bank: string;
      type: string;
      brand: string;
      level: string;
    }>
  >([]);

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

  // Cargar membresías y credenciales activas del usuario
  useEffect(() => {
    const loadUserMemberships = async () => {
      if (!user) {
        setUserMemberships([]);
        setUserCredentials([]);
        return;
      }

      try {
        const memberships = await getActiveMemberships();

        // Array de nombres de membresías
        const membershipNames: string[] = [];
        // Array de credenciales completas
        const credentials: Array<{
          bank: string;
          type: string;
          brand: string;
          level: string;
        }> = [];

        memberships.forEach((m: Membership) => {
          // Agregar el nombre de la membresía
          membershipNames.push(m.name);

          // Agregar las credenciales completas de cada tarjeta
          if (m.cards && m.cards.length > 0) {
            m.cards.forEach((card: Card) => {
              credentials.push({
                bank: m.name, // El banco es el nombre de la membresía
                type: card.type,
                brand: card.brand,
                level: card.level,
              });
            });
          }
        });

        setUserMemberships(membershipNames);
        setUserCredentials(credentials);
      } catch (error) {
        console.error("Error cargando membresías del usuario:", error);
        setUserMemberships([]);
        setUserCredentials([]);
      }
    };

    loadUserMemberships();
  }, [user]);

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

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/search?category=${categoryId}`);
  };

  // const handleBankClick = (bankId: string) => {
  //   // Navegar a la página de búsqueda con el filtro de banco
  //   router.push(`/search?bank=${bankId}`);
  // };

  const handleNavigateToDetail = (discountId: string) => {
    router.push(`/discount/${discountId}`);
  };

  const handleSelectSearchResult = (discount: Discount) => {
    setSearchTerm(discount.name);
    setShowSearchResults(false);
    router.push(`/discount/${discount.id}`);
  };

  const handleOfferClick = (discountId: string) => {
    router.push(`/discount/${discountId}`);
  };

  const selectedCategories = EXPLORE_CATEGORIES.filter((category) =>
    ["food", "fashion", "technology", "home"].includes(category.id)
  );

  // Obtener descuentos de tendencias (máximo 3 para que quepan bien en el ancho)
  const trendingDiscounts = discounts.slice(0, 3);

  return (
    <div className="w-full max-w-full min-h-screen bg-white overflow-x-hidden pb-24 lg:pb-0">
      {/* Header y Search - Siempre en la parte superior */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 lg:border-none">
        <Header
          greeting={greeting}
          notificationCount={getUnreadCount()}
          onNotificationClick={() => router.push("/notifications")}
          onThemeToggle={() => {}}
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
        />
      </div>

      {/* Contenido principal con layout responsivo */}
      <div className="lg:flex lg:gap-6 lg:px-4 xl:px-6 2xl:px-8">
        {/* Columna izquierda - Acciones rápidas y categorías */}
        <div className="lg:w-1/3 xl:w-1/4 2xl:w-1/5 lg:flex-shrink-0">
          <QuickActionsSection onCategoryClick={handleCategoryClick} />

          <ExploreCategoriesSection
            categories={selectedCategories}
            onCategoryClick={handleCategoryClick}
            onViewAll={() => router.push("/search")}
          />
        </div>

        {/* Columna derecha - Ofertas y descuentos */}
        <div className="lg:w-2/3 xl:w-3/4 2xl:w-4/5 lg:flex-1">
          <PersonalizedOffersSection
            onOfferClick={handleOfferClick}
            userMemberships={userMemberships}
            userCredentials={userCredentials}
          />

          <TrendingSection
            discounts={trendingDiscounts}
            onOfferClick={handleOfferClick}
          />

          <DiscountsSection
            discounts={discounts}
            loading={loading}
            onDiscountClick={handleNavigateToDetail}
            onViewAll={() => router.push("/search")}
          />
        </div>
      </div>
    </div>
  );
}

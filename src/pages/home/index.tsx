import { EXPLORE_CATEGORIES } from "@/constants/categories";
import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
} from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { getDiscountsBySearch, getHomePageDiscounts } from "@/lib/discounts";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import type { UserCredential } from "@/types/credentials";
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
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
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
  const [userCredentials, setUserCredentials] = useState<UserCredential[]>([]);

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
        const credentials: UserCredential[] = [];

        const validTypes = CARD_TYPES.map((t) => t.value) as ReadonlyArray<
          Card["type"]
        >;
        const validBrands = CARD_BRANDS.map((b) => b.value) as ReadonlyArray<
          Card["brand"]
        >;
        const validLevels = CARD_LEVELS.map((l) => l.value) as ReadonlyArray<
          (typeof CARD_LEVELS)[number]["value"]
        >;

        const isValidType = (v: unknown): v is Card["type"] =>
          typeof v === "string" &&
          (validTypes as readonly string[]).includes(v);
        const isValidBrand = (v: unknown): v is Card["brand"] =>
          typeof v === "string" &&
          (validBrands as readonly string[]).includes(v);
        const isValidLevel = (
          v: unknown
        ): v is (typeof CARD_LEVELS)[number]["value"] =>
          typeof v === "string" &&
          (validLevels as readonly string[]).includes(v);

        memberships.forEach((m: unknown) => {
          const item = m as {
            name?: string;
            membershipName?: string;
            membershipCategory?: string;
            isCard?: boolean;
            card?: { type?: string; brand?: string; level?: string };
            cards?: Card[];
          };
          // La API getActiveMemberships devuelve items "normalizados":
          // - Para bancos con tarjetas: un item por tarjeta (isCard=true) con m.card
          // - Para otras membresías: un item por membresía (isCard=false)

          const name = item.name || item.membershipName;
          if (typeof name === "string" && name.trim().length > 0) {
            membershipNames.push(name);
          }

          // Solo hay credenciales cuando es banco con tarjeta
          if (item.isCard && item.membershipCategory === "banco" && item.card) {
            const bank = typeof name === "string" ? name : "";
            const type = isValidType(item.card.type)
              ? item.card.type
              : undefined;
            const brand = isValidBrand(item.card.brand)
              ? item.card.brand
              : undefined;
            const level = isValidLevel(item.card.level)
              ? item.card.level
              : undefined;

            if (bank && type && brand && level) {
              credentials.push({ bank, type, brand, level });
            }
          } else if (Array.isArray(item.cards) && item.cards.length > 0) {
            (item.cards as Card[]).forEach((card) => {
              const bank = typeof name === "string" ? name : "";
              const type = isValidType(card.type) ? card.type : undefined;
              const brand = isValidBrand(card.brand) ? card.brand : undefined;
              const level = isValidLevel(card.level) ? card.level : undefined;
              if (bank && type && brand && level) {
                credentials.push({ bank, type, brand, level });
              }
            });
          }
        });

        // Limpiar duplicados y valores inválidos
        const cleanedMemberships = Array.from(
          new Set(
            membershipNames.filter(
              (n) => typeof n === "string" && n.trim().length > 0
            )
          )
        );
        const cleanedCredentials = credentials.filter(
          (c) => c.bank && c.type && c.brand && c.level
        );

        setUserMemberships(cleanedMemberships);
        setUserCredentials(cleanedCredentials);
      } catch (error) {
        console.error("Error cargando membresías del usuario:", error);
        setUserMemberships([]);
        setUserCredentials([]);
      }
    };

    loadUserMemberships();
  }, [user]);

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
        setSearchResults(results);
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
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navegar a búsqueda para categorías normales
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

  const handleOfferClick = (discountId: string) => {
    router.push(`/discount/${discountId}`);
  };

  const selectedCategories = EXPLORE_CATEGORIES.filter((category) =>
    ["food", "fashion", "technology", "home"].includes(category.id)
  );

  return (
    <div className="w-full max-w-full min-h-screen bg-white overflow-x-hidden pb-24 lg:pb-0">
      {/* Header y Search - Siempre en la parte superior */}
      <div className="sticky top-0 z-40 bg-white border-none">
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
        />
      </div>

      {/* Acciones rápidas justo debajo del buscador */}
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

        {/* Columna derecha - Ofertas y descuentos */}
        <div className="lg:w-3/4 xl:w-4/5 2xl:w-5/6 lg:flex-1">
          <PersonalizedOffersSection
            onOfferClick={handleOfferClick}
            userMemberships={userMemberships}
            userCredentials={userCredentials}
          />

          <TrendingSection
            discounts={discounts.slice(0, 3)}
            onOfferClick={handleOfferClick}
            onViewAll={() => router.push("/search")}
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

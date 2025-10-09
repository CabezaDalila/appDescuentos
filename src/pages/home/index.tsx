import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { Card, CardContent } from "@/components/Share/card";
import { useAuth } from "@/hooks/useAuth";
import { getDiscountsBySearch, getHomePageDiscounts } from "@/lib/discounts";
import { Discount } from "@/types/discount";
import {
  ArrowRight,
  Bell,
  Gift,
  Heart,
  Laptop,
  MapPin,
  Moon,
  Search,
  Shirt,
  ShoppingCart,
  Star,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Datos de ejemplo para las categorías
const categories = [
  {
    id: "ofertas",
    label: "Ofertas",
    icon: Zap,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-yellow-400",
  },
  {
    id: "cerca",
    label: "Cerca",
    icon: MapPin,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-green-400",
  },
  {
    id: "favoritos",
    label: "Favoritos",
    icon: Heart,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-red-400",
  },
  {
    id: "cupones",
    label: "Cupones",
    icon: Gift,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-purple-400",
  },
];

// Datos de ejemplo para las categorías de exploración
const exploreCategories = [
  {
    id: "restaurantes",
    label: "Restaurantes",
    icon: Utensils,
    color: "bg-red-500",
  },
  {
    id: "supermercados",
    label: "Supermercados",
    icon: ShoppingCart,
    color: "bg-green-500",
  },
  { id: "moda", label: "Moda", icon: Shirt, color: "bg-purple-500" },
  { id: "tecnologia", label: "Tecnología", icon: Laptop, color: "bg-blue-500" },
];

// Datos de ejemplo para bancos populares
const popularBanks = [
  { id: "galicia", name: "Galicia", logo: "🏦" },
  { id: "santander", name: "Santander", logo: "🏦" },
  { id: "bbva", name: "BBVA", logo: "🏦" },
  { id: "macro", name: "Macro", logo: "🏦" },
  { id: "nacion", name: "Nación", logo: "🏦" },
];

// Datos de ejemplo para ofertas personalizadas
const personalizedOffers = [
  {
    id: "restaurante-1",
    title: "50% en tu restaurante favorito",
    subtitle: "Bella Italia",
    category: "Restaurantes",
    discount: "50%",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    id: "supermercado-1",
    title: "Reintegro en supermercados",
    subtitle: "Varios supermercados",
    category: "Supermercados",
    discount: "30%",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
];

// Datos de ejemplo para tendencias
const trendingOffers = [
  {
    id: "restaurante-trending",
    title: "50% de descuento en restaurant...",
    category: "Restaurantes",
    discount: "50%",
    rating: 4.8,
    image: "/placeholder.jpg",
  },
  {
    id: "supermercado-trending",
    title: "30% de reintegro en...",
    category: "Supermercados",
    discount: "30%",
    rating: 4.5,
    image: "/placeholder.jpg",
  },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Buenas noches");
  const [notificationCount, setNotificationCount] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Discount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
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

  const handleBankClick = (bankId: string) => {
    // Navegar a la página de búsqueda con el filtro de banco
    router.push(`/search?bank=${bankId}`);
  };

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

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header con saludo y notificaciones - Responsive */}
      <div className="w-full px-3 sm:px-4 pt-2 sm:pt-4 pb-3 sm:pb-4">
        <div className="flex items-start justify-between mb-4 sm:mb-5">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Descubre ofertas increíbles cerca de ti
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 pt-1">
            <button className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <button className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda con funcionalidad avanzada - Responsive */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="¿Qué estás buscando hoy?"
            value={searchTerm}
            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white shadow-sm hover:shadow-md transition-all"
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() =>
              searchTerm.trim().length >= 2 && setShowSearchResults(true)
            }
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Resultados de búsqueda - Responsive */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 sm:max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <span className="text-xs sm:text-sm">Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1 sm:py-2">
                  {searchResults.slice(0, 5).map((discount) => (
                    <button
                      key={discount.id}
                      onClick={() => handleSelectSearchResult(discount)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {discount.name || discount.title}
                          </div>
                          {discount.description && (
                            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {discount.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {discount.category && (
                            <span className="inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] bg-blue-100 text-primary-500 rounded-full">
                              {discount.category}
                            </span>
                          )}
                          {discount.discountPercentage && (
                            <span className="inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] bg-green-100 text-green-800 rounded-full">
                              {discount.discountPercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.trim().length > 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">
                  <span className="text-xs sm:text-sm">
                    No se encontraron resultados para "{searchTerm}"
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Navegación por categorías - Responsive */}
      <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Categorías
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex flex-col items-center gap-1 sm:gap-1.5"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${category.color} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
              >
                <category.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${category.iconColor}`}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Explorar categorías - Responsive */}
      <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Explorar categorías
          </h2>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {exploreCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`${category.color} rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-white text-left hover:opacity-90 transition-opacity hover:scale-105 transform`}
            >
              <category.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2" />
              <div className="text-xs sm:text-sm font-semibold">
                {category.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bancos populares - Responsive */}
      <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Bancos populares
          </h2>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todos <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {popularBanks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => handleBankClick(bank.id)}
              className="flex-shrink-0 bg-gray-100 rounded-lg sm:rounded-xl p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] hover:bg-gray-200 transition-colors"
            >
              <div className="text-lg sm:text-xl mb-1 sm:mb-2">{bank.logo}</div>
              <div className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">
                {bank.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hecho para ti - Responsive */}
      <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Hecho para ti
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-600">
              Basado en tus preferencias
            </p>
          </div>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todo <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {personalizedOffers.map((offer) => (
            <Card
              key={offer.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0">
                <div
                  className={`${offer.color} p-2.5 sm:p-3 text-white relative`}
                >
                  <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-white/20 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold">
                    {offer.discount}
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">
                      {offer.discount}
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-90">
                      {offer.category}
                    </div>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5 sm:mb-1">
                    {offer.title}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600">
                    {offer.subtitle}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tendencias - Responsive */}
      <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Tendencias
            </h2>
          </div>
          <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
            Populares
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {trendingOffers.map((offer) => (
            <Card
              key={offer.id}
              className="flex-shrink-0 w-40 sm:w-48 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-purple-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    {offer.discount}
                  </div>
                  <button className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-0.5 sm:p-1 rounded-full bg-white/80 hover:bg-white transition-colors">
                    <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
                  </button>
                  <div className="w-full h-20 sm:h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <div className="text-gray-400 text-sm sm:text-lg">📷</div>
                  </div>
                </div>
                <div className="p-2 sm:p-3">
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-xs bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {offer.category}
                    </span>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-current" />
                      <span className="text-[9px] sm:text-xs text-gray-600">
                        {offer.rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">
                    {offer.title}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Promos/Descuentos - Responsive */}
      <div className="w-full px-3 sm:px-4 mb-4 sm:mb-6 pb-20 sm:pb-6">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Promociones destacadas
          </h2>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {loading ? (
            <div className="col-span-full text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">
                Cargando descuentos...
              </p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="col-span-full text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-gray-600">
                No hay descuentos disponibles
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                Los descuentos aparecerán aquí cuando se agreguen desde el panel
                de administración
              </p>
            </div>
          ) : (
            discounts.map((discount) => (
              <CardDiscountCompact
                key={discount.id}
                title={discount.title}
                image={discount.image}
                category={discount.category}
                points={discount.points}
                distance={discount.distance}
                expiration={discount.expiration}
                discountPercentage={discount.discountPercentage}
                onNavigateToDetail={() => handleNavigateToDetail(discount.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

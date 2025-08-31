import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { 
  Search, 
  Bell, 
  Moon, 
  Zap, 
  MapPin, 
  Heart, 
  Gift, 
  Utensils, 
  ShoppingCart, 
  Shirt, 
  Laptop,
  Star,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { getDiscountsBySearch, getHomePageDiscounts } from "@/lib/firebase/discounts";
import { Discount } from "@/types/discount";

// Datos de ejemplo para las categorías
const categories = [
  { id: "ofertas", label: "Ofertas", icon: Zap, color: "bg-gradient-to-br from-purple-500 to-purple-600", iconColor: "text-yellow-400" },
  { id: "cerca", label: "Cerca", icon: MapPin, color: "bg-gradient-to-br from-purple-500 to-purple-600", iconColor: "text-green-400" },
  { id: "favoritos", label: "Favoritos", icon: Heart, color: "bg-gradient-to-br from-purple-500 to-purple-600", iconColor: "text-red-400" },
  { id: "cupones", label: "Cupones", icon: Gift, color: "bg-gradient-to-br from-purple-500 to-purple-600", iconColor: "text-purple-400" },
];

// Datos de ejemplo para las categorías de exploración
const exploreCategories = [
  { id: "restaurantes", label: "Restaurantes", icon: Utensils, color: "bg-red-500" },
  { id: "supermercados", label: "Supermercados", icon: ShoppingCart, color: "bg-green-500" },
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
    color: "bg-gradient-to-br from-purple-500 to-purple-600"
  },
  {
    id: "supermercado-1",
    title: "Reintegro en supermercados",
    subtitle: "Varios supermercados",
    category: "Supermercados",
    discount: "30%",
    color: "bg-gradient-to-br from-green-500 to-green-600"
  }
];

// Datos de ejemplo para tendencias
const trendingOffers = [
  {
    id: "restaurante-trending",
    title: "50% de descuento en restaurant...",
    category: "Restaurantes",
    discount: "50%",
    rating: 4.8,
    image: "/placeholder.jpg"
  },
  {
    id: "supermercado-trending",
    title: "30% de reintegro en...",
    category: "Supermercados",
    discount: "30%",
    rating: 4.5,
    image: "/placeholder.jpg"
  }
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

  // Función de búsqueda con Firebase
  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    
    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

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
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log(`Categoría clickeada: ${categoryId}`);
    // Aquí implementaremos la navegación a cada categoría
  };

  const handleBankClick = (bankId: string) => {
    console.log(`Banco clickeado: ${bankId}`);
    // Aquí implementaremos la navegación a cada banco
  };

  const handleOfferClick = (offerId: string) => {
    console.log(`Oferta clickeada: ${offerId}`);
    // Aquí implementaremos la navegación a cada oferta
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
    <div className="w-full h-screen bg-white overflow-y-auto">
      {/* Header con saludo y notificaciones */}
      <div className="w-full px-4 pt-8 pb-4">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{greeting}</h1>
            <p className="text-sm text-gray-600 leading-relaxed">Descubre ofertas increíbles cerca de ti</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 pt-1">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Moon className="w-6 h-6 text-gray-600" />
            </button>
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda con funcionalidad avanzada */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="¿Qué estás buscando hoy?"
            value={searchTerm}
            className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white shadow-sm hover:shadow-md transition-all"
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.trim().length > 0 && setShowSearchResults(true)}
          />
          
          {/* Resultados de búsqueda */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((discount) => (
                    <button
                      key={discount.id}
                      onClick={() => handleSelectSearchResult(discount)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                          {discount.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{discount.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {discount.category && (
                            <span className="inline-block px-2 py-0.5 text-[10px] bg-blue-100 text-primary-500 rounded-full">
                              {discount.category}
                            </span>
                          )}
                          {discount.discountPercentage && (
                            <span className="inline-block px-2 py-0.5 text-[10px] bg-green-100 text-green-800 rounded-full">
                              {discount.discountPercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.trim().length > 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron resultados para "{searchTerm}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Navegación por categorías */}
      <div className="w-full px-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-900">Categorías</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-14 h-14 rounded-full ${category.color} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                <category.icon className={`w-6 h-6 ${category.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Explorar categorías */}
      <div className="w-full px-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-900">Explorar categorías</h2>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {exploreCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`${category.color} rounded-xl p-3 text-white text-left hover:opacity-90 transition-opacity hover:scale-105 transform`}
            >
              <category.icon className="w-6 h-6 mb-2" />
              <div className="text-sm font-semibold">{category.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bancos populares */}
      <div className="w-full px-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-900">Bancos populares</h2>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todos <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {popularBanks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => handleBankClick(bank.id)}
              className="flex-shrink-0 bg-gray-100 rounded-xl p-3 min-w-[70px] hover:bg-gray-200 transition-colors"
            >
              <div className="text-xl mb-2">{bank.logo}</div>
              <div className="text-xs font-medium text-gray-700 text-center leading-tight">{bank.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hecho para ti */}
      <div className="w-full px-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Hecho para ti</h2>
            <p className="text-xs text-gray-600">Basado en tus preferencias</p>
          </div>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todo <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {personalizedOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className={`${offer.color} p-3 text-white relative`}>
                  <div className="absolute top-2 left-2 bg-white/20 rounded-full px-2 py-1 text-xs font-bold">
                    {offer.discount}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{offer.discount}</div>
                    <div className="text-xs opacity-90">{offer.category}</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">{offer.title}</div>
                  <div className="text-xs text-gray-600">{offer.subtitle}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tendencias */}
      <div className="w-full px-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">Tendencias</h2>
          </div>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
            Populares
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {trendingOffers.map((offer) => (
            <Card key={offer.id} className="flex-shrink-0 w-48 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {offer.discount}
                  </div>
                  <button className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors">
                    <Heart className="w-3 h-3 text-gray-600" />
                  </button>
                  <div className="w-full h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <div className="text-gray-400 text-lg">📷</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {offer.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600">{offer.rating}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 leading-tight">{offer.title}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Promos/Descuentos */}
      <div className="w-full px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-900">Promociones destacadas</h2>
          <button className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700">
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {loading ? (
            <div className="w-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando descuentos...</p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="w-full text-center py-8">
              <p className="text-gray-600">No hay descuentos disponibles</p>
              <p className="text-sm text-gray-500 mt-2">
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

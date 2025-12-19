import { Card, CardContent } from "@/components/Share/card";
import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { useCachedDiscounts } from "@/hooks/useCachedDiscounts";
import type { UserCredential } from "@/types/credentials";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo } from "react";

interface HomePageDiscount {
  id: string;
  title: string;
  name?: string;
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
  membershipRequired?: string[];
  bancos?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface PersonalizedOffersSectionProps {
  onOfferClick: (offerId: string, url?: string) => void;
  userMemberships?: string[];
  userCredentials?: UserCredential[];
  membershipsLoading?: boolean;
}

export function PersonalizedOffersSection({
  onOfferClick,
  userMemberships,
}: PersonalizedOffersSectionProps) {
  const router = useRouter();
  const { discounts: allDiscounts, loading: discountsLoading } =
    useCachedDiscounts();

  // Convertir descuentos a formato Discount para el hook
  const availableDiscounts = useMemo(() => {
    return allDiscounts.map((d) => {
      const discountWithExtras = d as HomePageDiscount & {
        membershipRequired?: string[];
        bancos?: string[];
      };
      return {
        id: d.id,
        name: d.title || "Descuento",
        title: d.title,
        category: d.category,
        discountPercentage:
          typeof d.discountPercentage === "string"
            ? parseInt(d.discountPercentage) || 0
            : d.discountPercentage || 0,
        membershipRequired: discountWithExtras.membershipRequired,
        bancos: discountWithExtras.bancos,
        description: d.description,
        imageUrl: d.image,
        location: d.location,
      };
    });
  }, [allDiscounts]);

  // Usar el hook con caché y generación automática
  const { recommendation, loading: aiLoading } = useAIRecommendations({
    autoGenerate: true,
    availableDiscounts,
    userMemberships: userMemberships || [],
  });

  // Mapear recomendaciones a formato HomePageDiscount
  const personalizedOffers = useMemo(() => {
    if (!recommendation?.fullDiscounts) {
      return [];
    }

    return recommendation.fullDiscounts
      .map((discount) => {
        // Buscar el descuento completo en allDiscounts para obtener todos los campos
        const fullDiscount = allDiscounts.find((d) => d.id === discount.id);
        if (!fullDiscount) return null;

        return fullDiscount;
      })
      .filter((d): d is HomePageDiscount => d !== null)
      .slice(0, 5);
  }, [recommendation, allDiscounts]);

  const loading = discountsLoading || aiLoading;
  const isAIRecommendation = !!recommendation;

  // Determinar subtítulo basado en el tipo de recomendación
  const getSubtitle = () => {
    if (isAIRecommendation) {
      return "Recomendado por IA";
    }
    return "Basado en tus preferencias";
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-5 lg:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <div className="flex items-center gap-2">
          {personalizedOffers.length > 0 && (
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
          )}
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
              Hecho para ti
            </h2>
            <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600">
              {getSubtitle()}
            </p>
          </div>
        </div>
        {personalizedOffers.length > 0 && (
          <button
            onClick={() => router.push("/search?personalized=true")}
            className="flex items-center gap-1 text-purple-600 text-xs lg:text-sm font-medium hover:text-purple-700 transition-colors"
          >
            Ver todas <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-200 animate-pulse h-20 lg:h-24"></div>
                <div className="p-2.5 sm:p-3 lg:p-4 space-y-2">
                  <div className="h-4 lg:h-5 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 lg:h-4 bg-gray-200 animate-pulse rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : personalizedOffers.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
            <div className="text-gray-500 mb-2">
              <svg
                className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-1 lg:mb-2">
              Pronto verás recomendaciones personalizadas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {personalizedOffers.map((offer) => (
            <CardDiscountCompact
              key={offer.id}
              id={offer.id}
              title={offer.title}
              image={offer.image}
              category={offer.category}
              points={offer.points}
              distance={offer.distance}
              expiration={offer.expiration}
              discountPercentage={offer.discountPercentage}
              discountLocation={
                offer.location
                  ? {
                      latitude: offer.location.latitude,
                      longitude: offer.location.longitude,
                    }
                  : undefined
              }
              onNavigateToDetail={(distance) => {
                const url =
                  distance &&
                  distance !== "Sin ubicación" &&
                  distance !== "Calculando..."
                    ? `/discount/${offer.id}?distance=${encodeURIComponent(
                        distance
                      )}`
                    : `/discount/${offer.id}`;
                onOfferClick(offer.id, url);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

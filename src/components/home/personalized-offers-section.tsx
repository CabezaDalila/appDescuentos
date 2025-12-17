import { Card, CardContent } from "@/components/Share/card";
import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { useAuth } from "@/hooks/useAuth";
import { useCachedDiscounts } from "@/hooks/useCachedDiscounts";
import { getOnboardingAnswers } from "@/lib/firebase/onboarding";
import { getSmartRecommendations } from "@/lib/services/ai-recommendations.service";
import type { UserCredential } from "@/types/credentials";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const { user } = useAuth();
  const { discounts: allDiscounts, loading: discountsLoading } =
    useCachedDiscounts();

  const [personalizedOffers, setPersonalizedOffers] = useState<
    HomePageDiscount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAIRecommendation, setIsAIRecommendation] = useState(false);

  const aiGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  const generateAIRecommendations = useCallback(
    async (
      onboarding: {
        spendingCategories: string[];
        mainGoal: string;
        banks?: string[];
        transportType?: string;
      },
      discounts: HomePageDiscount[]
    ) => {
      if (aiGeneratedRef.current || isGeneratingRef.current) {
        return;
      }

      isGeneratingRef.current = true;

      try {
        let relevantDiscounts = discounts.filter((d) =>
          onboarding.spendingCategories.includes(d.category || "")
        );

        // Si no hay suficientes, usar todos
        if (relevantDiscounts.length < 3) {
          relevantDiscounts = discounts.slice(0, 10);
        }

        // Si no hay descuentos disponibles, mostrar fallback
        if (relevantDiscounts.length === 0) {
          setPersonalizedOffers([]);
          setLoading(false);
          return;
        }

        // Preparar request para Gemini
        // Combinar bancos del onboarding + membresías del perfil
        const banksFromOnboarding = onboarding.banks || [];
        const banksFromMemberships = userMemberships || [];

        // Unir ambas listas y eliminar duplicados
        const allUserBanks = [
          ...new Set([...banksFromOnboarding, ...banksFromMemberships]),
        ];

        const request = {
          userId: user!.uid,
          userPreferences: {
            interests: onboarding.spendingCategories,
            vehicleType: onboarding.transportType,
          },
          userBanks: allUserBanks,
          availableDiscounts: relevantDiscounts.slice(0, 10).map((d) => ({
            id: d.id,
            name: d.title || d.name || "Descuento",
            title: d.title,
            category: d.category,
            discountPercentage:
              typeof d.discountPercentage === "string"
                ? parseInt(d.discountPercentage) || 0
                : d.discountPercentage || 0,
            membershipRequired: d.membershipRequired,
            bancos: d.bancos,
            description: d.description,
          })),
        };

        const aiResult = await getSmartRecommendations(request);

        // Mapear recomendaciones de IA a descuentos
        const aiOffers: HomePageDiscount[] = [];

        for (const rec of aiResult.recommendedDiscounts.slice(0, 5)) {
          const discount = discounts.find((d) => d.id === rec.discountId);
          if (discount) {
            aiOffers.push(discount);
          }
        }

        if (aiOffers.length > 0) {
          setPersonalizedOffers(aiOffers);
          setIsAIRecommendation(true);
          aiGeneratedRef.current = true;
        } else {
          setPersonalizedOffers([]);
          setIsAIRecommendation(false);
        }
      } catch (error) {
        console.error("Error generando recomendaciones:", error);
        setPersonalizedOffers([]);
        setIsAIRecommendation(false);
      } finally {
        setLoading(false);
        isGeneratingRef.current = false;
      }
    },
    [user, userMemberships]
  );

  useEffect(() => {
    let isMounted = true;
    aiGeneratedRef.current = false;

    const loadOffers = async () => {
      if (!user?.uid || !isMounted) {
        setLoading(false);
        return;
      }

      // Esperar a que los descuentos estén cargados
      if (discountsLoading) {
        return;
      }

      try {
        const onboarding = await getOnboardingAnswers(user.uid);

        if (onboarding && onboarding.spendingCategories?.length > 0) {
          // Tiene onboarding completado y hay descuentos - usar IA
          if (allDiscounts.length > 0 && isMounted) {
            await generateAIRecommendations(
              onboarding,
              allDiscounts as HomePageDiscount[]
            );
          } else {
            if (isMounted) {
              setPersonalizedOffers([]);
              setLoading(false);
            }
          }
        } else {
          if (isMounted) {
            setPersonalizedOffers([]);
            setIsAIRecommendation(false);
            setLoading(false);
          }
        }
      } catch {
        if (isMounted) {
          setPersonalizedOffers([]);
          setLoading(false);
        }
      }
    };

    loadOffers();

    return () => {
      isMounted = false;
    };
  }, [
    user?.uid,
    userMemberships,
    allDiscounts,
    discountsLoading,
    generateAIRecommendations,
  ]);

  // Reset cuando cambia el usuario o las membresías
  useEffect(() => {
    aiGeneratedRef.current = false;
  }, [user?.uid, userMemberships]);

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

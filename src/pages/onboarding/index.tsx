import { IntroStep } from "@/components/onboarding/intro-step";
import { OptionCard } from "@/components/onboarding/option-card";
import { ProgressHeader } from "@/components/onboarding/progress-header";
import { StepNavigation } from "@/components/onboarding/step-navigation";
import {
    BANK_OPTIONS,
    MAIN_GOALS,
    SPENDING_CATEGORIES,
    TRANSPORT_TYPES,
} from "@/constants/onboarding";
import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { useCachedDiscounts } from "@/hooks/useCachedDiscounts";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
    OnboardingAnswers,
    saveOnboardingAnswers,
} from "@/lib/firebase/onboarding";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

const ONBOARDING_TOTAL_STEPS = 5;

type Step = 0 | 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [step, setStep] = useState<Step>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const { generateRecommendation } = useAIRecommendations();
  const { discounts } = useCachedDiscounts();

  const totalSteps = ONBOARDING_TOTAL_STEPS;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Cargar datos guardados del onboarding si existen
  useEffect(() => {
    if (profileLoading) return;

    // Si el onboarding está completado, redirigir a home
    if (profile?.onboarding?.completed) {
      router.replace("/home");
      return;
    }

    // Cargar datos guardados (puede haber datos en onboarding.interests o onboarding.answers.interests)
    if (profile?.onboarding) {
      const onboardingData = profile.onboarding as OnboardingAnswers & {
        interests?: string[]; // Backward compatibility
        goals?: string[]; // Backward compatibility
        vehicleType?: string; // Backward compatibility
      };

      // Migración de datos antiguos a nuevos campos
      const categories =
        onboardingData.spendingCategories ??
        onboardingData.interests ?? // Backward compatibility
        [];
      const goal =
        onboardingData.mainGoal ??
        (onboardingData.goals && onboardingData.goals[0]) ?? // Tomar el primero si existe
        "";
      const banks = onboardingData.banks ?? [];
      const transport =
        onboardingData.transportType ??
        onboardingData.vehicleType ?? // Backward compatibility
        null;

      // Solo actualizar si hay datos válidos
      if (Array.isArray(categories) && categories.length > 0) {
        setSelectedCategories(categories);
      }
      if (goal && typeof goal === "string") {
        setSelectedGoal(goal);
      }
      if (Array.isArray(banks) && banks.length > 0) {
        setSelectedBanks(banks);
      }
      if (transport) {
        setSelectedTransport(transport);
      }
    }
  }, [profileLoading, profile, router]);

  // Memoizar las funciones toggle para evitar re-renders innecesarios
  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectGoal = useCallback((id: string) => {
    setSelectedGoal(id);
  }, []);

  const toggleBank = useCallback((bank: string) => {
    setSelectedBanks((prev) =>
      prev.includes(bank)
        ? prev.filter((item) => item !== bank)
        : [...prev, bank]
    );
  }, []);

  const handleFinish = useCallback(async () => {
    if (!user?.uid) {
      router.replace("/login");
      return;
    }

    const answers: OnboardingAnswers = {
      spendingCategories: selectedCategories,
      mainGoal: selectedGoal,
      banks: selectedBanks,
      transportType: selectedTransport || undefined,
      allowLocationTracking: false,
    };

    try {
      setIsSaving(true);

      // 1. Guardar respuestas del onboarding
      await saveOnboardingAnswers(user.uid, answers);

      // 2. Generar primera recomendación en segundo plano
      try {
        // Filtrar descuentos relevantes según las categorías del usuario
        let relevantDiscounts = discounts.filter((d) =>
          selectedCategories.includes(d.category || "")
        );

        // Si no hay descuentos de esas categorías, usar todos
        if (relevantDiscounts.length === 0) {
          relevantDiscounts = discounts;
        }

        // Limitar a 10 descuentos para no sobrecargar Gemini
        const selectedDiscounts = relevantDiscounts.slice(0, 10);

        if (selectedDiscounts.length > 0) {
          const discountsForRequest = selectedDiscounts.map((d) => ({
            id: d.id,
            name: d.title || "Descuento",
            title: d.title,
            category: d.category,
            discountPercentage:
              typeof d.discountPercentage === "string"
                ? parseInt(d.discountPercentage) || 0
                : d.discountPercentage || 0,
            description: d.description,
            imageUrl: d.image,
            location: d.location,
            status: d.status,
            origin: d.origin,
          }));

          const request = {
            userId: user.uid,
            userPreferences: {
              interests: selectedCategories,
              vehicleType: selectedTransport || undefined,
            },
            userBanks: selectedBanks,
            availableDiscounts: discountsForRequest,
          };

          generateRecommendation(request)
            .then((result) => {})
            .catch((err) => {});
        } else {
        }
      } catch (recError) {
        // Error en recomendación no debe bloquear el flujo
      }

      router.push("/home");
    } catch (error) {
      console.error("Error guardando onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    user?.uid,
    selectedCategories,
    selectedGoal,
    selectedBanks,
    selectedTransport,
    router,
    discounts,
    generateRecommendation,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextStep = useCallback(async () => {
    if (step === 4) {
      await handleFinish();
      return;
    }

    setStep((prev) => Math.min(prev + 1, 4) as Step);
  }, [step, handleFinish]);

  const handlePreviousStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0) as Step);
  }, []);

  // Memoizar valores calculados para evitar recálculos innecesarios
  const primaryButtonLabel = useMemo(
    () => (step === 4 ? "Finalizar" : "Continuar"),
    [step]
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return selectedCategories.length > 0;
      case 2:
        return selectedGoal !== "";
      case 3:
        return selectedBanks.length > 0;
      case 4:
        // Permitir continuar sin vehículo (opcional)
        return true;
      default:
        return false;
    }
  }, [step, selectedCategories.length, selectedGoal, selectedBanks.length]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500" />
          <p className="text-sm text-gray-600">Preparando tu experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-white via-white to-slate-50 overflow-hidden">
      <div className="mx-auto flex h-screen w-full max-w-2xl flex-col px-4 py-4">
        <ProgressHeader
          currentStep={step}
          totalSteps={totalSteps}
          className="mb-4"
        />

        <div className="flex flex-1 flex-col min-h-0">
          {step === 0 && (
            <IntroStep
              title="¡Bienvenido a tu app de ofertas!"
              description="Vamos a conocerte mejor para recomendarte las mejores ofertas personalizadas."
              highlight={
                <>
                  Solo te tomará{" "}
                  <span className="font-semibold text-purple-500">
                    unos minutos
                  </span>{" "}
                  completar este cuestionario y podrás disfrutar de ofertas
                  hechas especialmente para ti.
                </>
              }
            />
          )}

          {step === 1 && (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¿En qué gastás más cada mes?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Seleccioná las categorías donde más dinero invertís (máximo 5)
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 auto-rows-fr">
                  {SPENDING_CATEGORIES.map((option) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={selectedCategories.includes(option.id)}
                      onToggle={toggleCategory}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¿Cuál es tu objetivo principal?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Seleccioná tu objetivo principal con los descuentos
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex flex-col gap-3">
                  {MAIN_GOALS.map((option) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={selectedGoal === option.id}
                      onToggle={selectGoal}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¿Qué bancos usas más?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Selecciona todas las opciones que quieras
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {BANK_OPTIONS.map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => toggleBank(bank)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedBanks.includes(bank)
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div
                          className={`text-lg font-semibold ${
                            selectedBanks.includes(bank)
                              ? "text-purple-700"
                              : "text-gray-700"
                          }`}
                        >
                          {bank}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¿Cómo te movés habitualmente?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Esto nos ayuda a recomendarte descuentos en combustible y
                  transporte
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {TRANSPORT_TYPES.map((transport) => (
                      <button
                        key={transport.id}
                        type="button"
                        onClick={() => setSelectedTransport(transport.id)}
                        className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          selectedTransport === transport.id
                            ? "border-purple-500 bg-purple-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <transport.icon
                          className={`h-6 w-6 ${
                            selectedTransport === transport.id
                              ? "text-purple-600"
                              : "text-gray-600"
                          }`}
                        />
                        <span
                          className={`text-lg font-semibold ${
                            selectedTransport === transport.id
                              ? "text-purple-700"
                              : "text-gray-700"
                          }`}
                        >
                          {transport.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <StepNavigation
          canContinue={canContinue}
          isSaving={isSaving}
          showBackButton={step > 0}
          onBack={handlePreviousStep}
          onNext={handleNextStep}
          nextLabel={primaryButtonLabel}
        />
      </div>
    </div>
  );
}

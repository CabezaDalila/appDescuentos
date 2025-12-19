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
import { useLocation } from "@/hooks/useLocation";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  OnboardingAnswers,
  saveOnboardingAnswers,
} from "@/lib/firebase/onboarding";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const ONBOARDING_TOTAL_STEPS = 6;

type Step = 0 | 1 | 2 | 3 | 4 | 5;

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
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { requestPermissions, checkPermissions } = useLocation();
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

  const handleRequestLocation = useCallback(async () => {
    const granted = await requestPermissions();
    if (granted) {
      setLocationPermissionGranted(true);
      toast.success(
        "¡Perfecto! Ahora podremos darte recomendaciones personalizadas"
      );
    } else {
      toast.error(
        "Necesitamos acceso a tu ubicación para darte mejores recomendaciones"
      );
    }
  }, [requestPermissions]);

  // Verificar permisos al cargar
  useEffect(() => {
    checkPermissions().then(setLocationPermissionGranted);
  }, [checkPermissions]);

  const handleFinish = useCallback(async () => {
    if (!user?.uid) {
      toast.error(
        "No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente."
      );
      return;
    }

    // Validar que haya al menos una selección    // Validaciones por paso
    if (step === 1 && selectedCategories.length === 0) {
      toast.error("Seleccioná al menos una categoría de gasto");
      return;
    }
    if (step === 1 && selectedCategories.length > 5) {
      toast.error("Podés seleccionar hasta 5 categorías");
      return;
    }
    if (step === 2 && !selectedGoal) {
      toast.error("Seleccioná tu objetivo principal");
      return;
    }
    if (step === 3 && selectedBanks.length === 0) {
      toast.error("Por favor, selecciona al menos un banco");
      return;
    }

    const answers: OnboardingAnswers = {
      spendingCategories: selectedCategories,
      mainGoal: selectedGoal,
      banks: selectedBanks,
      transportType: selectedTransport || undefined,
      allowLocationTracking: locationPermissionGranted,
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

      toast.success("¡Gracias! Personalizaremos tus ofertas desde ahora.");
      router.push("/home");
    } catch (error) {
      console.error("Error guardando onboarding:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No pudimos guardar tus preferencias. Intenta nuevamente.";
      toast.error(errorMessage);
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
  ]);

  const handleNextStep = useCallback(async () => {
    if (step === 5) {
      await handleFinish();
      return;
    }

    setStep((prev) => Math.min(prev + 1, 5) as Step);
  }, [step, handleFinish]);

  const handlePreviousStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0) as Step);
  }, []);

  // Memoizar valores calculados para evitar recálculos innecesarios
  const primaryButtonLabel = useMemo(
    () => (step === 5 ? "Finalizar" : "Continuar"),
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
      case 5:
        // Permitir continuar sin permisos (opcional)
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

          {step === 5 && (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  📍 Activá recomendaciones inteligentes
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Permitinos acceder a tu ubicación para darte las mejores
                  recomendaciones
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="space-y-6">
                  {/* Beneficios */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">
                      ✨ Con tu ubicación podemos:
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-purple-500 rounded-full">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">
                            Detectar tus rutas habituales
                          </p>
                          <p className="text-sm text-purple-700">
                            Identificamos dónde vas frecuentemente
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-purple-500 rounded-full">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">
                            Recomendarte descuentos en el momento justo
                          </p>
                          <p className="text-sm text-purple-700">
                            Te avisamos cuando estés cerca de una oferta
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-purple-500 rounded-full">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">
                            Calcular tu ahorro potencial
                          </p>
                          <p className="text-sm text-purple-700">
                            Estimamos cuánto podés ahorrar por mes
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Estado de permisos */}
                  {locationPermissionGranted ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                        <svg
                          className="h-8 w-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        ¡Permisos otorgados!
                      </h3>
                      <p className="text-sm text-green-700">
                        Ya podés recibir recomendaciones personalizadas
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestLocation}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>Permitir Acceso a Ubicación</span>
                      </div>
                    </button>
                  )}

                  {/* Privacidad */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-600 text-center">
                      🔒 Tu privacidad es importante. Podés desactivar el
                      tracking en cualquier momento desde tu perfil. No
                      compartimos tu ubicación con terceros.
                    </p>
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

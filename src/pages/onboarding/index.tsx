import { IntroStep } from "@/components/onboarding/intro-step";
import { OptionCard } from "@/components/onboarding/option-card";
import { ProgressHeader } from "@/components/onboarding/progress-header";
import { StepNavigation } from "@/components/onboarding/step-navigation";
import {
  BANK_OPTIONS,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
} from "@/constants/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  OnboardingAnswers,
  saveOnboardingAnswers,
} from "@/lib/firebase/onboarding";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [step, setStep] = useState<Step>(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
      const onboardingData = profile.onboarding;
      
      // Priorizar datos directos, luego datos en answers (para migración)
      const interests =
        onboardingData.interests ??
        onboardingData.answers?.interests ??
        [];
      const goals =
        onboardingData.goals ?? onboardingData.answers?.goals ?? [];
      const banks =
        onboardingData.banks ?? onboardingData.answers?.banks ?? [];

      // Solo actualizar si hay datos válidos
      if (Array.isArray(interests) && interests.length > 0) {
        setSelectedInterests(interests);
      }
      if (Array.isArray(goals) && goals.length > 0) {
        setSelectedGoals(goals);
      }
      if (Array.isArray(banks) && banks.length > 0) {
        setSelectedBanks(banks);
      }
    }
  }, [profileLoading, profile, router]);

  // Memoizar las funciones toggle para evitar re-renders innecesarios
  const toggleInterest = useCallback((id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleGoal = useCallback((id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
      toast.error("No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.");
      return;
    }

    // Validar que haya al menos una selección en cada paso requerido
    if (selectedInterests.length === 0) {
      toast.error("Por favor, selecciona al menos un interés");
      return;
    }
    if (selectedGoals.length === 0) {
      toast.error("Por favor, selecciona al menos un objetivo");
      return;
    }
    if (selectedBanks.length === 0) {
      toast.error("Por favor, selecciona al menos un banco");
      return;
    }

    const answers: OnboardingAnswers = {
      interests: selectedInterests,
      goals: selectedGoals,
      banks: selectedBanks,
    };

    try {
      setIsSaving(true);
      await saveOnboardingAnswers(user.uid, answers);
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
  }, [user?.uid, selectedInterests, selectedGoals, selectedBanks, router]);

  const handleNextStep = useCallback(async () => {
    if (step === 3) {
      await handleFinish();
      return;
    }

    setStep((prev) => Math.min(prev + 1, 3) as Step);
  }, [step, handleFinish]);

  const handlePreviousStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0) as Step);
  }, []);

  // Memoizar valores calculados para evitar recálculos innecesarios
  const primaryButtonLabel = useMemo(
    () => (step === 3 ? "Finalizar" : "Continuar"),
    [step]
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return selectedInterests.length > 0;
      case 2:
        return selectedGoals.length > 0;
      case 3:
        return selectedBanks.length > 0;
      default:
        return false;
    }
  }, [step, selectedInterests.length, selectedGoals.length, selectedBanks.length]);

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
                  ¿Qué tipo de productos te interesan más?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Selecciona todas las opciones que quieras
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {INTEREST_OPTIONS.map((option) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={selectedInterests.includes(option.id)}
                      onToggle={toggleInterest}
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
                  ¿Qué te gustaría aprovechar más con los descuentos?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Selecciona todas las opciones que quieras
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex flex-col gap-3">
                  {GOAL_OPTIONS.map((option) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={selectedGoals.includes(option.id)}
                      onToggle={toggleGoal}
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

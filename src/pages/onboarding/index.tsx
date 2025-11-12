import { IntroStep } from "@/components/onboarding/intro-step";
import { OptionCard } from "@/components/onboarding/option-card";
import { ProgressHeader } from "@/components/onboarding/progress-header";
import { StepNavigation } from "@/components/onboarding/step-navigation";
import {
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
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [step, setStep] = useState<Step>(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = ONBOARDING_TOTAL_STEPS;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!profileLoading && profile?.onboarding?.completed) {
      router.replace("/home");
    }

    if (!profileLoading && profile?.onboarding) {
      const interests = profile.onboarding.interests ?? [];
      const goals = profile.onboarding.goals ?? [];

      if (interests.length > 0) {
        setSelectedInterests(interests);
      }

      if (goals.length > 0) {
        setSelectedGoals(goals);
      }
    }
  }, [profileLoading, profile, router]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = async () => {
    if (step === 2) {
      await handleFinish();
      return;
    }

    setStep((prev) => Math.min(prev + 1, 2) as Step);
  };

  const handlePreviousStep = () => {
    setStep((prev) => Math.max(prev - 1, 0) as Step);
  };

  const handleFinish = async () => {
    if (!user?.uid) return;

    const answers: OnboardingAnswers = {
      interests: selectedInterests,
      goals: selectedGoals,
    };

    try {
      setIsSaving(true);
      await saveOnboardingAnswers(user.uid, answers);
      toast.success("¡Gracias! Personalizaremos tus ofertas desde ahora.");
      router.push("/home");
    } catch (error) {
      console.error("Error guardando onboarding:", error);
      toast.error("No pudimos guardar tus preferencias. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const primaryButtonLabel = step === 2 ? "Finalizar" : "Continuar";
  const canContinue =
    step === 0 ||
    (step === 1 && selectedInterests.length > 0) ||
    (step === 2 && selectedGoals.length > 0);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="text-sm text-gray-600">Preparando tu experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-10 pt-8">
        <ProgressHeader
          currentStep={step}
          totalSteps={totalSteps}
          className="mb-8"
        />

        <div className="flex flex-1 flex-col">
          {step === 0 && (
            <IntroStep
              title="¡Bienvenido a tu app de ofertas!"
              description="Vamos a conocerte mejor para recomendarte las mejores ofertas personalizadas."
              highlight={
                <>
                  Solo te tomará{" "}
                  <span className="font-semibold text-orange-500">
                    2 minutos
                  </span>{" "}
                  completar este cuestionario y podrás disfrutar de ofertas
                  hechas especialmente para ti.
                </>
              }
            />
          )}

          {step === 1 && (
            <div className="flex flex-1 flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¿Qué tipo de productos te interesan más?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Selecciona todas las opciones que quieras
                </p>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
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
          )}

          {step === 2 && (
            <div className="flex flex-1 flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¿Qué te gustaría aprovechar más con los descuentos?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Selecciona todas las opciones que quieras
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3">
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

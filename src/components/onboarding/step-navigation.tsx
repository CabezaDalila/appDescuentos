import { Button } from "@/components/Share/button";
import { cn } from "@/utils/css";

interface StepNavigationProps {
  canContinue: boolean;
  isSaving: boolean;
  showBackButton: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}

export function StepNavigation({
  canContinue,
  isSaving,
  showBackButton,
  onBack,
  onNext,
  nextLabel,
}: StepNavigationProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {showBackButton ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
          disabled={isSaving}
        >
          Atrás
        </Button>
      ) : (
        <div className="flex-1" />
      )}

      <Button
        type="button"
        onClick={onNext}
        disabled={!canContinue || isSaving}
        className={cn(
          "h-12 flex-[2] rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-base font-semibold text-white shadow-lg transition-all hover:from-orange-600 hover:to-pink-600",
          (!canContinue || isSaving) &&
            "cursor-not-allowed opacity-70 hover:from-orange-500 hover:to-pink-500"
        )}
      >
        {isSaving ? "Guardando..." : nextLabel}
      </Button>
    </div>
  );
}


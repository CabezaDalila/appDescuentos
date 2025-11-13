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
    <div className="mt-4 flex items-center justify-between gap-4 flex-shrink-0">
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
          "h-12 flex-[2] rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-base font-semibold text-white shadow-lg transition-all hover:from-purple-600 hover:to-purple-700",
          (!canContinue || isSaving) &&
            "cursor-not-allowed opacity-70 hover:from-purple-500 hover:to-purple-600"
        )}
      >
        {isSaving ? "Guardando..." : nextLabel}
      </Button>
    </div>
  );
}


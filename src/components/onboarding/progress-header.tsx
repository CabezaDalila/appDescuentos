import { cn } from "@/utils/css";

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  className,
}: ProgressHeaderProps) {
  const percent = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm font-medium text-gray-600">
        <span>{`Paso ${currentStep + 1} de ${totalSteps}`}</span>
        <span>{`${percent}%`}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}


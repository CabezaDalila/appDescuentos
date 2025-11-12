"use client";

import type { OnboardingOption } from "@/constants/onboarding";
import { cn } from "@/utils/css";
import { CheckCircle2 } from "lucide-react";

interface OptionCardProps {
  option: OnboardingOption;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function OptionCard({ option, selected, onToggle }: OptionCardProps) {
  const Icon = option.icon;

  if (!Icon) {
    console.warn("Icono no definido para la opción de onboarding", option);
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(option.id)}
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-left transition-all duration-200",
        "bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300",
        selected
          ? "border-orange-400 bg-orange-50 shadow-md"
          : "border-transparent hover:border-orange-200"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl text-white",
              "bg-gradient-to-br",
              option.color
            )}
          >
            {Icon ? <Icon className="h-6 w-6" /> : null}
          </div>
          <span className="text-base font-semibold text-gray-900">
            {option.label}
          </span>
        </div>
        {selected && <CheckCircle2 className="h-6 w-6 text-orange-500" />}
      </div>
    </button>
  );
}

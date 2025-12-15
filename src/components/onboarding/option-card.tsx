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
        "w-full rounded-xl border-2 p-3 text-left transition-all duration-200",
        "bg-white shadow-sm hover:shadow-md focus:outline-none",
        selected
          ? "border-purple-400 bg-purple-50 shadow-md"
          : "border-gray-200 hover:border-purple-200"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-white",
              "bg-gradient-to-br",
              option.color
            )}
          >
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {option.label}
          </span>
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 text-purple-500" />}
      </div>
    </button>
  );
}

import {
  Clapperboard,
  Gift,
  HeartPulse,
  Laptop,
  Pizza,
  Plane,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { EXPLORE_CATEGORIES } from "./categories";

export interface OnboardingOption {
  id: string;
  label: string;
  color: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Mapear categorías de la app a opciones de onboarding
export const INTEREST_OPTIONS: OnboardingOption[] = EXPLORE_CATEGORIES.map(
  (category) => {
    // Convertir los colores de Tailwind para que funcionen con gradientes
    const colorMapping: Record<string, string> = {
      "bg-gradient-to-br from-green-400 to-green-600":
        "from-green-500 to-emerald-500",
      "bg-gradient-to-br from-pink-400 to-pink-600":
        "from-pink-500 to-rose-500",
      "bg-gradient-to-br from-blue-400 to-blue-600":
        "from-blue-500 to-indigo-500",
      "bg-gradient-to-br from-orange-400 to-orange-600":
        "from-orange-400 to-amber-500",
      "bg-gradient-to-br from-purple-400 to-purple-600":
        "from-purple-500 to-fuchsia-500",
      "bg-gradient-to-br from-red-400 to-red-600": "from-red-500 to-rose-500",
      "bg-gradient-to-br from-gray-400 to-gray-600":
        "from-gray-500 to-gray-700",
      "bg-gradient-to-br from-yellow-400 to-yellow-600":
        "from-yellow-400 to-orange-500",
      "bg-gradient-to-br from-teal-400 to-teal-600":
        "from-emerald-500 to-teal-500",
      "bg-gradient-to-br from-indigo-400 to-indigo-600":
        "from-indigo-500 to-purple-500",
    };

    return {
      id: category.id,
      label: category.label,
      color: colorMapping[category.color] || "from-gray-500 to-gray-700",
      icon: category.icon,
    };
  }
);

export const GOAL_OPTIONS: OnboardingOption[] = [
  {
    id: "comer",
    label: "Comer afuera o pedir delivery",
    color: "from-orange-500 to-red-500",
    icon: Pizza,
  },
  {
    id: "compras",
    label: "Compras online",
    color: "from-blue-500 to-indigo-500",
    icon: Laptop,
  },
  {
    id: "cine",
    label: "Ir al cine o espectáculos",
    color: "from-pink-500 to-rose-500",
    icon: Clapperboard,
  },
  {
    id: "regalar",
    label: "Regalar a otras personas",
    color: "from-purple-500 to-fuchsia-500",
    icon: Gift,
  },
  {
    id: "cuidar-salud",
    label: "Cuidar mi salud y bienestar",
    color: "from-green-500 to-emerald-500",
    icon: HeartPulse,
  },
  {
    id: "viajar",
    label: "Viajar",
    color: "from-sky-500 to-cyan-500",
    icon: Plane,
  },
];

export const ONBOARDING_TOTAL_STEPS = 3;

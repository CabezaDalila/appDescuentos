import { cn } from "@/utils/css";
import { Sparkles } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

interface IntroStepProps {
  title: string;
  description: string;
  highlight: ReactNode;
  className?: string;
}

export function IntroStep({
  title,
  description,
  highlight,
  className,
}: PropsWithChildren<IntroStepProps>) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center text-center space-y-6",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg">
        <Sparkles className="h-10 w-10" />
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mx-auto max-w-md text-base text-gray-600">
          {description}
        </p>
      </div>
      <div className="rounded-2xl border border-orange-100 bg-orange-50 px-6 py-4 text-sm text-gray-700">
        {highlight}
      </div>
    </div>
  );
}


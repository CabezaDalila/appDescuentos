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
        "flex flex-1 flex-col items-center justify-center text-center space-y-4",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
        <Sparkles className="h-8 w-8" />
      </div>
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mx-auto max-w-md text-sm text-gray-600">
          {description}
        </p>
      </div>
      <div className="rounded-2xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm text-gray-700">
        {highlight}
      </div>
    </div>
  );
}


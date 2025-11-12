import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="border-b border-gray-200 flex-shrink-0 safe-area-pt">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors -ml-1"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>

          <div className="flex-1 ml-2">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {rightAction ? (
            <div className="flex items-center gap-2">{rightAction}</div>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>
    </div>
  );
};

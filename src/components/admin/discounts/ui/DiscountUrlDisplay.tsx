import { Button } from "@/components/Share/button";
import { getDiscountUrl } from "@/utils/url";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface DiscountUrlDisplayProps {
  discountId: string;
  className?: string;
}

export function DiscountUrlDisplay({
  discountId,
  className = "",
}: DiscountUrlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const discountUrl = getDiscountUrl(discountId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(discountUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar URL:", err);
    }
  };

  const handleOpen = () => {
    window.open(discountUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Campo de URL */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={discountUrl}
          readOnly
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>

      {/* Botón de copiar */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="px-3 py-2 h-10 border-gray-300 hover:bg-gray-50"
        title={copied ? "¡Copiado!" : "Copiar URL"}
      >
        <Copy className="h-4 w-4" />
        {copied && (
          <span className="ml-1 text-xs text-green-600">¡Copiado!</span>
        )}
      </Button>

      {/* Botón de abrir */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="px-3 py-2 h-10 border-gray-300 hover:bg-gray-50"
        title="Abrir en nueva pestaña"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}

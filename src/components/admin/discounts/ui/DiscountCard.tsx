import { Badge } from "@/components/Share/badge";
import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Switch } from "@/components/Share/switch";
import { ManualDiscount } from "@/types/admin";
import {
  Calendar,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Gift,
  Store,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { DiscountUrlDisplay } from "./DiscountUrlDisplay";

interface DiscountCardProps {
  discount: ManualDiscount;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (discount: ManualDiscount) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, currentVisibility: boolean) => void;
  deleting: boolean;
}

export function DiscountCard({
  discount,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisibility,
  deleting,
}: DiscountCardProps) {
  const getExpirationStatus = (expirationDate: Date) => {
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        status: "expired",
        label: "Expirado",
        variant: "destructive" as const,
      };
    if (diffDays <= 7)
      return {
        status: "expiring",
        label: "Expira pronto",
        variant: "secondary" as const,
      };
    return { status: "active", label: "Activo", variant: "default" as const };
  };

  const expirationStatus = getExpirationStatus(discount.expirationDate);

  return (
    <Card className={isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(discount.id!)}
              className="rounded border-gray-300"
            />
            <Gift className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base truncate">
                  {discount.title}
                </CardTitle>
                <Badge variant={expirationStatus.variant} className="text-xs">
                  {expirationStatus.label}
                </Badge>
                <Badge
                  variant={discount.isVisible ? "default" : "secondary"}
                  className="flex items-center gap-1 text-xs"
                >
                  {discount.isVisible ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Oculto
                    </>
                  )}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {discount.origin}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {discount.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {discount.expirationDate.toLocaleDateString()}
                </span>
              </CardDescription>
            </div>
          </div>
          {/* Botones de acción */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(discount)}
              disabled={deleting}
              className="h-8 w-8 p-0 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(discount.id!)}
              disabled={deleting}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Información compacta en una sola línea */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <div className="flex items-center gap-3">
            {discount.description && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {discount.description.length > 30
                  ? `${discount.description.substring(0, 30)}...`
                  : discount.description}
              </span>
            )}
            {discount.url && (
              <a
                href={discount.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Ver oferta
              </a>
            )}
            {discount.discountPercentage && (
              <Badge variant="outline" className="text-xs">
                {discount.discountPercentage}%
              </Badge>
            )}
            {discount.discountAmount && (
              <Badge variant="outline" className="text-xs">
                ${discount.discountAmount}
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground">
            {discount.createdAt?.toLocaleDateString()}
          </span>
        </div>

        {/* Requisitos compactos */}
        <div className="flex items-center gap-2 text-xs">
          <Tag className="h-3 w-3 text-blue-600" />
          <span className="text-gray-700">Aplican:</span>

          {/* Si no tiene requisitos */}
          {(!discount.availableMemberships ||
            discount.availableMemberships.length === 0) &&
            (!discount.availableCredentials ||
              discount.availableCredentials.length === 0) && (
              <Badge variant="secondary" className="text-xs">
                Sin requisitos
              </Badge>
            )}

          {/* Membresías */}
          {discount.availableMemberships &&
            discount.availableMemberships.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-600" />
                <div className="flex flex-wrap gap-1">
                  {discount.availableMemberships
                    .slice(0, 2)
                    .map((membership, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                      >
                        {membership}
                      </Badge>
                    ))}
                  {discount.availableMemberships.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{discount.availableMemberships.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

          {/* Credenciales */}
          {discount.availableCredentials &&
            discount.availableCredentials.length > 0 && (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-violet-600" />
                <div className="flex flex-wrap gap-1">
                  {discount.availableCredentials
                    .slice(0, 1)
                    .map((credential, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-violet-50 text-violet-700 border-violet-200 text-xs"
                      >
                        {credential.bank} {credential.type}
                      </Badge>
                    ))}
                  {discount.availableCredentials.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      +{discount.availableCredentials.length - 1}
                    </Badge>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* URL del descuento */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <DiscountUrlDisplay discountId={discount.id!} />
        </div>

        {/* Footer compacto */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={discount.isVisible}
              onCheckedChange={() =>
                onToggleVisibility(discount.id!, discount.isVisible)
              }
              disabled={deleting}
            />
            <span className="text-xs text-muted-foreground">
              {discount.isVisible ? "Visible" : "Oculto"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

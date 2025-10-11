import { Badge } from "@/components/Share/badge";
import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Label } from "@/components/Share/label";
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
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(discount.id!)}
              className="mt-1 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">{discount.title}</CardTitle>
                <Badge variant={expirationStatus.variant}>
                  {expirationStatus.label}
                </Badge>
                <Badge
                  variant={discount.isVisible ? "default" : "secondary"}
                  className="flex items-center gap-1"
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
              <CardDescription className="flex items-center gap-4 text-sm">
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
                  Expira: {discount.expirationDate.toLocaleDateString()}
                </span>
              </CardDescription>
            </div>
          </div>
          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(discount)}
              disabled={deleting}
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(discount.id!)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {discount.description && (
          <div className="mb-3">
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Descripción:
            </Label>
            <p className="text-sm text-muted-foreground">
              {discount.description}
            </p>
          </div>
        )}

        {/* Sección Aplican - Siempre visible */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            Aplican:
          </Label>

          {/* Si no tiene requisitos */}
          {(!discount.availableMemberships ||
            discount.availableMemberships.length === 0) &&
            (!discount.availableCredentials ||
              discount.availableCredentials.length === 0) && (
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-600 border-gray-300 text-xs"
              >
                Sin requisitos
              </Badge>
            )}

          {/* Membresías */}
          {discount.availableMemberships &&
            discount.availableMemberships.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">
                    Membresías:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {discount.availableMemberships.map((membership, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    >
                      {membership}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Credenciales */}
          {discount.availableCredentials &&
            discount.availableCredentials.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <CreditCard className="h-3 w-3 text-violet-600" />
                  <span className="text-xs font-medium text-gray-700">
                    Credenciales:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {discount.availableCredentials.map((credential, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-violet-50 text-violet-700 border-violet-200 text-xs"
                    >
                      {credential.bank} - {credential.type} {credential.brand}{" "}
                      {credential.level}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {discount.discountPercentage && (
              <Badge variant="outline">
                {discount.discountPercentage}% de descuento
              </Badge>
            )}
            {discount.discountAmount && (
              <Badge variant="outline">
                ${discount.discountAmount} de descuento
              </Badge>
            )}
            <span className="text-muted-foreground">
              Creado: {discount.createdAt?.toLocaleDateString()}
            </span>
          </div>
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

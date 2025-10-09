import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { Switch } from "@/components/Share/switch";
import { Textarea } from "@/components/Share/textarea";
import { getAllCategories } from "@/constants/categories";
import { ManualDiscount } from "@/types/admin";
import { Gift, Save, X } from "lucide-react";

interface DiscountFormData {
  title: string;
  origin: string;
  category: string | undefined;
  expirationDate: string;
  description: string;
  discountPercentage: string;
  discountAmount: string;
  imageUrl: string;
  isVisible: boolean;
}

interface DiscountFormProps {
  formData: DiscountFormData;
  selectedCategory: string | undefined;
  editingDiscount: ManualDiscount | null;
  showForm: boolean;
  onFormDataChange: React.Dispatch<React.SetStateAction<DiscountFormData>>;
  onCategoryChange: (value: string) => void;
  onShowFormChange: (show: boolean) => void;
  onResetForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CATEGORIES = getAllCategories().map((cat) => cat.name);

export function DiscountForm({
  formData,
  selectedCategory,
  editingDiscount,
  showForm,
  onFormDataChange,
  onCategoryChange,
  onShowFormChange,
  onResetForm,
  onSubmit,
}: DiscountFormProps) {
  if (!showForm) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {editingDiscount ? "Editar Descuento" : "Nuevo Descuento"}
        </CardTitle>
        <CardDescription>
          {editingDiscount
            ? "Modifica la información del descuento seleccionado"
            : "Completa la información del descuento que deseas agregar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 admin-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Descuento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  onFormDataChange({ ...formData, title: e.target.value })
                }
                placeholder="Ej: 50% off en smartphones"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origen/Tienda *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) =>
                  onFormDataChange({ ...formData, origin: e.target.value })
                }
                placeholder="Ej: Amazon, Mercado Libre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={selectedCategory || formData.category || ""}
                onValueChange={onCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedCategory ||
                      formData.category ||
                      "Selecciona una categoría"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Fecha de Expiración *</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    expirationDate: e.target.value,
                  })
                }
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercentage">
                Porcentaje de Descuento
              </Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    discountPercentage: e.target.value,
                  })
                }
                placeholder="Ej: 25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountAmount">Monto de Descuento</Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                value={formData.discountAmount}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    discountAmount: e.target.value,
                  })
                }
                placeholder="Ej: 1000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              placeholder="Describe los detalles del descuento, términos y condiciones..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de Imagen (opcional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                onFormDataChange({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked: boolean) =>
                  onFormDataChange({ ...formData, isVisible: checked })
                }
              />
              <Label htmlFor="isVisible" className="text-sm font-medium">
                Visible para usuarios
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Si está desactivado, el descuento no será visible para los
              usuarios finales
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onShowFormChange(false);
                onResetForm();
              }}
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {editingDiscount ? "Actualizar Descuento" : "Guardar Descuento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

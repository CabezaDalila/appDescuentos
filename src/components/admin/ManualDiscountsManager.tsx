import { Badge } from "@/components/Share/badge";
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
import { Textarea } from "@/components/Share/textarea";
import { getAllCategories } from "@/lib/categories";
import { createManualDiscount, getManualDiscounts } from "@/lib/firebase/admin";
import { ManualDiscount } from "@/types/admin";
import {
  Calendar,
  FileText,
  Gift,
  Plus,
  Save,
  Store,
  Tag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// Usar categorías predefinidas del sistema
const CATEGORIES = getAllCategories().map((cat) => cat.name);

export function ManualDiscountsManager() {
  const [discounts, setDiscounts] = useState<ManualDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    origin: "",
    category: undefined as string | undefined,
    expirationDate: "",
    description: "",
    discountPercentage: "",
    discountAmount: "",
    imageUrl: "",
  });

  // Estado separado para debugging del Select
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    loadDiscounts();
  }, []);

  // Sincronizar estados cuando cambie formData.category
  useEffect(() => {
    if (formData.category && formData.category !== selectedCategory) {
      console.log("Sincronizando selectedCategory con:", formData.category);
      setSelectedCategory(formData.category);
    }
  }, [formData.category, selectedCategory]);

  // Evitar re-renders innecesarios del formulario
  const handleCategoryChange = useCallback(
    (value: string) => {
      // Solo actualizar si el valor es válido y diferente
      if (value && value.trim() !== "" && value !== selectedCategory) {
        setSelectedCategory(value);
        setFormData((prev) => {
          console.log("Actualizando formData con:", value);
          return { ...prev, category: value };
        });
      } else if (!value || value.trim() === "") {
        console.log("Valor vacío recibido, ignorando...");
      }

      console.log("=== FIN DEBUG ===");
    },
    [] // Sin dependencias para evitar loops
  );

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const data = await getManualDiscounts();
      setDiscounts(data);
    } catch (error) {
      // Solo mostrar error si no es por falta de índice
      if (error instanceof Error && error.message.includes("index")) {
        console.log("Esperando que se cree el índice de Firebase...");
        setDiscounts([]); // Lista vacía mientras se crea el índice
      } else {
        toast.error("Error al cargar descuentos manuales");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.origin.trim() ||
      !formData.category ||
      !formData.expirationDate
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const discountData = {
        title: formData.title.trim(),
        origin: formData.origin.trim(),
        category: formData.category,
        expirationDate: new Date(formData.expirationDate),
        description: formData.description.trim(),
        ...(formData.discountPercentage &&
          formData.discountPercentage.trim() !== "" && {
            discountPercentage: parseFloat(formData.discountPercentage),
          }),
        ...(formData.discountAmount &&
          formData.discountAmount.trim() !== "" && {
            discountAmount: parseFloat(formData.discountAmount),
          }),
        ...(formData.imageUrl &&
          formData.imageUrl.trim() !== "" && {
            imageUrl: formData.imageUrl.trim(),
          }),
      };

      console.log("Datos del descuento a enviar:", discountData);

      await createManualDiscount(discountData);
      toast.success("Descuento creado correctamente");
      resetForm();
      setShowForm(false);
      loadDiscounts();
    } catch (error) {
      toast.error("Error al crear el descuento");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      origin: "",
      category: undefined,
      expirationDate: "",
      description: "",
      discountPercentage: "",
      discountAmount: "",
      imageUrl: "",
    });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Descuentos Manuales</h2>
          <p className="text-muted-foreground">
            Carga descuentos manualmente para complementar la extracción
            automática
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancelar" : "Nuevo Descuento"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Nuevo Descuento
            </CardTitle>
            <CardDescription>
              Completa la información del descuento que deseas agregar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 admin-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Descuento *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
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
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    placeholder="Ej: Amazon, Mercado Libre"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={selectedCategory || formData.category || ""}
                    onValueChange={handleCategoryChange}
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
                  {/* Debug: mostrar valores de ambos estados */}
                  <div className="text-xs space-y-1">
                    {selectedCategory && (
                      <p className="text-blue-600">
                        🔵 selectedCategory: <strong>{selectedCategory}</strong>
                      </p>
                    )}
                    {formData.category && (
                      <p className="text-green-600">
                        ✅ formData.category:{" "}
                        <strong>{formData.category}</strong>
                      </p>
                    )}
                    {!selectedCategory && !formData.category && (
                      <p className="text-gray-500">
                        ⚠️ Ninguna categoría seleccionada
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Fecha de Expiración *</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData({
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
                      setFormData({
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
                      setFormData({
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
                    setFormData({ ...formData, description: e.target.value })
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
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Descuento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Discounts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Descuentos Existentes</h3>
          <Badge variant="outline">{discounts.length} descuentos</Badge>
        </div>

        {discounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay descuentos manuales cargados.
                <br />
                Crea el primero para comenzar a gestionar ofertas manualmente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {discounts.map((discount) => {
              const expirationStatus = getExpirationStatus(
                discount.expirationDate
              );
              return (
                <Card key={discount.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Gift className="h-5 w-5 text-green-500" />
                          <CardTitle className="text-lg">
                            {discount.title}
                          </CardTitle>
                          <Badge variant={expirationStatus.variant}>
                            {expirationStatus.label}
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
                            Expira:{" "}
                            {discount.expirationDate.toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {discount.description && (
                      <div className="mb-3">
                        <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Descripción:
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {discount.description}
                        </p>
                      </div>
                    )}

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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

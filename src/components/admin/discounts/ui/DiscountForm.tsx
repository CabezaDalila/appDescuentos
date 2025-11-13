import { Button } from "@/components/Share/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Share/dialog";
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
import {
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  ENTITIES_BY_CATEGORY,
} from "@/constants/membership";
import { getAllOrigins } from "@/constants/origins";
import { ManualDiscount } from "@/types/admin";
import { Edit, Gift, Save, X } from "lucide-react";
import React, { useState } from "react";
import { AddressSearch } from "./addressSearch";

interface DiscountFormData {
  title: string;
  origin: string;
  category: string | undefined;
  expirationDate: string;
  description: string;
  discountPercentage: string;
  discountAmount: string;
  imageUrl: string;
  url: string;
  isVisible: boolean;
  availableCredentials: Array<{
    brand: string;
    level: string;
    type: string;
    bank: string;
  }>;
  newCredentialType: string;
  newCredentialBrand: string;
  newCredentialLevel: string;
  newCredentialBank: string;
  availableMemberships: string[];
  newMembershipCategory: string;
  newMembershipEntity: string;
  locationAddress: string;
  locationCoordinates?: { lat: number; lng: number };
}

interface DiscountFormProps {
  formData: DiscountFormData;
  editingDiscount: ManualDiscount | null;
  showForm: boolean;
  onFormDataChange: React.Dispatch<React.SetStateAction<DiscountFormData>>;
  onCategoryChange: (value: string) => void;
  onShowFormChange: (show: boolean) => void;
  onResetForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  customFooterButtons?: React.ReactNode;
  showRejectionReason?: boolean;
  rejectionReason?: string;
  onRejectionReasonChange?: (value: string) => void;
}

const CATEGORIES = getAllCategories().map((cat) => cat.name);
const ORIGINS = getAllOrigins();

export function DiscountForm({
  formData,
  editingDiscount,
  showForm,
  onFormDataChange,
  onCategoryChange,
  onShowFormChange,
  onResetForm,
  onSubmit,
  submitting,
  customFooterButtons,
  showRejectionReason,
  rejectionReason,
  onRejectionReasonChange,
}: DiscountFormProps) {
  const [credentialError, setCredentialError] = useState<string>("");
  const [membershipError, setMembershipError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    origin?: string;
    category?: string;
    expirationDate?: string;
  }>({});

  if (!showForm) return null;

  // Determinar si es edición o creación
  const isEditing = !!editingDiscount;

  // Función de validación
  const validateForm = () => {
    const errors: {
      title?: string;
      origin?: string;
      category?: string;
      expirationDate?: string;
    } = {};

    if (!formData.title.trim()) {
      errors.title = "El título es obligatorio";
    }
    if (!formData.origin.trim()) {
      errors.origin = "El origen es obligatorio";
    }
    if (!formData.category) {
      errors.category = "La categoría es obligatoria";
    }
    if (!formData.expirationDate) {
      errors.expirationDate = "La fecha de expiración es obligatoria";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <Dialog open={showForm} onOpenChange={onShowFormChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Edit className="h-5 w-5" />
            ) : (
              <Gift className="h-5 w-5" />
            )}
            {isEditing ? "Editar Descuento" : "Nuevo Descuento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del descuento seleccionado"
              : "Completa la información del descuento que deseas agregar"}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (validateForm()) {
              onSubmit(e);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Descuento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  onFormDataChange({ ...formData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: undefined });
                  }
                }}
                placeholder="Ej: 50% off en smartphones"
                required
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origen/Tienda *</Label>
              <Select
                value={formData.origin}
                onValueChange={(value) => {
                  if (value && value.trim() !== "") {
                    onFormDataChange({ ...formData, origin: value });
                    if (formErrors.origin) {
                      setFormErrors({ ...formErrors, origin: undefined });
                    }
                  }
                }}
              >
                <SelectTrigger
                  className={`w-full ${
                    formErrors.origin ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Selecciona un origen">
                    {formData.origin || "Selecciona un origen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {ORIGINS.map((origin) => (
                    <SelectItem key={origin.id} value={origin.displayName}>
                      {origin.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.origin && (
                <p className="text-red-500 text-sm">{formErrors.origin}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-base font-medium block ">
                Tarjetas que aplican para este descuento
              </Label>

              {/* Selector de tipo de tarjeta */}
              <div
                className="flex items-end gap-2"
                key={`credential-${formData.newCredentialType}-${formData.newCredentialBrand}-${formData.newCredentialLevel}-${formData.newCredentialBank}`}
              >
                <div className="flex-1">
                  <Select
                    value={formData.newCredentialBank}
                    onValueChange={(value) => {
                      setCredentialError(""); // Limpiar error al cambiar
                      onFormDataChange({
                        ...formData,
                        newCredentialBank: value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Banco">
                        {formData.newCredentialBank
                          ? formData.newCredentialBank.replace("Banco ", "")
                          : "Banco"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {ENTITIES_BY_CATEGORY.banco.map((bank) => (
                        <SelectItem
                          key={bank}
                          value={bank}
                          className="truncate"
                        >
                          {bank.replace("Banco ", "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select
                    value={formData.newCredentialType}
                    onValueChange={(value) => {
                      setCredentialError(""); // Limpiar error al cambiar
                      onFormDataChange({
                        ...formData,
                        newCredentialType: value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo">
                        {formData.newCredentialType || "Tipo"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {CARD_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="truncate"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select
                    value={formData.newCredentialBrand}
                    onValueChange={(value) => {
                      setCredentialError(""); // Limpiar error al cambiar
                      onFormDataChange({
                        ...formData,
                        newCredentialBrand: value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Marca">
                        {formData.newCredentialBrand || "Marca"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {CARD_BRANDS.map((brand) => (
                        <SelectItem
                          key={brand.value}
                          value={brand.value}
                          className="truncate"
                        >
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select
                    value={formData.newCredentialLevel}
                    onValueChange={(value) => {
                      setCredentialError(""); // Limpiar error al cambiar
                      onFormDataChange({
                        ...formData,
                        newCredentialLevel: value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Nivel">
                        {formData.newCredentialLevel || "Nivel"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {CARD_LEVELS.map((level) => (
                        <SelectItem
                          key={level.value}
                          value={level.value}
                          className="truncate"
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón para agregar credencial */}
                <div className="flex-shrink-0 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        formData.newCredentialType &&
                        formData.newCredentialBrand &&
                        formData.newCredentialLevel &&
                        formData.newCredentialBank
                      ) {
                        const newCredential = {
                          type: formData.newCredentialType,
                          brand: formData.newCredentialBrand,
                          level: formData.newCredentialLevel,
                          bank: formData.newCredentialBank,
                        };

                        // Verificar si ya existe
                        const exists = formData.availableCredentials.some(
                          (cred) =>
                            cred.type === newCredential.type &&
                            cred.brand === newCredential.brand &&
                            cred.level === newCredential.level &&
                            cred.bank === newCredential.bank
                        );

                        if (!exists) {
                          setCredentialError(""); // Limpiar error
                          onFormDataChange({
                            ...formData,
                            availableCredentials: [
                              ...formData.availableCredentials,
                              newCredential,
                            ],
                            newCredentialType: "",
                            newCredentialBrand: "",
                            newCredentialLevel: "",
                            newCredentialBank: "",
                          });
                        } else {
                          setCredentialError(
                            "Esta credencial ya está agregada"
                          );
                        }
                      }
                    }}
                    disabled={
                      !formData.newCredentialType ||
                      !formData.newCredentialBrand ||
                      !formData.newCredentialLevel ||
                      !formData.newCredentialBank
                    }
                    className={`h-[42px] w-[42px] flex items-center justify-center text-lg font-bold transition-transform ${
                      formData.newCredentialType &&
                      formData.newCredentialBrand &&
                      formData.newCredentialLevel &&
                      formData.newCredentialBank
                        ? "bg-green-500 hover:scale-105 text-white border-green-500"
                        : "bg-gray-100 text-gray-400 border-gray-300"
                    }`}
                  >
                    +
                  </Button>
                </div>
              </div>
              {/* Mostrar credenciales seleccionadas */}
              {formData.availableCredentials.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.availableCredentials.map((credential, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs rounded border border-violet-200"
                    >
                      <span className="font-medium text-xs">
                        {credential.bank} - {credential.type} {credential.brand}{" "}
                        {credential.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onFormDataChange({
                            ...formData,
                            availableCredentials:
                              formData.availableCredentials.filter(
                                (_, i) => i !== index
                              ),
                          });
                        }}
                        className="hover:text-violet-600 hover:bg-violet-200 rounded p-0.5 transition-colors text-xs"
                        title="Eliminar credencial"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Mostrar error de credenciales */}
              {credentialError && (
                <div className="text-red-500 text-sm mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                  {credentialError}
                </div>
              )}

              {/* Sección de Membresías */}
              <div className="flex flex-col mt-4">
                <Label className="text-base font-medium block mb-0.5">
                  Membresías que aplican para este descuento
                </Label>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      value={formData.newMembershipEntity || ""}
                      onValueChange={(value) => {
                        if (value && value.trim() !== "") {
                          setMembershipError(""); // Limpiar error al cambiar
                          onFormDataChange({
                            ...formData,
                            newMembershipEntity: value,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Membresia">
                          {formData.newMembershipEntity || "Entidad"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {Object.entries(ENTITIES_BY_CATEGORY).flatMap(
                          ([, entities]) =>
                            entities.map((entity) => (
                              <SelectItem
                                key={entity}
                                value={String(entity)}
                                className="truncate"
                              >
                                {String(entity)}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botón para agregar membresía */}
                  <div className="flex-shrink-0 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formData.newMembershipEntity) {
                          // Verificar si ya existe
                          const exists = formData.availableMemberships.includes(
                            formData.newMembershipEntity
                          );

                          if (!exists) {
                            setMembershipError(""); // Limpiar error
                            onFormDataChange({
                              ...formData,
                              availableMemberships: [
                                ...formData.availableMemberships,
                                formData.newMembershipEntity,
                              ],
                              newMembershipEntity: "",
                            });
                          } else {
                            setMembershipError("Esta entidad ya está agregada");
                          }
                        }
                      }}
                      disabled={!formData.newMembershipEntity}
                      className={`h-[42px] w-[42px] flex items-center justify-center text-lg font-bold transition-transform ${
                        formData.newMembershipEntity
                          ? "bg-green-500 hover:scale-105 text-white border-green-500"
                          : "bg-gray-100 text-gray-400 border-gray-300"
                      }`}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Mostrar membresías seleccionadas */}
                {formData.availableMemberships.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.availableMemberships.map((membership, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200"
                      >
                        <span className="font-medium text-xs">
                          {membership}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onFormDataChange({
                              ...formData,
                              availableMemberships:
                                formData.availableMemberships.filter(
                                  (_, i) => i !== index
                                ),
                            });
                          }}
                          className="hover:text-blue-600 hover:bg-blue-200 rounded p-0.5 transition-colors text-xs"
                          title="Eliminar membresía"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Mostrar error de membresías */}
                {membershipError && (
                  <div className="text-red-500 text-sm mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                    {membershipError}
                  </div>
                )}
              </div>

              {/* Campo de categoría del descuento */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    onCategoryChange(value);
                    if (formErrors.category) {
                      setFormErrors({ ...formErrors, category: undefined });
                    }
                  }}
                >
                  <SelectTrigger
                    className={`w-full ${
                      formErrors.category ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Selecciona una categoría">
                      {formData.category || "Selecciona una categoría"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-red-500 text-sm">{formErrors.category}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Fecha de Expiración *</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => {
                  onFormDataChange({
                    ...formData,
                    expirationDate: e.target.value,
                  });
                  if (formErrors.expirationDate) {
                    setFormErrors({ ...formErrors, expirationDate: undefined });
                  }
                }}
                required
                min={new Date().toISOString().split("T")[0]}
                className={formErrors.expirationDate ? "border-red-500" : ""}
              />
              {formErrors.expirationDate && (
                <p className="text-red-500 text-sm">
                  {formErrors.expirationDate}
                </p>
              )}
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
              <Label htmlFor="url">URL del Descuento (opcional)</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) =>
                  onFormDataChange({ ...formData, url: e.target.value })
                }
                placeholder="https://ejemplo.com/descuento"
              />
            </div>
            {/* Sección de Ubicación Simplificada */}
            <div className="col-span-2 space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ubicación del Descuento
                </h3>
                <AddressSearch
                  value={formData.locationAddress}
                  onChange={(address, coordinates) => {
                    onFormDataChange({
                      ...formData,
                      locationAddress: address,
                      locationCoordinates: coordinates,
                    });
                  }}
                  placeholder="Buscar dirección del descuento..."
                  label="Dirección del Establecimiento"
                  required={false}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Tope de Descuento</Label>
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

          {/* Campo de razón de rechazo si está habilitado */}
          {showRejectionReason && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Razón del rechazo (si aplica)
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason || ""}
                onChange={(e) => onRejectionReasonChange?.(e.target.value)}
                rows={3}
                placeholder="Especifica la razón del rechazo..."
                className="w-full"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {customFooterButtons ? (
              customFooterButtons
            ) : (
              <>
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
                <Button
                  type="submit"
                  disabled={!!submitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {submitting
                    ? isEditing
                      ? "Actualizando..."
                      : "Guardando..."
                    : isEditing
                    ? "Actualizar Descuento"
                    : "Guardar Descuento"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

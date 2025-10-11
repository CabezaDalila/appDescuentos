import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Plus,
  Search,
} from "lucide-react";
import React, { useState } from "react";
import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  CardLevel,
  CreateMembershipData,
  ENTITIES_BY_CATEGORY,
  MEMBERSHIP_CATEGORIES,
} from "../../constants/membership";
import { formatExpiryInput, validateExpiry } from "../../lib/card-utils";
import { Button } from "../Share/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../Share/dialog";
import { Input } from "../Share/input";
import { Label } from "../Share/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Share/select";
import { Separator } from "../Share/separator";

interface AddMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (
    membershipData: CreateMembershipData & { cards?: Card[] }
  ) => Promise<void>;
}

const AddMembershipModal: React.FC<AddMembershipModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [step, setStep] = useState<"category" | "entity" | "cards">("category");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Estado para tarjetas
  const [cards, setCards] = useState<Card[]>([]);
  const [newCard, setNewCard] = useState<Partial<Card>>({
    type: "" as Card["type"],
    brand: "" as Card["brand"],
    level: "" as CardLevel,
    name: "",
    expiry: "",
  });

  // Colores predefinidos para cada categoría
  const categoryColors = {
    banco: "#2563eb",
    club: "#dc2626",
    salud: "#059669",
    educacion: "#7c3aed",
    seguro: "#ea580c",
    telecomunicacion: "#0891b2",
  };

  // Mapeo de bancos a logos locales
  const BANK_LOGOS: Record<string, string> = {
    "Banco Galicia": "/logos/bancos/Galicia.svg",
    // Puedes agregar más bancos aquí: 'Banco Santander': '/logos/bancos/Santander.png', etc.
  };

  // Mapeo de bancos a gradientes
  const BANK_GRADIENTS: Record<string, string> = {
    "Banco Galicia": "from-yellow-500 to-orange-500",
    "Banco Santander": "from-red-600 to-red-700",
    "Banco Nación": "from-blue-600 to-blue-700",
    "Banco BBVA": "from-blue-500 to-blue-600",
    "Banco HSBC": "from-red-600 to-red-700",
    "Banco Macro": "from-blue-400 to-blue-500",
    "Banco Itaú": "from-orange-500 to-red-500",
    "Banco Supervielle": "from-green-500 to-blue-500",
    "Banco Provincia": "from-blue-600 to-blue-800",
    "Banco Ciudad": "from-gray-600 to-gray-800",
  };

  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setCustomName(entity);
  };

  const handleCreate = async () => {
    if (!selectedCategory || !customName.trim() || !onCreate) return;

    // Para bancos, verificar que tenga al menos una tarjeta
    if (selectedCategory === "banco" && cards.length === 0) {
      alert("Los bancos deben tener al menos una tarjeta asociada");
      return;
    }

    // Asignar logo y gradiente automáticamente si es banco conocido
    let logoUrl: string | undefined = undefined;
    let gradient: string | undefined = undefined;
    if (selectedCategory === "banco") {
      logoUrl = BANK_LOGOS[customName.trim()] || undefined;
      gradient = BANK_GRADIENTS[customName.trim()] || undefined;
    }

    try {
      setIsCreating(true);
      const membershipData = {
        name: customName.trim(),
        category: selectedCategory as
          | "banco"
          | "club"
          | "salud"
          | "educacion"
          | "seguro"
          | "telecomunicacion",
        color:
          categoryColors[selectedCategory as keyof typeof categoryColors] ||
          "#6366f1",
        ...(logoUrl ? { logoUrl } : {}),
        ...(gradient ? { gradient } : {}),
        // Siempre incluir las tarjetas, incluso si está vacío
        cards: selectedCategory === "banco" ? cards : [],
      };

      console.log("🚀 Creando membresía con datos:", membershipData);
      await onCreate(membershipData);
      console.log("✅ Membresía creada exitosamente");
      handleClose();
    } catch (error) {
      console.error("❌ Error al crear membresía:", error);
      alert("Error al crear la membresía. Inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddCard = () => {
    if (!newCard.type || !newCard.brand || !newCard.level) {
      alert("Por favor completa todos los campos obligatorios de la tarjeta");
      return;
    }

    // Validar fecha de vencimiento si se proporciona
    if (newCard.expiry && !validateExpiry(newCard.expiry)) {
      alert(
        "La fecha de vencimiento debe tener formato MM/YY y no puede ser una fecha pasada"
      );
      return;
    }

    const card: Card = {
      id: Date.now().toString(),
      type: newCard.type,
      brand: newCard.brand,
      level: newCard.level,
      name: newCard.name || "",
      expiry: newCard.expiry || "",
    };

    setCards([...cards, card]);
    setNewCard({
      type: "" as Card["type"],
      brand: "" as Card["brand"],
      level: "" as CardLevel,
      name: "",
      expiry: "",
    });
  };

  const handleRemoveCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId));
  };

  const handleClose = () => {
    setStep("category");
    setSelectedCategory("");
    setSearchTerm("");
    setSelectedEntity("");
    setCustomName("");
    setIsCreating(false);
    setCards([]);
    setNewCard({
      type: "" as Card["type"],
      brand: "" as Card["brand"],
      level: "" as CardLevel,
      name: "",
      expiry: "",
    });
    onClose();
  };

  const filteredEntities = selectedCategory
    ? ENTITIES_BY_CATEGORY[
        selectedCategory as keyof typeof ENTITIES_BY_CATEGORY
      ]?.filter((entity) =>
        entity.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md membership-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "category" ? (
              <>
                <Plus className="h-5 w-5" />
                Seleccionar Categoría
              </>
            ) : step === "entity" ? (
              <>
                <Building2 className="h-5 w-5" />
                Seleccionar Entidad
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Agregar Tarjetas
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "category"
              ? "Elige el tipo de membresía que quieres agregar"
              : step === "entity"
              ? "Selecciona la entidad específica o ingresa un nombre personalizado"
              : "Agrega al menos una tarjeta para tu banco"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "category" ? (
            // Paso 1: Selección de categoría
            <div className="flex flex-col space-y-3">
              {MEMBERSHIP_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => {
                    setSelectedCategory(category.value);
                    setStep("entity");
                  }}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor:
                          categoryColors[
                            category.value as keyof typeof categoryColors
                          ],
                      }}
                    >
                      {category.label.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium" style={{ color: "#374151" }}>
                      {category.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : step === "entity" ? (
            // Paso 2: Selección de entidad
            <div className="space-y-4">
              {/* Navegación */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={() => setStep("category")}
                  className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                  style={{ color: "#6B7280" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        categoryColors[
                          selectedCategory as keyof typeof categoryColors
                        ],
                    }}
                  />
                  <span
                    className="capitalize"
                    style={{ color: "#8B5CF6", fontWeight: "600" }}
                  >
                    {MEMBERSHIP_CATEGORIES.find(
                      (c) => c.value === selectedCategory
                    )?.label || selectedCategory}
                  </span>
                </div>
              </div>

              {/* Buscador */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: "#8B5CF6" }}
                />
                <Input
                  placeholder="Buscar entidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de entidades */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredEntities.map((entity) => (
                  <button
                    key={entity}
                    onClick={() => handleEntitySelect(entity)}
                    className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors flex items-center justify-between"
                    style={{
                      borderColor:
                        selectedEntity === entity ? "#8B5CF6" : "#D1D5DB",
                      backgroundColor:
                        selectedEntity === entity ? "#F3F0FF" : "white",
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{
                        color:
                          selectedEntity === entity ? "#8B5CF6" : "#374151",
                      }}
                    >
                      {entity}
                    </span>
                    {selectedEntity === entity && (
                      <Check
                        className="h-5 w-5 text-purple-600"
                        style={{ color: "#8B5CF6" }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Entrada personalizada */}
              <Separator />
              <div className="space-y-2">
                <Label
                  htmlFor="customName"
                  style={{ color: "#374151", fontWeight: "500" }}
                >
                  O ingresa un nombre personalizado
                </Label>
                <Input
                  id="customName"
                  placeholder="Ej: Mi banco personal"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              {/* Botón de continuar */}
              <Button
                onClick={() => {
                  if (selectedCategory === "banco") {
                    setStep("cards");
                  } else {
                    handleCreate();
                  }
                }}
                disabled={!customName.trim() || isCreating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "white",
                  border: "none",
                }}
              >
                {isCreating
                  ? "Creando..."
                  : selectedCategory === "banco"
                  ? "Continuar"
                  : "Crear Membresía"}
              </Button>
            </div>
          ) : (
            // Paso 3: Agregar tarjetas (solo para bancos)
            <div className="space-y-4">
              {/* Lista de tarjetas agregadas */}
              {cards.length > 0 && (
                <div className="space-y-2">
                  <Label style={{ color: "#374151", fontWeight: "500" }}>
                    Tarjetas agregadas ({cards.length})
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">
                            {card.brand} {card.level}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({card.type})
                          </span>
                          {card.expiry && (
                            <div className="text-xs text-gray-500 mt-1">
                              Vence: {card.expiry}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveCard(card.id)}
                          className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50"
                          style={{
                            borderColor: "#DC2626",
                            color: "#DC2626",
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario para agregar nueva tarjeta */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label style={{ color: "#374151", fontWeight: "500" }}>
                  Agregar nueva tarjeta
                </Label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="cardType"
                      style={{ color: "#374151", fontWeight: "500" }}
                    >
                      Tipo
                    </Label>
                    <Select
                      value={newCard.type}
                      onValueChange={(value) =>
                        setNewCard({ ...newCard, type: value as Card["type"] })
                      }
                    >
                      <SelectTrigger
                        className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 text-gray-700"
                        style={{
                          borderColor: "#D1D5DB !important",
                          color: newCard.type
                            ? "#374151 !important"
                            : "#9CA3AF !important",
                        }}
                      >
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-purple-300"
                        style={{ borderColor: "#D1D5DB" }}
                      >
                        {CARD_TYPES.map((type) => (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-900"
                            style={{ color: "#374151" }}
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="cardBrand"
                      style={{ color: "#374151", fontWeight: "500" }}
                    >
                      Marca
                    </Label>
                    <Select
                      value={newCard.brand}
                      onValueChange={(value) =>
                        setNewCard({
                          ...newCard,
                          brand: value as Card["brand"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 text-gray-700"
                        style={{
                          borderColor: "#D1D5DB !important",
                          color: newCard.brand
                            ? "#374151 !important"
                            : "#9CA3AF !important",
                        }}
                      >
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-purple-300"
                        style={{ borderColor: "#D1D5DB" }}
                      >
                        {CARD_BRANDS.map((brand) => (
                          <SelectItem
                            key={brand.value}
                            value={brand.value}
                            className="hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-900"
                            style={{ color: "#374151" }}
                          >
                            {brand.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="cardLevel"
                    style={{ color: "#374151", fontWeight: "500" }}
                  >
                    Nivel
                  </Label>
                  <Select
                    value={newCard.level}
                    onValueChange={(value) =>
                      setNewCard({ ...newCard, level: value as CardLevel })
                    }
                  >
                    <SelectTrigger
                      className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 text-gray-700"
                      style={{
                        borderColor: "#D1D5DB !important",
                        color: newCard.level
                          ? "#374151 !important"
                          : "#9CA3AF !important",
                      }}
                    >
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent
                      className="border-purple-300"
                      style={{ borderColor: "#D1D5DB" }}
                    >
                      {CARD_LEVELS.map((level) => (
                        <SelectItem
                          key={level.value}
                          value={level.value}
                          className="hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-900"
                          style={{ color: "#374151" }}
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="cardName"
                    style={{ color: "#374151", fontWeight: "500" }}
                  >
                    Nombre (opcional)
                  </Label>
                  <Input
                    id="cardName"
                    placeholder="Ej: Mi tarjeta principal"
                    value={newCard.name || ""}
                    onChange={(e) =>
                      setNewCard({ ...newCard, name: e.target.value })
                    }
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                    style={{ borderColor: "#D1D5DB" }}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="cardExpiry"
                    style={{ color: "#374151", fontWeight: "500" }}
                  >
                    Vencimiento (opcional)
                  </Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={newCard.expiry || ""}
                    onChange={(e) => {
                      const formatted = formatExpiryInput(e.target.value);
                      setNewCard({ ...newCard, expiry: formatted });
                    }}
                    maxLength={5}
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                    style={{ borderColor: "#D1D5DB" }}
                  />
                </div>

                <Button
                  onClick={handleAddCard}
                  variant="outline"
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  style={{
                    borderColor: "#8B5CF6",
                    color: "#8B5CF6",
                  }}
                  disabled={!newCard.type || !newCard.brand || !newCard.level}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tarjeta
                </Button>
              </div>

              {/* Botones de navegación */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("entity")}
                  className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
                  style={{
                    borderColor: "#8B5CF6",
                    color: "#8B5CF6",
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={cards.length === 0 || isCreating}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-0"
                  style={{
                    backgroundColor: "#8B5CF6",
                    color: "white",
                    border: "none",
                  }}
                >
                  {isCreating ? "Creando..." : "Crear Membresía"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMembershipModal;

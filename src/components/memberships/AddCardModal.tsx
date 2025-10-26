import { Building2, CreditCard, Search } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  CardLevel,
  CreateMembershipData,
  ENTITIES_BY_CATEGORY,
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

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (
    membershipData: CreateMembershipData & { cards: Card[] }
  ) => Promise<void>;
}

const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [step, setStep] = useState<"bank" | "card">("bank");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [customBankName, setCustomBankName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Estado para la tarjeta
  const [cardData, setCardData] = useState<Partial<Card>>({
    type: "" as Card["type"],
    brand: "" as Card["brand"],
    level: "" as CardLevel,
    name: "",
    expiryDate: "",
  });

  // Colores y gradientes para bancos
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

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    setCustomBankName(bank);
  };

  const handleCreate = async () => {
    if (!selectedBank && !customBankName.trim()) {
      toast.error("Debe seleccionar un banco");
      return;
    }

    if (!cardData.type || !cardData.brand || !cardData.level) {
      toast.error("Debe completar todos los campos obligatorios de la tarjeta");
      return;
    }

    // Validar fecha de vencimiento si se proporciona
    if (cardData.expiryDate && !validateExpiry(cardData.expiryDate)) {
      toast.error(
        "La fecha de vencimiento debe tener formato MM/YY y no puede ser una fecha pasada"
      );
      return;
    }

    try {
      setIsCreating(true);

      const bankName = customBankName.trim();
      const gradient = BANK_GRADIENTS[bankName] || "from-blue-500 to-blue-600";

      const newCard: Card = {
        id: Date.now().toString(),
        type: cardData.type,
        brand: cardData.brand,
        level: cardData.level,
        name: cardData.name || "",
        expiryDate: cardData.expiryDate || "",
      };

      const membershipData = {
        name: bankName,
        category: "banco" as const,
        color: "#2563eb",
        gradient: gradient,
        cards: [newCard],
      };

      await onCreate?.(membershipData);
      toast.success("Banco y tarjeta creados exitosamente");
      handleClose();
    } catch (error) {
      console.error("❌ Error al crear banco con tarjeta:", error);
      toast.error("Error al crear el banco y tarjeta. Inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep("bank");
    setSearchTerm("");
    setSelectedBank("");
    setCustomBankName("");
    setIsCreating(false);
    setCardData({
      type: "" as Card["type"],
      brand: "" as Card["brand"],
      level: "" as CardLevel,
      name: "",
      expiryDate: "",
    });
    onClose();
  };

  const banks = ENTITIES_BY_CATEGORY.banco;
  const filteredBanks = banks.filter((bank) =>
    bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "bank" ? (
              <>
                <Building2 className="h-5 w-5" />
                Seleccionar Banco
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Crear Tarjeta
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "bank"
              ? "Elige el banco para tu nueva tarjeta"
              : "Completa los datos de tu tarjeta"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "bank" ? (
            // Paso 1: Selección de banco
            <div className="space-y-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de bancos */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank}
                    onClick={() => handleBankSelect(bank)}
                    className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-between"
                    style={{
                      borderColor:
                        selectedBank === bank ? "#3B82F6" : "#D1D5DB",
                      backgroundColor:
                        selectedBank === bank ? "#EFF6FF" : "white",
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{
                        color: selectedBank === bank ? "#3B82F6" : "#374151",
                      }}
                    >
                      {bank}
                    </span>
                  </button>
                ))}
              </div>

              {/* Entrada personalizada */}
              <div className="space-y-2">
                <Label
                  htmlFor="customBankName"
                  className="text-gray-700 font-medium"
                >
                  O ingresa un nombre personalizado
                </Label>
                <Input
                  id="customBankName"
                  placeholder="Ej: Mi banco personal"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                />
              </div>

              {/* Botón de continuar */}
              <Button
                onClick={() => setStep("card")}
                disabled={!selectedBank && !customBankName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continuar
              </Button>
            </div>
          ) : (
            // Paso 2: Crear tarjeta
            <div className="space-y-4">
              {/* Información del banco seleccionado */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Banco:</strong> {customBankName}
                </p>
              </div>

              {/* Formulario de tarjeta */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="cardType"
                      className="text-gray-700 font-medium"
                    >
                      Tipo *
                    </Label>
                    <Select
                      value={cardData.type}
                      onValueChange={(value) =>
                        setCardData({
                          ...cardData,
                          type: value as Card["type"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="cardBrand"
                      className="text-gray-700 font-medium"
                    >
                      Marca *
                    </Label>
                    <Select
                      value={cardData.brand}
                      onValueChange={(value) =>
                        setCardData({
                          ...cardData,
                          brand: value as Card["brand"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_BRANDS.map((brand) => (
                          <SelectItem key={brand.value} value={brand.value}>
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
                    className="text-gray-700 font-medium"
                  >
                    Nivel *
                  </Label>
                  <Select
                    value={cardData.level}
                    onValueChange={(value) =>
                      setCardData({ ...cardData, level: value as CardLevel })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="cardName"
                    className="text-gray-700 font-medium"
                  >
                    Nombre (opcional)
                  </Label>
                  <Input
                    id="cardName"
                    placeholder="Ej: Mi tarjeta principal"
                    value={cardData.name || ""}
                    onChange={(e) =>
                      setCardData({ ...cardData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor="cardExpiry"
                    className="text-gray-700 font-medium"
                  >
                    Vencimiento (opcional)
                  </Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={cardData.expiryDate || ""}
                    onChange={(e) => {
                      const formatted = formatExpiryInput(e.target.value);
                      setCardData({ ...cardData, expiryDate: formatted });
                    }}
                    maxLength={5}
                  />
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("bank")}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !cardData.type ||
                    !cardData.brand ||
                    !cardData.level ||
                    isCreating
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCreating ? "Creando..." : "Crear"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCardModal;

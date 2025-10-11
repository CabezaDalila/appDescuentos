import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
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
import { useAuth } from "@/hooks/useAuth";
import { createMembership } from "@/lib/firebase/memberships";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AddMembershipPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    tier: "",
    description: "",
    color: "#6B7280",
  });

  // Datos específicos para bancos
  const [bankData, setBankData] = useState({
    bank: "",
    cardType: "", // crédito o débito
    brand: "", // visa, mastercard, etc
    level: "", // classic, gold, platinum, etc
    expiryDate: "",
    cardNumber: "",
    cardName: "",
  });

  const banks = [
    "Galicia",
    "Santander",
    "Nación",
    "Provincia",
    "Ciudad",
    "Macro",
    "Itaú",
    "HSBC",
    "BBVA",
    "Supervielle",
  ];

  const cardTypes = ["Crédito", "Débito"];

  const brands = ["Visa", "Mastercard", "American Express", "Diners Club"];

  const levels = [
    "Classic",
    "Gold",
    "Platinum",
    "Black",
    "Signature",
    "Infinite",
    "Internacional",
    "Nacional",
  ];

  const isBank = formData.category === "banco";

  const nextStep = () => {
    if (isBank && currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return bankData.bank !== "";
      case 2:
        return bankData.cardType !== "";
      case 3:
        return bankData.brand !== "";
      case 4:
        return bankData.level !== "";
      case 5:
        return bankData.expiryDate !== "";
      case 6:
        return bankData.cardName !== "";
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const membershipData = isBank
        ? {
            name: bankData.bank,
            category: "banco",
            tier: bankData.level,
            description: `Tarjeta ${bankData.brand} ${bankData.cardType}`,
            color: "#6B7280",
            cards: [
              {
                ...bankData,
                id: Date.now().toString(),
                addedAt: new Date(),
              },
            ],
          }
        : {
            ...formData,
            cards: [],
          };

      await createMembership(membershipData);

      toast.success("Membresía agregada exitosamente");
      router.push("/memberships");
    } catch (error) {
      console.error("Error agregando membresía:", error);
      toast.error("Error agregando membresía");
    } finally {
      setSaving(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/memberships")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Agregar Membresía</h1>
          <button
            onClick={() => router.push("/memberships")}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {!formData.category ? (
          /* Paso 1: Seleccionar categoría */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nueva Membresía
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">
                  <Label>Selecciona el tipo de membresía</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: "banco" }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">🏦</div>
                      <div className="font-medium">Banco</div>
                      <div className="text-sm text-gray-500">
                        Tarjetas de crédito/débito
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: "club" }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">🏆</div>
                      <div className="font-medium">Club</div>
                      <div className="text-sm text-gray-500">
                        Membresías de clubes
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: "salud" }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">❤️</div>
                      <div className="font-medium">Salud</div>
                      <div className="text-sm text-gray-500">
                        Obras sociales, prepagas
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          category: "educacion",
                        }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">🎓</div>
                      <div className="font-medium">Educación</div>
                      <div className="text-sm text-gray-500">
                        Universidades, institutos
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: "gym" }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">💪</div>
                      <div className="font-medium">Gimnasio</div>
                      <div className="text-sm text-gray-500">
                        Membresías deportivas
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          category: "streaming",
                        }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">📺</div>
                      <div className="font-medium">Streaming</div>
                      <div className="text-sm text-gray-500">
                        Netflix, Spotify, etc.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: "otros" }))
                      }
                      className="p-4 border rounded-lg text-left transition-colors border-gray-300 hover:border-gray-400"
                    >
                      <div className="text-2xl mb-2">🏢</div>
                      <div className="font-medium">Otros</div>
                      <div className="text-sm text-gray-500">
                        Otras membresías
                      </div>
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : isBank ? (
          /* Flujo paso a paso para bancos */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Agregar Tarjeta de Banco
                </span>
                <span className="text-sm text-gray-500">
                  Paso {currentStep} de 6
                </span>
              </CardTitle>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {/* Paso 1: Seleccionar Banco */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <Label>Selecciona el banco</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {banks.map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() =>
                            setBankData((prev) => ({ ...prev, bank }))
                          }
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            bankData.bank === bank
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 2: Tipo de Tarjeta */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <Label>Tipo de tarjeta</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {cardTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setBankData((prev) => ({ ...prev, cardType: type }))
                          }
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            bankData.cardType === type
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 3: Marca */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <Label>Marca de la tarjeta</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() =>
                            setBankData((prev) => ({ ...prev, brand }))
                          }
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            bankData.brand === brand
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 4: Nivel */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <Label>Nivel de la tarjeta</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {levels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setBankData((prev) => ({ ...prev, level }))
                          }
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            bankData.level === level
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 5: Fecha de vencimiento */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <Label htmlFor="expiryDate">Fecha de vencimiento</Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="MM/AA"
                      value={bankData.expiryDate}
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        setBankData((prev) => ({
                          ...prev,
                          expiryDate: formatted,
                        }));
                      }}
                      maxLength={5}
                      className="text-center text-lg"
                    />
                  </div>
                )}

                {/* Paso 6: Nombre en la tarjeta */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="Nombre como aparece en la tarjeta"
                        value={bankData.cardName}
                        onChange={(e) =>
                          setBankData((prev) => ({
                            ...prev,
                            cardName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Botones de navegación */}
                <div className="flex gap-3 pt-6">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="px-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  )}

                  {currentStep < 6 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepComplete(currentStep)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Siguiente
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={saving || !isStepComplete(6)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? "Guardando..." : "Crear Membresía"}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Formulario normal para otras membresías */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nueva Membresía
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Membresía</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej: Banco Galicia, Club La Nación..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banco">Banco</SelectItem>
                      <SelectItem value="club">Club</SelectItem>
                      <SelectItem value="salud">Salud</SelectItem>
                      <SelectItem value="educacion">Educación</SelectItem>
                      <SelectItem value="gym">Gimnasio</SelectItem>
                      <SelectItem value="streaming">Streaming</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tier">Tipo/Nivel (Opcional)</Label>
                  <Input
                    id="tier"
                    type="text"
                    placeholder="Ej: Gold, Premium, Básico..."
                    value={formData.tier}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tier: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe brevemente esta membresía..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? "Guardando..." : "Agregar Membresía"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vista previa para bancos */}
        {isBank && bankData.bank && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">
                Vista Previa - Membresía y Tarjeta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vista previa de la membresía */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-blue-600">
                      {bankData.bank.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-base leading-tight">
                        {bankData.bank}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          🏦 banco
                        </span>
                        {bankData.level && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {bankData.level}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                        Activa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vista previa de la tarjeta */}
                {bankData.brand && (
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg">
                          {bankData.brand?.substring(0, 2).toUpperCase() ||
                            "**"}
                        </span>
                        {bankData.level && (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            {bankData.level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">💳</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xl font-mono tracking-wider mb-2">
                        **** **** **** ****
                      </div>
                      <div className="text-sm opacity-90">
                        {bankData.bank} • {bankData.cardType}
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      {bankData.expiryDate || "MM/AA"}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista previa para otras membresías */}
        {!isBank && formData.name && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  {/* Icono */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-base leading-tight">
                      {formData.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        {formData.category === "banco" && "🏦"}
                        {formData.category === "club" && "🏆"}
                        {formData.category === "salud" && "❤️"}
                        {formData.category === "educacion" && "🎓"}
                        {formData.category === "gym" && "💪"}
                        {formData.category === "streaming" && "📺"}
                        {formData.category === "otros" && "🏢"}
                        {formData.category}
                      </span>
                      {formData.tier && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                          {formData.tier}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="flex-shrink-0">
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                      Activa
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

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
import { useAuth } from "@/hooks/useAuth";
import {
    addCardToMembership,
    getMembershipById,
} from "@/lib/firebase/memberships";
import { ArrowLeft, ArrowRight, CreditCard, Wifi } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AddCardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [membership, setMembership] = useState<any>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Datos para tarjetas de banco
  const [bankData, setBankData] = useState({
    bank: "",
    cardType: "", // crédito o débito
    brand: "", // visa, mastercard, etc
    level: "", // classic, gold, platinum, etc
    expiryDate: "",
    cardNumber: "",
    cardName: "",
  });

  // Datos para tarjetas normales (no banco)
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cardType: "",
    cardName: "",
    brand: "",
    level: "",
  });

  useEffect(() => {
    if (!id || !user || loading) return;

    const loadMembership = async () => {
      setLoadingMembership(true);
      try {
        const membershipData = await getMembershipById(id as string);
        setMembership(membershipData);

        // Si es un banco, pre-llenar el nombre del banco
        if (membershipData?.category === "banco") {
          setBankData((prev) => ({
            ...prev,
            bank: membershipData.name,
          }));
        }
      } catch (error) {
        console.error("Error cargando membresía:", error);
        toast.error("Error cargando membresía");
        router.push("/memberships");
      } finally {
        setLoadingMembership(false);
      }
    };

    loadMembership();
  }, [id, user, loading, router]);

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

  const isBank = membership?.category === "banco";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership) return;

    setSaving(true);
    try {
      const cardData = isBank
        ? {
            id: Date.now().toString(),
            type: bankData.cardType,
            brand: bankData.brand,
            level: bankData.level,
            status: "active",
          }
        : {
            id: Date.now().toString(),
            type: formData.cardType,
            brand: formData.brand,
            level: formData.level,
            status: "active",
          };

      await addCardToMembership(membership.id, cardData);

      toast.success("Tarjeta agregada exitosamente");
      router.push(`/memberships/${membership.id}`);
    } catch (error) {
      console.error("Error agregando tarjeta:", error);
      toast.error("Error agregando tarjeta");
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

  const nextStep = () => {
    const maxSteps = isBank ? 3 : 4; // Si es banco, solo 3 pasos (omite selección de banco)
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (step: number) => {
    if (isBank) {
      // Para bancos, omitimos el paso 1 (selección de banco)
      switch (step) {
        case 1:
          return bankData.cardType !== ""; // Tipo de tarjeta
        case 2:
          return bankData.brand !== ""; // Marca
        case 3:
          return bankData.level !== ""; // Nivel
        default:
          return false;
      }
    } else {
      // Para membresías no bancarias
      switch (step) {
        case 1:
          return bankData.bank !== "";
        case 2:
          return bankData.cardType !== "";
        case 3:
          return bankData.brand !== "";
        case 4:
          return bankData.level !== "";
        default:
          return false;
      }
    }
  };

  if (loading || loadingMembership) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando...
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Membresía no encontrada
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/memberships/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              {isBank
                ? `Agregar Tarjeta - ${membership?.name}`
                : "Agregar Tarjeta"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Paso {currentStep} de {isBank ? 3 : 4}
            </p>
          </div>
          <button
            onClick={() => router.push("/memberships")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-gray-600 hover:text-gray-800">✕</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-8 pb-20">
        {isBank ? (
          /* Flujo para tarjetas de banco */
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                Agregar Tarjeta - {membership?.name}
              </CardTitle>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
            </CardHeader>
            <CardContent className="px-4">
              {isBank && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Agregando tarjeta a {membership?.name}
                      </h3>
                      <p className="text-sm text-blue-700">
                        Selecciona los detalles de tu nueva tarjeta
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {/* Paso 1: Seleccionar Banco (solo para no bancos) */}
                {!isBank && currentStep === 1 && (
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

                {/* Paso 1 (bancos) / Paso 2 (no bancos): Tipo de Tarjeta */}
                {((isBank && currentStep === 1) ||
                  (!isBank && currentStep === 2)) && (
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

                {/* Paso 2 (bancos) / Paso 3 (no bancos): Marca */}
                {((isBank && currentStep === 2) ||
                  (!isBank && currentStep === 3)) && (
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

                {/* Paso 3 (bancos) / Paso 4 (no bancos): Nivel */}
                {((isBank && currentStep === 3) ||
                  (!isBank && currentStep === 4)) && (
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

                {/* Botones de navegación */}
                <div className="flex gap-2 pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/memberships/${id}`)}
                    className="flex-1 min-w-0"
                  >
                    Cancelar
                  </Button>

                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 min-w-0"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  )}

                  {currentStep < (isBank ? 3 : 4) ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepComplete(currentStep)}
                      className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Siguiente
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={saving || !isStepComplete(currentStep)}
                      className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? "Guardando..." : "Crear Tarjeta"}
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
              <CardTitle>Información de la Tarjeta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        cardNumber: formatted,
                      }));
                    }}
                    maxLength={19}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cardType">Tipo de Tarjeta</Label>
                  <Select
                    value={formData.cardType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, cardType: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/memberships/${id}`)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? "Guardando..." : "Agregar Tarjeta"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vista previa para tarjetas de banco */}
        {isBank && bankData.bank && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg">
                      {bankData.brand || "**"}
                    </span>
                    {bankData.level && (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {bankData.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-white" />
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

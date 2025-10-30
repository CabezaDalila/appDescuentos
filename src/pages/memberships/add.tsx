import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { useAuth } from "@/hooks/useAuth";
import { createMembership } from "@/lib/firebase/memberships";
import { validateAndFormatExpiryInput } from "@/lib/utils/expiryUtils";
import { ArrowLeft, ArrowRight, CreditCard, Wifi } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AddMembershipPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    color: "",
  });

  const [selectedMembership, setSelectedMembership] = useState("");

  // Estados para el flujo de banco
  const [currentStep, setCurrentStep] = useState(1);
  const [expiryError, setExpiryError] = useState<string>("");
  const [bankData, setBankData] = useState({
    bank: "",
    cardType: "",
    brand: "",
    level: "",
    expiryDate: "",
    cardName: "",
  });

  const membershipTypes = [
    {
      id: "streaming",
      name: "Streaming",
      description: "Netflix, Spotify, Disney+",
      color: "#FF6B6B",
      icon: "📺",
    },
    {
      id: "club",
      name: "Club",
      description: "Membresías de clubes",
      color: "#4ECDC4",
      icon: "🏆",
    },
    {
      id: "salud",
      name: "Salud",
      description: "Obras sociales, prepagas",
      color: "#45B7D1",
      icon: "❤️",
    },
    {
      id: "educacion",
      name: "Educación",
      description: "Universidades, institutos",
      color: "#96CEB4",
      icon: "🎓",
    },
    {
      id: "gym",
      name: "Gimnasio",
      description: "Membresías deportivas",
      color: "#FFEAA7",
      icon: "💪",
    },
    {
      id: "banco",
      name: "Banco",
      description: "Tarjetas de crédito/débito",
      color: "#DDA0DD",
      icon: "🏦",
    },
  ];

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

  // Opciones específicas para cada tipo de membresía
  const membershipOptions = {
    streaming: [
      "Netflix",
      "Spotify",
      "Disney+",
      "Amazon Prime",
      "HBO Max",
      "Apple TV+",
      "YouTube Premium",
      "Twitch",
      "Crunchyroll",
      "Paramount+",
    ],
    club: [
      "Club La Nación",
      "Club Clarín",
      "Club La Razón",
      "Club Perfil",
      "Club de Lectores",
      "Club de Beneficios",
      "Club VIP",
      "Club Premium",
    ],
    salud: [
      "OSDE",
      "Ospedin",
      "Swiss Medical",
      "Galeno",
      "Medicus",
      "Hospital Italiano",
      "Sanatorio Güemes",
      "CEMIC",
      "Avalian",
      "Omint",
    ],
    educacion: [
      "UBA",
      "UTN",
      "UADE",
      "UCEMA",
      "Di Tella",
      "Austral",
      "San Andrés",
      "Torcuato Di Tella",
      "ITBA",
      "ORT",
    ],
    gym: [
      "Megatlon",
      "SportClub",
      "Smart Fit",
      "CrossFit",
      "Pilates",
      "Yoga",
      "Spinning",
      "Functional",
      "Boxing",
      "Natación",
    ],
  };

  const nextStep = () => {
    if (currentStep < 6) {
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
        return bankData.expiryDate !== "" && !expiryError;
      case 6:
        return bankData.cardName !== "";
      default:
        return false;
    }
  };

  const handleExpiryDateChange = (value: string) => {
    const result = validateAndFormatExpiryInput(value);
    setExpiryError(result.isValid ? "" : result.error || "");
    setBankData((prev) => ({ ...prev, expiryDate: result.formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes estar autenticado para crear una membresía");
      return;
    }

    setSaving(true);
    try {
      if (isBank) {
        // Para bancos, crear membresía con la tarjeta incluida
        const bankName = `Banco ${bankData.bank}`;
        const membershipData = {
          name: bankName,
          category: "banco",
          tier: "",
          description: `Membresía bancaria - ${bankName}`,
          color: "#DDA0DD",
          cards: [
            {
              id: Date.now().toString(),
              type: bankData.cardType,
              brand: bankData.brand,
              level: bankData.level,
              name: bankData.cardName,
              expiryDate: bankData.expiryDate,
              status: "active",
            },
          ],
        };

        await createMembership(membershipData);
        toast.success("Membresía bancaria creada exitosamente");
      } else {
        // Para otras membresías
        const selectedType = membershipTypes.find(
          (t) => t.id === formData.category
        );
        const membershipData = {
          name: selectedMembership || formData.name,
          category: formData.category,
          color: selectedType?.color || "#6B7280",
          cards: [],
        };

        await createMembership(membershipData);
        toast.success("Membresía agregada exitosamente");
      }

      router.push("/memberships");
    } catch (error) {
      console.error("Error agregando membresía:", error);
      toast.error("Error agregando membresía");
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center justify-between">
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

      <div className="px-4 py-4 pb-20">
        {!formData.category ? (
          /* Paso 1: Seleccionar tipo de membresía */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Nueva Membresía
              </h2>
              <p className="text-gray-600">
                Selecciona el tipo de membresía que deseas agregar
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {membershipTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      category: type.id,
                      color: type.color,
                    }));
                    if (type.id === "banco") {
                      setCurrentStep(1);
                    }
                  }}
                  className="p-6 border border-gray-200 rounded-xl text-left transition-all duration-200 hover:border-gray-300 hover:shadow-lg hover:scale-105 group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: type.color + "20" }}
                    >
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-500">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : isBank ? (
          /* Flujo especial para bancos */
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Agregar Tarjeta Bancaria
                </CardTitle>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 6) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Paso {currentStep} de 6
                </p>
              </CardHeader>
              <CardContent className="px-4">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Agregando nueva tarjeta bancaria
                      </h3>
                      <p className="text-sm text-blue-700">
                        Completa los datos de tu tarjeta paso a paso
                      </p>
                    </div>
                  </div>
                </div>

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
                              setBankData((prev) => ({
                                ...prev,
                                cardType: type,
                              }))
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
                        onChange={(e) => handleExpiryDateChange(e.target.value)}
                        maxLength={5}
                        className={`text-center text-lg ${
                          expiryError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                      />
                      {expiryError && (
                        <p className="text-sm text-red-600 mt-1">
                          {expiryError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Paso 6: Nombre */}
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
                  <div className="flex gap-2 pt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/memberships")}
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

                    {currentStep < 6 ? (
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
                        disabled={saving || !isStepComplete(6)}
                        className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {saving ? "Guardando..." : "Crear"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Vista previa para tarjetas de banco */}
            {bankData.bank && (
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
                        {bankData.bank ? `Banco ${bankData.bank}` : "Banco"} •{" "}
                        {bankData.cardType}
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      {bankData.expiryDate || "MM/AA"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Formulario para otras membresías */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl" style={{ color: formData.color }}>
                    {
                      membershipTypes.find((t) => t.id === formData.category)
                        ?.icon
                    }
                  </span>
                  Nueva Membresía -{" "}
                  {
                    membershipTypes.find((t) => t.id === formData.category)
                      ?.name
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="membership">Selecciona la membresía</Label>
                    <select
                      id="membership"
                      value={selectedMembership}
                      onChange={(e) => setSelectedMembership(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecciona una opción...</option>
                      {membershipOptions[
                        formData.category as keyof typeof membershipOptions
                      ]?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={!selectedMembership || saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? "Guardando..." : "Crear"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Vista previa */}
            {selectedMembership && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-xl p-6 text-white"
                    style={{
                      backgroundColor:
                        membershipTypes.find((t) => t.id === formData.category)
                          ?.color || "#6B7280",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg leading-tight">
                          {selectedMembership}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-white opacity-90 capitalize">
                            {
                              membershipTypes.find(
                                (t) => t.id === formData.category
                              )?.name
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="px-3 py-1 text-xs rounded-full font-medium bg-white bg-opacity-20 text-white">
                          Activa
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

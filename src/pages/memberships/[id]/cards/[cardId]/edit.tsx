import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Label } from "@/components/Share/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { Switch } from "@/components/Share/switch";
import {
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  Membership,
} from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import {
  getMembershipById,
  updateCardInMembership,
} from "@/lib/firebase/memberships";
import { validateAndFormatExpiryInput } from "@/lib/utils/expiryUtils";
import { ArrowLeft, CreditCard, Save } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EditCardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id, cardId } = router.query;
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expiryError, setExpiryError] = useState<string>("");

  const [cardData, setCardData] = useState({
    type: "",
    brand: "",
    level: "",
    name: "",
    expiryDate: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (id && cardId && typeof id === "string" && typeof cardId === "string") {
      loadMembershipAndCard(id, cardId);
    }
  }, [id, cardId]);

  const loadMembershipAndCard = async (
    membershipId: string,
    targetCardId: string
  ) => {
    try {
      setLoadingMembership(true);
      const membershipData = await getMembershipById(membershipId);

      const targetCard = membershipData.cards.find(
        (card: any) => card.id === targetCardId
      );

      if (!targetCard) {
        toast.error("Tarjeta no encontrada");
        router.push(`/memberships/${membershipId}`);
        return;
      }

      setMembership(membershipData);
      setCardData({
        type: targetCard.type || "",
        brand: targetCard.brand || "",
        level: targetCard.level || "",
        name: targetCard.name || "",
        expiryDate: targetCard.expiryDate || "",
        status: targetCard.status || "active",
      });
    } catch (error) {
      console.error("Error al cargar membresía:", error);
      toast.error("Error al cargar la membresía");
    } finally {
      setLoadingMembership(false);
    }
  };

  const handleSave = async () => {
    if (!membership || !cardId) return;

    if (expiryError) {
      toast.error("Por favor corrige la fecha de vencimiento");
      return;
    }

    try {
      setSaving(true);
      await updateCardInMembership(membership.id, cardId as string, cardData);
      toast.success("Tarjeta actualizada exitosamente");
      router.push(`/memberships/${membership.id}`);
    } catch (error) {
      console.error("Error al actualizar tarjeta:", error);
      toast.error("Error al actualizar la tarjeta");
    } finally {
      setSaving(false);
    }
  };

  const handleExpiryDateChange = (value: string) => {
    const result = validateAndFormatExpiryInput(value);
    setExpiryError(result.isValid ? "" : result.error || "");
    setCardData((prev) => ({ ...prev, expiryDate: result.formatted }));
  };

  const handleStatusToggle = (checked: boolean) => {
    setCardData((prev) => ({
      ...prev,
      status: checked ? "active" : "inactive",
    }));
  };

  if (loading || loadingMembership) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Membresía no encontrada
            </h1>
            <Button onClick={() => router.push("/memberships")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a membresías
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/memberships/${membership.id}`)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar Tarjeta
              </h1>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {/* Vista previa de la tarjeta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="relative rounded-2xl p-6 text-white mb-4 flex flex-col"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              }}
            >
              {/* Card Brand and Level */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold">
                  {cardData.brand || "**"}
                </span>
                {cardData.level && (
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                    {cardData.level}
                  </span>
                )}
              </div>

              {/* Card Number */}
              <div className="text-lg font-mono tracking-wider mb-4">
                **** **** **** ****
              </div>

              {/* Cardholder Name */}
              {cardData.name && (
                <div className="text-sm opacity-90 mb-2">{cardData.name}</div>
              )}

              {/* Card Type and Expiry Date */}
              <div className="flex justify-between items-center mt-auto">
                <div className="text-base">{cardData.type}</div>
                <div className="text-sm opacity-90">
                  {cardData.expiryDate || "MM/AA"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Tarjeta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Tarjeta</Label>
                <Select
                  key={`type-${cardData.type}`}
                  value={cardData.type}
                  onValueChange={(value) =>
                    setCardData({ ...cardData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
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
                <Label>Marca</Label>
                <Select
                  key={`brand-${cardData.brand}`}
                  value={cardData.brand}
                  onValueChange={(value) =>
                    setCardData({ ...cardData, brand: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
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

              <div>
                <Label>Nivel</Label>
                <Select
                  key={`level-${cardData.level}`}
                  value={cardData.level}
                  onValueChange={(value) =>
                    setCardData({ ...cardData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
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
            </div>

            {/* Estado de la tarjeta */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    Tarjeta activa
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    La tarjeta aparecerá en tus promociones
                  </p>
                </div>
                <Switch
                  checked={cardData.status === "active"}
                  onCheckedChange={handleStatusToggle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6 mb-20">
          <Button
            variant="outline"
            onClick={() => router.push(`/memberships/${membership.id}`)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

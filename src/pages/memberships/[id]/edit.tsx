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
import { CARD_BRANDS, CARD_LEVELS, Membership } from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteCardFromMembership,
  getMembershipById,
  updateMembership,
} from "@/lib/firebase/memberships";
import {
  getCardStatus,
  getCardStatusColor,
  getCardStatusText,
  isCardExpired,
  validateAndFormatExpiryInput,
} from "@/lib/utils/expiryUtils";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const CARD_TYPES: { value: "Crédito" | "Débito"; label: string }[] = [
  { value: "Crédito", label: "Crédito" },
  { value: "Débito", label: "Débito" },
];

export default function EditMembershipPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [expiryError, setExpiryError] = useState<string>("");
  const [newCard, setNewCard] = useState({
    type: "",
    brand: "",
    level: "",
    name: "",
    expiryDate: "",
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      loadMembership(id);
    }
  }, [id]);

  const loadMembership = async (membershipId: string) => {
    try {
      setLoadingMembership(true);
      const membershipData = await getMembershipById(membershipId);

      // Verificar y actualizar estado de tarjetas vencidas
      const updatedCards = ((membershipData as any).cards || []).map(
        (card: any) => ({
          ...card,
          status: getCardStatus(card),
        })
      );

      const updatedMembership = {
        ...membershipData,
        cards: updatedCards,
      } as Membership;

      setMembership(updatedMembership);
    } catch (error: any) {
      console.error("Error al cargar membresía:", error);
      toast.error("Error al cargar la membresía");
    } finally {
      setLoadingMembership(false);
    }
  };

  const handleSaveMembership = async () => {
    if (!membership) return;

    try {
      setSaving(true);
      // Normalizar el nombre si es un banco
      let membershipName = membership.name;
      if (
        membership.category === "banco" &&
        !membershipName.toLowerCase().startsWith("banco")
      ) {
        membershipName = `Banco ${membershipName}`;
      }

      await updateMembership(membership.id, {
        name: membershipName,
        status: membership.status,
        cards: membership.cards,
      });
      toast.success("Membresía actualizada exitosamente");
      router.push(`/memberships/${membership.id}`);
    } catch (error) {
      console.error("Error al actualizar membresía:", error);
      toast.error("Error al actualizar la membresía");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCard = async () => {
    if (!membership) return;

    if (!newCard.type || !newCard.brand || !newCard.level) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (expiryError) {
      toast.error("Por favor corrige la fecha de vencimiento");
      return;
    }

    const card = {
      id: Date.now().toString(),
      type: newCard.type as "Crédito" | "Débito",
      brand: newCard.brand as any,
      level: newCard.level as any,
      name: newCard.name || "",
      expiryDate: newCard.expiryDate || "",
      status: "active" as const,
    };

    const updatedCards = [...membership.cards, card];

    try {
      setSaving(true);

      // Normalizar el nombre si es un banco
      let membershipName = membership.name;
      if (
        membership.category === "banco" &&
        !membershipName.toLowerCase().startsWith("banco")
      ) {
        membershipName = `Banco ${membershipName}`;
      }

      // Actualizar el estado localmente primero
      setMembership({
        ...membership,
        cards: updatedCards,
      });

      // Guardar en Firebase
      await updateMembership(membership.id, {
        name: membershipName,
        status: membership.status,
        cards: updatedCards,
      });

      setNewCard({
        type: "",
        brand: "",
        level: "",
        name: "",
        expiryDate: "",
      });

      toast.success("Tarjeta agregada y guardada exitosamente");
    } catch (error) {
      console.error("Error al agregar tarjeta:", error);
      toast.error("Error al agregar la tarjeta");

      // Revertir el cambio local en caso de error
      setMembership({
        ...membership,
        cards: membership.cards,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCard = (cardId: string, field: string, value: string) => {
    if (!membership) return;

    const updatedCards = membership.cards.map((card) =>
      card.id === cardId ? { ...card, [field]: value } : card
    );

    setMembership({
      ...membership,
      cards: updatedCards,
    });
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!membership) {
      toast.error("No se pudo cargar la membresía");
      return;
    }

    // Encontrar la tarjeta para mostrar información
    const cardToDelete = membership.cards.find((card) => card.id === cardId);
    if (!cardToDelete) {
      toast.error("Tarjeta no encontrada");
      return;
    }

    // Confirmación de eliminación
    const cardInfo = `${cardToDelete.brand} ${cardToDelete.level || ""}`.trim();
    if (
      !confirm(`¿Estás seguro de que quieres eliminar la tarjeta ${cardInfo}?`)
    ) {
      return;
    }

    // Si es la última tarjeta, preguntar si eliminar toda la membresía
    if (membership.cards.length === 1) {
      const confirmDelete = confirm(
        "Esta es la última tarjeta de la membresía. ¿Quieres eliminar toda la membresía?"
      );

      if (!confirmDelete) {
        return; // Usuario canceló
      }
    }

    try {
      setSaving(true);
      const result = await deleteCardFromMembership(membership.id, cardId);

      if (result.membershipDeleted) {
        // La membresía fue eliminada completamente
        toast.success("Membresía eliminada exitosamente");
        router.push("/memberships");
      } else {
        // Solo se eliminó la tarjeta, actualizar la vista
        await loadMembership(membership.id);
        toast.success(result.message || "Tarjeta eliminada exitosamente");
      }
    } catch (error: any) {
      console.error("Error al eliminar tarjeta:", error);
      toast.error(
        "Error al eliminar la tarjeta: " +
          (error.message || "Error desconocido")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExpiryDateChange = (value: string) => {
    const result = validateAndFormatExpiryInput(value);
    setExpiryError(result.isValid ? "" : result.error || "");
    setNewCard((prev) => ({ ...prev, expiryDate: result.formatted }));
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
                Editar Membresía
              </h1>
              <p className="text-gray-600">
                Modifica la información de {membership.name}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMembership} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>

        {/* Información básica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la Membresía</Label>
              <Input
                id="name"
                value={membership.name}
                onChange={(e) =>
                  setMembership({ ...membership, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                key={`status-${membership.status}`}
                value={membership.status}
                onValueChange={(value: "active" | "inactive") =>
                  setMembership({ ...membership, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado">
                    {membership.status === "active"
                      ? "Activa"
                      : membership.status === "inactive"
                      ? "Inactiva"
                      : "Seleccionar estado"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agregar nueva tarjeta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Agregar Nueva Tarjeta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Tarjeta</Label>
                <Select
                  key={`type-${newCard.type}`}
                  value={newCard.type}
                  onValueChange={(value) =>
                    setNewCard({ ...newCard, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo">
                      {newCard.type
                        ? CARD_TYPES.find((t) => t.value === newCard.type)
                            ?.label
                        : "Seleccionar tipo"}
                    </SelectValue>
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
                  key={`brand-${newCard.brand}`}
                  value={newCard.brand}
                  onValueChange={(value) =>
                    setNewCard({ ...newCard, brand: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca">
                      {newCard.brand
                        ? CARD_BRANDS.find((b) => b.value === newCard.brand)
                            ?.label
                        : "Seleccionar marca"}
                    </SelectValue>
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
                  key={`level-${newCard.level}`}
                  value={newCard.level}
                  onValueChange={(value) =>
                    setNewCard({ ...newCard, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel">
                      {newCard.level
                        ? CARD_LEVELS.find((l) => l.value === newCard.level)
                            ?.label
                        : "Seleccionar nivel"}
                    </SelectValue>
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
                <Label>Fecha de Vencimiento</Label>
                <Input
                  placeholder="MM/AA"
                  value={newCard.expiryDate}
                  onChange={(e) => handleExpiryDateChange(e.target.value)}
                  className={
                    expiryError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {expiryError && (
                  <p className="text-sm text-red-600 mt-1">{expiryError}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Nombre en la Tarjeta (Opcional)</Label>
                <Input
                  placeholder="Nombre como aparece en la tarjeta"
                  value={newCard.name}
                  onChange={(e) =>
                    setNewCard({ ...newCard, name: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={handleAddCard} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Tarjeta
            </Button>
          </CardContent>
        </Card>

        {/* Lista de tarjetas existentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Tarjetas Existentes ({membership.cards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membership.cards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay tarjetas asociadas a esta membresía</p>
              </div>
            ) : (
              <div className="space-y-4">
                {membership.cards.map((card, index) => (
                  <div
                    key={card.id || index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          {card.brand} {card.level}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {card.type}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getCardStatusColor(
                            card
                          )}`}
                        >
                          {getCardStatusText(card)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Marca</Label>
                        <Select
                          key={`existing-brand-${card.id}-${card.brand}`}
                          value={card.brand}
                          onValueChange={(value) =>
                            handleEditCard(card.id, "brand", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar marca">
                              {card.brand
                                ? CARD_BRANDS.find(
                                    (b) => b.value === card.brand
                                  )?.label
                                : "Seleccionar marca"}
                            </SelectValue>
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
                        <Label className="text-xs text-gray-500">Nivel</Label>
                        <Select
                          key={`existing-level-${card.id}-${card.level}`}
                          value={card.level}
                          onValueChange={(value) =>
                            handleEditCard(card.id, "level", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel">
                              {card.level
                                ? CARD_LEVELS.find(
                                    (l) => l.value === card.level
                                  )?.label
                                : "Seleccionar nivel"}
                            </SelectValue>
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
                        <Label className="text-xs text-gray-500">
                          Fecha Vencimiento
                        </Label>
                        <Input
                          placeholder="MM/AA"
                          value={card.expiryDate || ""}
                          onChange={(e) => {
                            const result = validateAndFormatExpiryInput(
                              e.target.value
                            );
                            if (result.isValid) {
                              handleEditCard(
                                card.id,
                                "expiryDate",
                                result.formatted
                              );
                            }
                          }}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">Estado</Label>
                        <Select
                          key={`existing-status-${card.id}-${
                            card.status || "active"
                          }`}
                          value={card.status || "active"}
                          onValueChange={(value: "active" | "inactive") =>
                            handleEditCard(card.id, "status", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado">
                              {getCardStatusText(card)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="inactive">Inactiva</SelectItem>
                          </SelectContent>
                        </Select>
                        {isCardExpired(card.expiryDate) && (
                          <div className="text-xs text-red-600 mt-1">
                            Tarjeta vencida
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label className="text-xs text-gray-500">
                        Nombre en la Tarjeta
                      </Label>
                      <Input
                        placeholder="Nombre como aparece en la tarjeta"
                        value={card.name || ""}
                        onChange={(e) =>
                          handleEditCard(card.id, "name", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Espaciado adicional para separar del navbar */}
      <div className="h-8"></div>
    </div>
  );
}

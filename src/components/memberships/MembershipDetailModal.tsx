import { AlertTriangle, CreditCard, Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  CardLevel,
  Membership,
} from "../../constants/membership";
import { formatExpiryInput, validateExpiry } from "../../lib/card-utils";
import { Badge } from "../Share/badge";
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
import { Separator } from "../Share/separator";
import { Switch } from "../Share/switch";

interface MembershipDetailModalProps {
  membership: Membership | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (membershipId: string, data: Partial<Membership>) => Promise<void>;
  onDelete?: (membershipId: string) => Promise<void>;
  onAddCard?: (membershipId: string, cardData: Card) => Promise<void>;
  onUpdateCard?: (
    membershipId: string,
    cardId: string,
    cardData: Partial<Card>
  ) => Promise<void>;
  onDeleteCard?: (
    membershipId: string,
    cardId: string
  ) => Promise<{ membershipDeleted: boolean; message: string }>;
}

const MembershipDetailModal: React.FC<MembershipDetailModalProps> = ({
  membership,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para gestión de tarjetas
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardFormData, setCardFormData] = useState({
    type: "" as Card["type"],
    brand: "" as Card["brand"],
    level: "" as CardLevel,
    name: "",
    expiry: "",
  });

  const [localStatus, setLocalStatus] =
    useState<Membership["status"]>("active");
  const [localMembership, setLocalMembership] = useState<Membership | null>(
    membership
  );

  React.useEffect(() => {
    setLocalMembership(membership);
    if (membership) {
      setLocalStatus(membership.status);
    }
  }, [membership]);

  const handleDelete = async () => {
    if (!membership || !onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete(membership.id);
      onClose();
    } catch (error) {
      console.error("Error al eliminar membresía:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!membership || !onUpdate) return;
    const newStatus = localStatus === "active" ? "inactive" : "active";
    setLocalStatus(newStatus); // feedback inmediato
    try {
      await onUpdate(membership.id, { status: newStatus });
    } catch (error) {
      setLocalStatus(localStatus); // revertir si falla
      console.error("Error al cambiar estado:", error);
    }
  };

  // Funciones para gestión de tarjetas
  const handleAddCard = () => {
    setCardFormData({
      type: "" as Card["type"],
      brand: "" as Card["brand"],
      level: "" as CardLevel,
      name: "",
      expiry: "",
    });
    setShowAddCardModal(true);
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setCardFormData({
      type: card.type,
      brand: card.brand,
      level: card.level,
      name: card.name || "",
      expiry: card.expiry || "",
    });
    setShowEditCardModal(true);
  };

  const handleSaveCard = async () => {
    if (!localMembership) {
      toast.error("Error: No se encontró la membresía");
      return;
    }

    // Validar datos de la tarjeta
    const errors: string[] = [];

    if (!cardFormData.type) {
      errors.push("Debe seleccionar un tipo de tarjeta");
    }

    if (!cardFormData.brand) {
      errors.push("Debe seleccionar una marca de tarjeta");
    }

    if (!cardFormData.level) {
      errors.push("Debe seleccionar un nivel de tarjeta");
    }

    // Validar formato de fecha de vencimiento
    if (cardFormData.expiry && !validateExpiry(cardFormData.expiry)) {
      errors.push(
        "La fecha de vencimiento debe tener formato MM/YY y no puede ser una fecha pasada"
      );
    }

    // Verificar duplicados
    const isDuplicate = localMembership.cards.some(
      (card) =>
        card.type === cardFormData.type &&
        card.brand === cardFormData.brand &&
        card.level === cardFormData.level &&
        (!selectedCard || card.id !== selectedCard.id)
    );

    if (isDuplicate) {
      errors.push("Ya existe una tarjeta con estas características");
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    const newCard: Card = {
      id: Date.now().toString(),
      ...cardFormData,
    };

    // Actualización optimista
    setLocalMembership({
      ...localMembership,
      cards: [...localMembership.cards, newCard],
    });
    setShowAddCardModal(false);
    setShowEditCardModal(false);
    setSelectedCard(null);
    setCardFormData({
      type: "" as Card["type"],
      brand: "" as Card["brand"],
      level: "" as CardLevel,
      name: "",
      expiry: "",
    });

    try {
      if (showEditCardModal && selectedCard && onUpdateCard) {
        console.log("🔄 Actualizando tarjeta:", selectedCard.id, cardFormData);
        await onUpdateCard(localMembership.id, selectedCard.id, cardFormData);
        toast.success("Tarjeta actualizada correctamente");
        console.log("✅ Tarjeta actualizada exitosamente");
      } else if (showAddCardModal && onAddCard) {
        console.log("➕ Agregando nueva tarjeta:", newCard);
        await onAddCard(localMembership.id, newCard);
        toast.success("Tarjeta agregada correctamente");
        console.log("✅ Tarjeta agregada exitosamente");
      }
    } catch (error) {
      // Revertir actualización optimista en caso de error
      setLocalMembership(membership);
      console.error("❌ Error al guardar tarjeta:", error);
      toast.error("Error al guardar la tarjeta. Inténtalo de nuevo.");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!localMembership || !onDeleteCard) return;

    const remainingCards = localMembership.cards.filter(
      (card) => card.id !== cardId
    );
    const isLastCard = remainingCards.length === 0;
    const isBank = localMembership.category === "banco";

    console.log("🗑️ Eliminando tarjeta:", cardId);
    console.log("📊 Tarjetas restantes:", remainingCards.length);
    console.log("🏦 Es banco:", isBank);
    console.log("🔚 Es última tarjeta:", isLastCard);

    // Actualización optimista
    const prevCards = localMembership.cards;
    setLocalMembership({
      ...localMembership,
      cards: remainingCards,
    });

    try {
      const result = await onDeleteCard(localMembership.id, cardId);
      console.log("📋 Resultado de eliminación:", result);

      if (result.membershipDeleted) {
        // Si se eliminó la membresía completa, cerrar el modal
        toast.success(result.message);
        onClose(); // Cerrar el modal
      } else {
        // Si solo se eliminó la tarjeta, mostrar mensaje
        toast.success(result.message);
      }

      console.log("✅ Operación completada exitosamente");
    } catch (error) {
      // Revertir actualización optimista en caso de error
      setLocalMembership({ ...localMembership, cards: prevCards });
      console.error("❌ Error al eliminar tarjeta:", error);
      toast.error("Error al eliminar la tarjeta. Inténtalo de nuevo.");
    }
  };

  if (!localMembership) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {localMembership.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalle y acciones de la membresía seleccionada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información básica */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Categoría</span>
                <Badge
                  variant="outline"
                  className="capitalize text-gray-700 border-gray-300"
                >
                  {localMembership.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localStatus === "active"}
                    onCheckedChange={handleStatusToggle}
                  />
                  <Badge
                    variant={localStatus === "active" ? "default" : "secondary"}
                  >
                    {localStatus === "active" ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sección de tarjetas (solo para bancos) */}
            {localMembership.category === "banco" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2 text-gray-900">
                      <CreditCard className="h-4 w-4" />
                      Tarjetas asociadas
                    </h4>
                    {onAddCard && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddCard}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir
                      </Button>
                    )}
                  </div>

                  {localMembership.cards.length === 0 ? (
                    <p className="text-sm text-gray-700 text-center py-4">
                      No hay tarjetas asociadas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {localMembership.cards.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-800">
                              {card.type}
                            </p>
                            <p className="text-sm text-gray-700 font-medium">
                              {card.brand} {card.level}
                            </p>
                            {card.expiry && (
                              <p className="text-xs text-gray-500 mt-1">
                                Vence: {card.expiry}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCard(card)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-gray-600 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Acciones */}
            <Separator />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>

            {/* Confirmación de eliminación */}
            {showDeleteConfirm && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">
                      ¿Eliminar membresía?
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Esta acción no se puede deshacer. Se eliminarán todas las
                      tarjetas asociadas.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar/editar tarjeta */}
      {(showAddCardModal || showEditCardModal) && (
        <Dialog
          open={showAddCardModal || showEditCardModal}
          onOpenChange={() => {
            setShowAddCardModal(false);
            setShowEditCardModal(false);
            setSelectedCard(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {showAddCardModal ? "Agregar Tarjeta" : "Editar Tarjeta"}
              </DialogTitle>
              <DialogDescription>
                {showAddCardModal
                  ? "Agrega una nueva tarjeta a tu membresía"
                  : "Modifica los datos de la tarjeta"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cardType">Tipo</Label>
                <select
                  id="cardType"
                  value={cardFormData.type}
                  onChange={(e) =>
                    setCardFormData({
                      ...cardFormData,
                      type: e.target.value as Card["type"],
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>
                    Selecciona el tipo
                  </option>
                  {CARD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="cardBrand">Marca</Label>
                <select
                  id="cardBrand"
                  value={cardFormData.brand}
                  onChange={(e) =>
                    setCardFormData({
                      ...cardFormData,
                      brand: e.target.value as Card["brand"],
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>
                    Selecciona la marca
                  </option>
                  {CARD_BRANDS.map((brand) => (
                    <option key={brand.value} value={brand.value}>
                      {brand.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="cardLevel">Nivel</Label>
                <select
                  id="cardLevel"
                  value={cardFormData.level}
                  onChange={(e) =>
                    setCardFormData({
                      ...cardFormData,
                      level: e.target.value as CardLevel,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled className="text-gray-600">
                    Selecciona un nivel
                  </option>
                  {CARD_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="cardName">Nombre (opcional)</Label>
                <Input
                  id="cardName"
                  value={cardFormData.name}
                  onChange={(e) =>
                    setCardFormData({ ...cardFormData, name: e.target.value })
                  }
                  placeholder="Ej: Mi tarjeta principal"
                />
              </div>

              <div>
                <Label htmlFor="cardExpiry">Vencimiento (opcional)</Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  value={cardFormData.expiry}
                  onChange={(e) => {
                    const formatted = formatExpiryInput(e.target.value);
                    setCardFormData({ ...cardFormData, expiry: formatted });
                  }}
                  maxLength={5}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveCard}
                  className="flex-1"
                  disabled={
                    !cardFormData.type ||
                    !cardFormData.brand ||
                    !cardFormData.level
                  }
                >
                  {showAddCardModal ? "Agregar" : "Guardar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddCardModal(false);
                    setShowEditCardModal(false);
                    setSelectedCard(null);
                  }}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MembershipDetailModal;

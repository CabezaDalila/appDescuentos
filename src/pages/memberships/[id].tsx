import { Button } from "@/components/Share/button";
import { Switch } from "@/components/Share/switch";
import { Card, Membership } from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase/firebase";
import {
    deleteCardFromMembership,
    deleteMembership,
    getMembershipById,
} from "@/lib/firebase/memberships";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, Eye, Pencil, Trash2, Wifi } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MembershipDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadMembership(id);
    }
  }, [id]);

  const loadMembership = async (membershipId: string) => {
    try {
      setLoadingMembership(true);
      const membershipData = await getMembershipById(membershipId);
      setMembership(membershipData);
    } catch (error) {
      console.error("Error al cargar membresía:", error);
      toast.error("Error al cargar la membresía");
    } finally {
      setLoadingMembership(false);
    }
  };

  const getCardColor = (name: string, category: Membership["category"]) => {
    const colorMap: { [key: string]: string } = {
      // Bancos
      "banco galicia": "bg-orange-500",
      "banco santander": "bg-red-600",
      "banco nación": "bg-blue-700",
      "banco provincia": "bg-green-600",
      "banco ciudad": "bg-blue-500",
      "banco macro": "bg-yellow-600",
      "banco itaú": "bg-red-500",
      "banco hsbc": "bg-red-700",
      "banco bbva": "bg-blue-600",
      "banco supervielle": "bg-green-700",
    };

    const lowerName = name.toLowerCase();
    return colorMap[lowerName] || "bg-blue-500";
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = () => {
    if (membership?.status === "active")
      return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusText = () => {
    if (membership?.status === "active") return "Activa";
    return "Inactiva";
  };

  const getCategoryLabel = () => {
    if (!membership) return "";

    switch (membership.category) {
      case "banco":
        return "Bancos";
      case "club":
        return "Clubes";
      case "salud":
        return "Salud";
      case "educacion":
        return "Educación";
      case "seguro":
        return "Seguros";
      case "telecomunicacion":
        return "Telecomunicaciones";
      default:
        return membership.category;
    }
  };

  const handleToggleCardStatus = async (
    cardId: string,
    currentStatus: Card["status"]
  ) => {
    if (!membership) return;

    const newStatus: Card["status"] =
      currentStatus === "active" ? "inactive" : "active";

    try {
      // Actualizar el estado de la tarjeta
      const updatedCards: Card[] = membership.cards.map((card) =>
        card.id === cardId ? { ...card, status: newStatus } : card
      );

      // Determinar el nuevo estado de la membresía basado en las tarjetas
      const newMembershipStatus = getMembershipStatusFromCards(updatedCards);

      // Actualizar el estado localmente primero
      setMembership({
        ...membership,
        status: newMembershipStatus,
        cards: updatedCards,
      });

      // Actualizar en Firebase
      await updateMembershipStatus(
        membership.id,
        newMembershipStatus,
        updatedCards
      );
    } catch (error) {
      console.error("Error al cambiar estado de tarjeta:", error);
      toast.error("Error al cambiar el estado de la tarjeta");

      // Revertir el cambio local en caso de error
      const revertedCards = membership.cards.map((card) =>
        card.id === cardId ? { ...card, status: currentStatus } : card
      );
      setMembership({
        ...membership,
        cards: revertedCards,
      });
    }
  };

  // Función para determinar el estado de la membresía basado en las tarjetas
  const getMembershipStatusFromCards = (cards: Card[]) => {
    if (cards.length === 0) return "inactive";
    return cards.some((card) => card.status === "active")
      ? "active"
      : "inactive";
  };

  // Función para actualizar el estado de la membresía en Firebase
  const updateMembershipStatus = async (
    membershipId: string,
    newStatus: Membership["status"],
    cards?: Card[]
  ) => {
    const membershipRef = doc(
      db,
      `users/${user?.uid}/memberships/${membershipId}`
    );

    const updateData: any = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (cards) {
      updateData.cards = cards;
    }

    await updateDoc(membershipRef, updateData);
  };

  const handleMembershipStatusToggle = async () => {
    if (!membership) return;

    const newStatus: Membership["status"] =
      membership.status === "active" ? "inactive" : "active";

    try {
      // Si se está desactivando la membresía, también desactivar todas las tarjetas
      const updatedCards: Card[] =
        newStatus === "inactive"
          ? membership.cards.map((card) => ({
              ...card,
              status: "inactive" as Card["status"],
            }))
          : membership.cards; // Si se activa, mantener el estado actual de las tarjetas

      // Actualizar el estado localmente primero
      setMembership({
        ...membership,
        status: newStatus,
        cards: updatedCards,
      });

      // Actualizar en Firebase
      await updateMembershipStatus(membership.id, newStatus, updatedCards);
    } catch (error) {
      console.error("Error al cambiar estado de membresía:", error);
      toast.error("Error al cambiar el estado de la membresía");

      // Revertir el cambio local en caso de error
      setMembership({
        ...membership,
        status: membership.status,
        cards: membership.cards,
      });
    }
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
    } catch (error) {
      console.error("Error al eliminar tarjeta:", error);
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error("Error al eliminar la tarjeta: " + message);
    }
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
      <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={() => router.push("/memberships")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1 mx-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getCardColor(
                  membership.name,
                  membership.category
                )}`}
              >
                {getInitials(membership.name)}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {membership.name}
                </h1>
                <p className="text-gray-600 text-xs">
                  Gestiona tu membresía y tarjetas asociadas
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/memberships")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-lg font-bold text-gray-600">×</span>
          </button>
        </div>

        {/* Información de la membresía */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">Estado</span>
            <button
              onClick={handleMembershipStatusToggle}
              className={`px-4 py-2 text-sm rounded-full font-semibold border transition-colors hover:opacity-80 ${getStatusColor()}`}
            >
              {membership.status === "active" ? "Activa" : "Inactiva"}
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-900 font-medium">Categoría</span>
            <span className="px-4 py-2 text-sm rounded-full font-medium bg-white border border-gray-200 text-gray-900">
              {getCategoryLabel()}
            </span>
          </div>
        </div>

        {/* Tarjetas */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Tarjetas</h2>
            {membership.category === "banco" && (
              <button
                onClick={() =>
                  router.push(`/memberships/${membership.id}/add-card`)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                Añadir
              </button>
            )}
          </div>

          {membership.cards.length === 0 ? (
            <div className="space-y-4">
              {/* Tarjeta placeholder */}
              <div
                className="relative rounded-2xl p-6 text-white mb-0 z-0 flex flex-col"
                style={{
                  backgroundColor: membership.color || "#6B7280",
                }}
              >
                {membership.category === "banco" ? (
                  // Tarjeta bancaria completa
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {membership.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {membership.name}
                          </h3>
                          <p className="text-sm opacity-90">
                            {getCategoryLabel()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xl font-mono tracking-wider mb-2">
                        •••• •••• •••• ••••
                      </div>
                      <div className="text-sm opacity-90">Tarjeta bancaria</div>
                    </div>
                  </>
                ) : (
                  // Membresía simple (solo nombre)
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {membership.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{membership.name}</h3>
                        <p className="text-sm opacity-90">
                          {getCategoryLabel()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje informativo solo para bancos */}
              {membership.category === "banco" && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">
                    Agrega tu primera tarjeta para comenzar
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {membership.cards.map((card, index) => (
                <div key={card.id || index} className="mb-6">
                  {/* Card Visual */}
                  <div
                    className="relative rounded-2xl p-6 text-white mb-0 z-0 flex flex-col"
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    }}
                  >
                    {/* Contactless Icon */}
                    <div className="absolute top-4 right-4">
                      <Wifi className="h-5 w-5 text-white opacity-80" />
                    </div>

                    {/* Eye Icon */}
                    <div className="absolute top-12 right-4">
                      <Eye className="h-4 w-4 text-white opacity-80" />
                    </div>

                    {/* Card Brand and Level */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold">
                        {card.brand || "**"}
                      </span>
                      {card.level && (
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                          {card.level}
                        </span>
                      )}
                    </div>

                    {/* Card Number */}
                    <div className="text-lg font-mono tracking-wider mb-4">
                      **** **** **** ****
                    </div>

                    {/* Cardholder Name */}
                    {card.name && (
                      <div className="text-sm opacity-90 mb-2">{card.name}</div>
                    )}

                    {/* Card Type and Expiry Date */}
                    <div className="flex justify-between items-center mt-auto">
                      <div className="text-base">{card.type}</div>
                      {card.expiryDate && (
                        <div className="text-sm opacity-90">
                          {card.expiryDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center justify-between -mt-3 relative z-10">
                    {/* Switch de estado */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {card.status === "active" ? "Activa" : "Inactiva"}
                      </span>
                      <Switch
                        checked={card.status === "active"}
                        onCheckedChange={() =>
                          handleToggleCardStatus(
                            card.id || "",
                            card.status || "active"
                          )
                        }
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/memberships/${membership.id}/cards/${card.id}/edit`
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Editar tarjeta"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id || "")}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones de la membresía */}
        <div className="p-4 space-y-3 mt-8 pb-6">
          <button
            onClick={async () => {
              if (
                confirm("¿Estás seguro de que quieres eliminar esta membresía?")
              ) {
                try {
                  await deleteMembership(membership.id);
                  toast.success("Membresía eliminada exitosamente");
                  router.push("/memberships");
                } catch (error) {
                  console.error("Error al eliminar membresía:", error);
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Error desconocido";
                  toast.error("Error al eliminar la membresía: " + message);
                }
              }
            }}
            className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
            <span className="text-red-600 font-medium">Eliminar membresía</span>
          </button>
        </div>
      </div>
    </div>
  );
}

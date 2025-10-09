import { useAuth } from "@/hooks/useAuth";
import {
  approveDiscount,
  getDiscountById,
  getPendingDiscounts,
  rejectDiscount,
} from "@/lib/discounts";
import { Discount } from "@/types/discount";
import { validateDiscount } from "@/utils/validation/discountValidation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface DiscountApprovalManagerProps {
  className?: string;
}

export function DiscountApprovalManager({
  className,
}: DiscountApprovalManagerProps) {
  const [pendingDiscounts, setPendingDiscounts] = useState<Discount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Partial<Discount>>({});

  const { user } = useAuth();

  useEffect(() => {
    loadPendingDiscounts();
  }, []);

  const loadPendingDiscounts = async () => {
    try {
      setLoading(true);
      const discounts = await getPendingDiscounts();
      setPendingDiscounts(discounts);
    } catch (error) {
      console.error("Error cargando descuentos pendientes:", error);
      toast.error("Error al cargar descuentos pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDiscount = async (discountId: string) => {
    try {
      const discount = await getDiscountById(discountId);
      if (discount) {
        setSelectedDiscount(discount);
        setEditingDiscount(discount);
        setValidationErrors([]);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error obteniendo descuento:", error);
      toast.error("Error al obtener descuento");
    }
  };

  const validateCurrentDiscount = async () => {
    if (!editingDiscount) return false;

    // Crear un objeto con las propiedades requeridas para la validación
    const discountForValidation = {
      title: editingDiscount.title || editingDiscount.name || "",
      description: editingDiscount.description || "",
      category: editingDiscount.category || "",
      discountPercentage: editingDiscount.discountPercentage,
      discountAmount: editingDiscount.discountAmount,
      validUntil: editingDiscount.validUntil,
    };

    const validation = await validateDiscount(discountForValidation);
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleApprove = async () => {
    if (!selectedDiscount || !user?.uid) return;

    const isValid = await validateCurrentDiscount();
    if (!isValid) {
      toast.error(
        "El descuento tiene errores de validación. Revísalos antes de aprobar."
      );
      return;
    }

    try {
      setApproving(true);
      await approveDiscount(selectedDiscount.id, user.uid);
      toast.success("Descuento aprobado correctamente");
      setIsModalOpen(false);
      setSelectedDiscount(null);
      loadPendingDiscounts();
    } catch (error) {
      console.error("Error aprobando descuento:", error);
      toast.error("Error al aprobar descuento");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDiscount || !user?.uid || !rejectionReason.trim()) {
      toast.error("Debes especificar una razón para el rechazo");
      return;
    }

    try {
      setApproving(true);
      await rejectDiscount(
        selectedDiscount.id,
        user.uid,
        rejectionReason.trim()
      );
      toast.success("Descuento rechazado correctamente");
      setIsModalOpen(false);
      setSelectedDiscount(null);
      setRejectionReason("");
      loadPendingDiscounts();
    } catch (error) {
      console.error("Error rechazando descuento:", error);
      toast.error("Error al rechazar descuento");
    } finally {
      setApproving(false);
    }
  };

  const handleEditField = (
    field: keyof Discount,
    value: string | number | Date | undefined
  ) => {
    setEditingDiscount((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "No especificado";
    return new Date(date).toLocaleDateString("es-ES");
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando descuentos pendientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de Aprobación de Descuentos
        </h2>
        <div className="text-sm text-gray-600">
          {pendingDiscounts.length} descuentos pendientes
        </div>
      </div>

      {pendingDiscounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg">
            No hay descuentos pendientes de aprobación
          </div>
          <div className="text-gray-600 text-sm mt-2">
            Los descuentos de scraping aparecerán aquí cuando se ejecuten los
            scripts
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingDiscounts.map((discount) => (
            <div
              key={discount.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectDiscount(discount.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {discount.name || discount.title}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Categoría:</span>
                      <div className="font-medium">{discount.category}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Origen:</span>
                      <div className="font-medium">
                        {discount.origin || "No especificado"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Descuento:</span>
                      <div className="font-medium">
                        {discount.discountPercentage
                          ? `${discount.discountPercentage}%`
                          : discount.discountAmount
                          ? `$${discount.discountAmount}`
                          : "No especificado"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Válido hasta:</span>
                      <div className="font-medium">
                        {formatDate(discount.validUntil)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600">Descripción:</span>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {discount.description || "Sin descripción"}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Pendiente
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de revisión */}
      {isModalOpen && selectedDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Revisar Descuento
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-600 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Errores de validación */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">
                    Errores de validación:
                  </h4>
                  <ul className="list-disc list-inside text-red-700 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={editingDiscount.name || ""}
                      onChange={(e) => handleEditField("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={editingDiscount.title || ""}
                      onChange={(e) => handleEditField("title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={editingDiscount.category || ""}
                      onChange={(e) =>
                        handleEditField("category", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      <option value="banco">Banco</option>
                      <option value="club">Club</option>
                      <option value="salud">Salud</option>
                      <option value="educacion">Educación</option>
                      <option value="seguro">Seguro</option>
                      <option value="telecomunicacion">Telecomunicación</option>
                      <option value="gastronomia">Gastronomía</option>
                      <option value="fashion">Moda</option>
                      <option value="beauty">Belleza</option>
                      <option value="home">Hogar</option>
                      <option value="automotive">Automotriz</option>
                      <option value="entertainment">Entretenimiento</option>
                      <option value="sports">Deportes</option>
                      <option value="technology">Tecnología</option>
                      <option value="food">Comida</option>
                      <option value="health">Salud</option>
                      <option value="education">Educación</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origen *
                    </label>
                    <input
                      type="text"
                      value={editingDiscount.origin || ""}
                      onChange={(e) =>
                        handleEditField("origin", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Información de descuento */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje de descuento
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingDiscount.discountPercentage || ""}
                      onChange={(e) =>
                        handleEditField(
                          "discountPercentage",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto de descuento
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingDiscount.discountAmount || ""}
                      onChange={(e) =>
                        handleEditField(
                          "discountAmount",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Válido hasta *
                    </label>
                    <input
                      type="date"
                      value={
                        editingDiscount.validUntil
                          ? new Date(editingDiscount.validUntil)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleEditField(
                          "validUntil",
                          e.target.value ? new Date(e.target.value) : undefined
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de imagen
                    </label>
                    <input
                      type="url"
                      value={editingDiscount.imageUrl || ""}
                      onChange={(e) =>
                        handleEditField("imageUrl", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={editingDiscount.description || ""}
                  onChange={(e) =>
                    handleEditField("description", e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Términos */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos y condiciones
                </label>
                <textarea
                  value={editingDiscount.terms || ""}
                  onChange={(e) => handleEditField("terms", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Razón de rechazo */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón del rechazo (si aplica)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="Especifica la razón del rechazo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={approving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={approving || !rejectionReason.trim()}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approving ? "Rechazando..." : "Rechazar"}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approving ? "Aprobando..." : "Aprobar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

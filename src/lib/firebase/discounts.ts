import { collection, db, getDocs } from "@/lib/firebase";
import { getImageByCategory } from "@/lib/image-categories";
import { Discount } from "@/types/discount";
import { Timestamp } from "firebase/firestore";

interface FirestoreDiscount {
  name: string;
  description?: string;
  category?: string;
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
  image?: string; // Agregado para compatibilidad
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: "active" | "inactive" | "expired";
  title?: string;
  origin?: string;
  type?: string;
  expirationDate?: Timestamp;
  descripcion?: string; // Agregado para compatibilidad con datos existentes
}

// Obtener todos los descuentos
export const getDiscounts = async (): Promise<Discount[]> => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));
    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreDiscount;
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.() ||
          (data.createdAt ? new Date(data.createdAt) : null) ||
          new Date(),
        updatedAt:
          data.updatedAt?.toDate?.() ||
          (data.updatedAt ? new Date(data.updatedAt) : null) ||
          new Date(),
        validUntil:
          data.validUntil?.toDate?.() ||
          (data.validUntil ? new Date(data.validUntil) : null) ||
          new Date(),
      } as Discount;
    });
  } catch (error) {
    console.error("Error al obtener descuentos:", error);
    throw error;
  }
};

// Obtener descuentos para la página principal
export const getHomePageDiscounts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));
    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as FirestoreDiscount;

        // Mapear campos de diferentes estructuras
        const title = data.title || data.name || "Sin título";
        const category = data.category || "Sin categoría";
        const discountPercentage = data.discountPercentage
          ? `${data.discountPercentage}%`
          : "Sin descuento";

        // Lógica simplificada para imagen por defecto usando el nuevo sistema
        const image =
          data.imageUrl?.trim() ||
          data.image?.trim() ||
          getImageByCategory(data.category);

        const expiration =
          data.validUntil?.toDate?.() ||
          data.expirationDate?.toDate?.() ||
          (data.validUntil ? new Date(data.validUntil) : null) ||
          (data.expirationDate ? new Date(data.expirationDate) : null) ||
          new Date();

        return {
          id: doc.id,
          title,
          image,
          category,
          discountPercentage,
          points: 6, // Valor por defecto
          distance: "1.2km", // Valor por defecto
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
        };
      })
      .filter((discount) => discount.status === "active"); // Solo descuentos activos
  } catch (error) {
    console.error(
      "Error al obtener descuentos para la página principal:",
      error
    );
    // Retornar descuentos por defecto en caso de error
    return [
      {
        id: "default-1",
        title: "Descuentos disponibles",
        image: "/primary_image.jpg",
        category: "General",
        discountPercentage: "Cargando...",
        points: 6,
        distance: "1.2km",
        expiration: "Próximamente",
        description: "Cargando descuentos desde la base de datos...",
        origin: "Sistema",
        status: "active",
      },
    ];
  }
};

// Obtener descuentos por término de búsqueda
export const getDiscountsBySearch = async (
  searchTerm: string
): Promise<Discount[]> => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));
    const all = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreDiscount;
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.() ||
          (data.createdAt ? new Date(data.createdAt) : null) ||
          new Date(),
        updatedAt:
          data.updatedAt?.toDate?.() ||
          (data.updatedAt ? new Date(data.updatedAt) : null) ||
          new Date(),
        validUntil:
          data.validUntil?.toDate?.() ||
          (data.validUntil ? new Date(data.validUntil) : null) ||
          new Date(),
      } as Discount;
    });

    if (!searchTerm) return all;

    const term = searchTerm.toLowerCase();
    return all.filter(
      (d: Discount) =>
        (d.name || "").toLowerCase().includes(term) ||
        (d.description || "").toLowerCase().includes(term) ||
        (d.category || "").toLowerCase().includes(term)
    );
  } catch (error) {
    console.error("Error al buscar descuentos:", error);
    throw error;
  }
};

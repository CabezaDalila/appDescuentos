import { db } from "@/lib/firebase/firebase";
import { Discount } from "@/types/discount";
import { getImageByCategory } from "@/utils/category-mapping";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

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
  approvalStatus?: "pending" | "approved" | "rejected"; // Nuevo campo
  reviewedBy?: string; // ID del admin que revisó
  reviewedAt?: Timestamp; // Fecha de revisión
  rejectionReason?: string; // Razón del rechazo
  source?: "manual" | "scraping"; // Origen del descuento
  isVisible?: boolean; // Campo para controlar visibilidad
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
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        validUntil: data.validUntil?.toDate?.() || new Date(),
      } as Discount;
    });
  } catch (error) {
    console.error("Error al obtener descuentos:", error);
    throw error;
  }
};

// Obtener descuentos para la página principal (solo aprobados)
export const getHomePageDiscounts = async () => {
  try {
    const q = query(
      collection(db, "discounts"),
      where("approvalStatus", "==", "approved"),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(q);
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
          isVisible: data.isVisible ?? true, // Incluir campo de visibilidad
        };
      })
      .filter((discount) => {
        // Solo descuentos activos y visibles
        return discount.status === "active" && discount.isVisible !== false;
      });
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

// Obtener descuentos por término de búsqueda (solo aprobados)
export const getDiscountsBySearch = async (
  searchTerm: string
): Promise<Discount[]> => {
  try {
    const q = query(
      collection(db, "discounts"),
      where("approvalStatus", "==", "approved"),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(q);
    const all = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreDiscount;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        validUntil: data.validUntil?.toDate?.() || new Date(),
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

// ===== FUNCIONES PARA GESTIÓN DE APROBACIÓN =====

// Crear un descuento desde scraping (pendiente de aprobación)
export const createScrapedDiscount = async (
  discountData: Partial<Discount>
) => {
  try {
    const docRef = await addDoc(collection(db, "discounts"), {
      ...discountData,
      approvalStatus: "pending",
      source: "scraping",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "active",
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear descuento desde scraping:", error);
    throw error;
  }
};

// Obtener descuentos pendientes de aprobación
export const getPendingDiscounts = async (): Promise<Discount[]> => {
  try {
    const q = query(
      collection(db, "discounts"),
      where("approvalStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreDiscount;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        validUntil: data.validUntil?.toDate?.() || new Date(),
        approvalStatus: data.approvalStatus || "pending",
        source: data.source || "scraping",
      } as Discount;
    });
  } catch (error) {
    console.error("Error al obtener descuentos pendientes:", error);
    throw error;
  }
};

// Aprobar un descuento
export const approveDiscount = async (
  discountId: string,
  reviewedBy: string
): Promise<void> => {
  try {
    const docRef = doc(db, "discounts", discountId);
    await updateDoc(docRef, {
      approvalStatus: "approved",
      reviewedBy,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error al aprobar descuento:", error);
    throw error;
  }
};

// Rechazar un descuento
export const rejectDiscount = async (
  discountId: string,
  reviewedBy: string,
  rejectionReason: string
): Promise<void> => {
  try {
    const docRef = doc(db, "discounts", discountId);
    await updateDoc(docRef, {
      approvalStatus: "rejected",
      reviewedBy,
      reviewedAt: Timestamp.now(),
      rejectionReason,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error al rechazar descuento:", error);
    throw error;
  }
};

// Obtener descuentos aprobados para mostrar a usuarios
export const getApprovedDiscounts = async (): Promise<Discount[]> => {
  try {
    const q = query(
      collection(db, "discounts"),
      where("approvalStatus", "==", "approved"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as FirestoreDiscount;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          validUntil: data.validUntil?.toDate?.() || new Date(),
          approvalStatus: data.approvalStatus || "approved",
          source: data.source || "scraping",
        } as Discount;
      })
      .filter((discount) => {
        // Filtrar por visibilidad - solo mostrar descuentos visibles
        return discount.isVisible !== false; // true o undefined se consideran visibles
      });
  } catch (error) {
    console.error("Error al obtener descuentos aprobados:", error);
    throw error;
  }
};

// Obtener un descuento por ID
export const getDiscountById = async (
  discountId: string
): Promise<Discount | null> => {
  try {
    const docRef = doc(db, "discounts", discountId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FirestoreDiscount;
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        validUntil: data.validUntil?.toDate?.() || new Date(),
        approvalStatus: data.approvalStatus || "pending",
        source: data.source || "scraping",
      } as Discount;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener descuento por ID:", error);
    throw error;
  }
};

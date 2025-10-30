import { db } from "@/lib/firebase/firebase";
import type { UserCredential } from "@/types/credentials";
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
  bancos?: string[];
  // Campos para matching con membresías y credenciales del usuario
  availableMemberships?: string[]; // ["Club Despegar", "Banco Galicia"]
  availableCredentials?: UserCredential[];

  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
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

// Tipo específico para los descuentos de la página de inicio
interface HomePageDiscount {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  points: number;
  distance: string;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Obtener descuentos para la página principal (solo aprobados)
export const getHomePageDiscounts = async (): Promise<HomePageDiscount[]> => {
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
          distance: data.location ? "Calculando..." : "Sin ubicación", // Calcular si tiene ubicación
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
          isVisible: data.isVisible ?? true, // Incluir campo de visibilidad
          location: data.location, // Incluir ubicación para el cálculo
        } as HomePageDiscount;
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
        status: "active" as const,
        isVisible: true,
      },
    ] as HomePageDiscount[];
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

    // Normalizador: minúsculas y sin tildes
    const normalize = (v: unknown) =>
      (typeof v === "string" ? v : "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}+/gu, "");

    const term = normalize(searchTerm);
    type ExtendedDiscount = Discount & {
      title?: string;
      descripcion?: string;
      origin?: string;
      type?: string;
    };

    return all.filter((d: Discount) => {
      const e = d as ExtendedDiscount;
      const haystack = [
        normalize(e.title),
        normalize(e.name),
        normalize(e.description),
        normalize(e.descripcion),
        normalize(e.category),
        normalize(e.origin),
        normalize(e.type),
      ];
      return haystack.some((field) => field.includes(term));
    });
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
      where("approvalStatus", "==", "pending")
    );

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => {
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
    // Ordenar por createdAt desc en cliente
    items.sort(
      (a, b) =>
        (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
    );
    return items;
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

// Obtener descuentos personalizados basados en las membresías y credenciales del usuario
export const getPersonalizedDiscounts = async (
  userMemberships: string[],
  userCredentials: UserCredential[]
): Promise<HomePageDiscount[]> => {
  try {
    // Si no hay membresías ni credenciales, retornar array vacío
    if (
      (!userMemberships || userMemberships.length === 0) &&
      (!userCredentials || userCredentials.length === 0)
    ) {
      return [];
    }

    // Listas ya tipadas y consistentes (provenientes de selects)
    const userMembershipsClean = userMemberships.filter(
      (m) => typeof m === "string" && m.trim().length > 0
    );

    // Función helper para verificar si hay match de membresía
    const hasMembershipMatch = (discountMembership: string): boolean => {
      const result = userMembershipsClean.includes(discountMembership);
      // no logs aquí; se loguea un resumen al final
      return result;
    };

    // Función helper para verificar si hay match ESTRICTO de credencial
    // Debe coincidir: bank, type, brand y level
    const hasCredentialMatch = (discountCred: {
      bank: string;
      type: string;
      brand: string;
      level: string;
    }): boolean => {
      const result = userCredentials.some((userCred) => {
        const matches =
          discountCred.bank === userCred.bank &&
          discountCred.type === userCred.type &&
          discountCred.brand === userCred.brand &&
          discountCred.level === userCred.level;
        // no logs aquí; se loguea un resumen al final
        return matches;
      });
      return result;
    };

    // Obtener todos los descuentos aprobados y activos
    const q = query(
      collection(db, "discounts"),
      where("approvalStatus", "==", "approved"),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(q);

    const allDiscounts = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreDiscount;
      return {
        id: doc.id,
        data,
      };
    });

    // Filtrar descuentos que coincidan con las membresías o credenciales del usuario
    const matchedDiscounts = allDiscounts.filter(({ data }) => {
      // Verificar si availableMemberships coincide con alguna membresía del usuario
      if (
        data.availableMemberships &&
        Array.isArray(data.availableMemberships) &&
        data.availableMemberships.length > 0
      ) {
        const matchFound = data.availableMemberships.some(
          (availableMembership) => {
            return hasMembershipMatch(availableMembership);
          }
        );
        if (matchFound) {
          return true;
        }
      }

      // Verificar si availableCredentials coincide EXACTAMENTE con credenciales del usuario
      // MATCH ESTRICTO: bank, type, brand y level deben ser iguales
      if (
        data.availableCredentials &&
        Array.isArray(data.availableCredentials) &&
        data.availableCredentials.length > 0
      ) {
        const matchFound = data.availableCredentials.some((discountCred) => {
          return hasCredentialMatch(discountCred);
        });
        if (matchFound) {
          return true;
        }
      }

      return false;
    });

    // Log único: mostrar cuáles matchearon (id y título)
    const matchedSummary = matchedDiscounts.map(({ data }) => ({
      title: data.title || data.name || "Sin título",
    }));
    console.log("[PersonalizedOffers] Matched:", matchedSummary);

    // Convertir a formato HomePageDiscount y limitar resultados
    return matchedDiscounts
      .slice(0, 10) // Limitar a máximo 10 descuentos
      .map(({ id, data }) => {
        const title = data.title || data.name || "Sin título";
        const category = data.category || "Sin categoría";
        const discountPercentage = data.discountPercentage
          ? `${data.discountPercentage}%`
          : "Sin descuento";

        const image =
          data.imageUrl?.trim() ||
          data.image?.trim() ||
          getImageByCategory(data.category);

        const expiration =
          data.validUntil?.toDate?.() ||
          data.expirationDate?.toDate?.() ||
          new Date();

        return {
          id,
          title,
          image,
          category,
          discountPercentage,
          points: 6,
          distance: "1.2km",
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
          isVisible: data.isVisible ?? true,
        } as HomePageDiscount;
      });
  } catch (error) {
    console.error("Error al obtener descuentos personalizados:", error);
    return [];
  }
};

// Obtener descuentos cercanos a una ubicación específica (versión gratuita)
export const getNearbyDiscounts = async (
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number = 1.5
): Promise<HomePageDiscount[]> => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));
    const nearbyDiscounts: HomePageDiscount[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as FirestoreDiscount;
      const id = doc.id;

      if (
        data.approvalStatus !== "approved" ||
        data.isVisible === false ||
        !data.location
      ) {
        return;
      }

      // Calcular distancia usando la fórmula de Haversine
      const distance = calculateDistance(
        { latitude: userLatitude, longitude: userLongitude },
        { latitude: data.location.latitude, longitude: data.location.longitude }
      );

      // Solo incluir si está dentro del radio máximo
      if (distance <= maxDistanceKm) {
        const title = data.title || data.name || "Sin título";
        const image =
          data.imageUrl ||
          data.image ||
          getImageByCategory(data.category || "general");
        const category = data.category || "general";
        const discountPercentage = data.discountPercentage
          ? `${data.discountPercentage}%`
          : "Descuento disponible";

        const expiration =
          data.validUntil?.toDate?.() ||
          data.expirationDate?.toDate?.() ||
          new Date();

        nearbyDiscounts.push({
          id,
          title,
          image,
          category,
          discountPercentage,
          points: 6,
          distance: formatDistance(distance),
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
          isVisible: data.isVisible ?? true,
        } as HomePageDiscount);
      }
    });

    // Ordenar por distancia (más cercanos primero)
    return nearbyDiscounts.sort((a, b) => {
      const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ""));
      const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ""));
      return distanceA - distanceB;
    });
  } catch (error) {
    console.error("Error al obtener descuentos cercanos:", error);
    return [];
  }
};

// Función auxiliar para calcular distancia (fórmula de Haversine)
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

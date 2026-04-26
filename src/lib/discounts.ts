import { db } from "@/lib/firebase/firebase";
import type { UserCredential } from "@/types/credentials";
import { Discount } from "@/types/discount";
import { getImageByCategory } from "@/utils/category-mapping";
import { getRealDistance } from "@/utils/real-distance";
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

export const MAX_DISTANCE_KM = 2;

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
  image?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: "active" | "inactive" | "expired";
  title?: string;
  origin?: string;
  type?: string;
  expirationDate?: Timestamp;
  descripcion?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  source?: "manual" | "scraping";
  isVisible?: boolean;
  bancos?: string[];
  banks?: string[];
  availableMemberships?: string[];
  availableCredentials?: UserCredential[];

  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  points?: number;
  favoritesCount?: number;
  upVotes?: number;
}

const APPROVED = "approved";
const ACTIVE = "active";

function getDiscountExpirationDate(data: FirestoreDiscount): Date | null {
  return data.expirationDate?.toDate?.() || data.validUntil?.toDate?.() || null;
}

function isDiscountExpired(data: FirestoreDiscount, now: Date = new Date()): boolean {
  const expiration = getDiscountExpirationDate(data);
  return !!(expiration && expiration < now);
}

async function getApprovedActiveDiscountDocs() {
  try {
    const q = query(
      collection(db, "discounts"),
      where("approvalStatus", "==", APPROVED),
      where("status", "==", ACTIVE)
    );
    return await getDocs(q);
  } catch (error) {
    // Fallback sin índice compuesto: traer todos y filtrar en cliente.
    const allSnapshot = await getDocs(collection(db, "discounts"));
    const filteredDocs = allSnapshot.docs.filter((docSnap) => {
      const data = docSnap.data() as FirestoreDiscount;
      return data.approvalStatus === APPROVED && data.status === ACTIVE;
    });

    return {
      docs: filteredDocs,
    } as Pick<typeof allSnapshot, "docs">;
  }
}

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
        expirationDate: getDiscountExpirationDate(data) || new Date(),
      } as Discount;
    });
  } catch (error) {
    throw error;
  }
};

interface HomePageDiscount {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  discountAmount?: number;
  points: number;
  distance: string;
  expiresAt?: Date;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
  membershipRequired?: string[];
  bancos?: string[];
  availableMemberships?: string[];
  availableCredentials?: UserCredential[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export const getHomePageDiscounts = async (): Promise<HomePageDiscount[]> => {
  try {
    const snapshot = await getApprovedActiveDiscountDocs();
    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as FirestoreDiscount;

        const title = data.title || data.name || "Sin título";
        const category = data.category || "Sin categoría";
        const discountPercentage = data.discountPercentage
          ? `${data.discountPercentage}%`
          : "Sin descuento";

        const image =
          data.imageUrl?.trim() ||
          data.image?.trim() ||
          getImageByCategory(data.category);

        const expiration = getDiscountExpirationDate(data) || new Date();

        return {
          id: doc.id,
          title,
          image,
          category,
          discountPercentage,
          discountAmount: data.discountAmount,
          points: data.points || 0,
          distance: data.location ? "Calculando..." : "Sin ubicación",
          expiresAt: expiration,
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
          isVisible: data.isVisible ?? true,
          membershipRequired: data.membershipRequired,
          bancos: data.bancos || data.banks,
          availableMemberships: data.availableMemberships,
          availableCredentials: data.availableCredentials,
          location: data.location,
        } as HomePageDiscount;
      })
      .filter((discount) => {
        // Filtrar descuentos activos, visibles y con fecha de validez no expirada
        const now = new Date();
        const expirationDate = (discount as HomePageDiscount & { expiresAt?: Date })
          .expiresAt;
        const isNotExpired = !expirationDate || expirationDate >= now;
        return (
          discount.status === "active" &&
          discount.isVisible !== false &&
          isNotExpired
        );
      });
  } catch {
    return [];
  }
};

/**
 * Obtiene los descuentos más populares (tendencias) basado en:
 * - upVotes del documento del descuento (colección discounts)
 * - favoritesCount del documento del descuento (colección discounts)
 * - Promedio entre ambos valores
 * Solo incluye descuentos con promedio mayor a 0
 */
export const getTrendingDiscounts = async (
  limit: number = 5
): Promise<HomePageDiscount[]> => {
  try {
    // 1. Obtener todos los descuentos aprobados y activos
    const discountsSnapshot = await getApprovedActiveDiscountDocs();

    // 4. Procesar descuentos y calcular promedio
    const discountsWithScore: (HomePageDiscount & { average: number })[] = [];

    for (const doc of discountsSnapshot.docs) {
      const data = doc.data() as FirestoreDiscount;

      // Filtrar descuentos expirados
      const now = new Date();
      const isExpired = isDiscountExpired(data, now);
      if (isExpired) continue;

      const title = data.title || data.name || "Sin título";
      const category = data.category || "Sin categoría";
      const discountPercentage = data.discountPercentage
        ? `${data.discountPercentage}%`
        : "Sin descuento";

      const image =
        data.imageUrl?.trim() ||
        data.image?.trim() ||
        getImageByCategory(data.category);

      const expirationDate = getDiscountExpirationDate(data) || new Date();

      // Obtener conteos directamente del documento del descuento
      // Asegurar que sean números válidos
      const upVotes = typeof data.upVotes === 'number' ? data.upVotes : 0;
      const favorites = typeof data.favoritesCount === 'number' ? data.favoritesCount : 0;

      // Calcular promedio: (upVotes + favoritos) / 2
      const average = (upVotes + favorites) / 2;

      // IMPORTANTE: Solo incluir descuentos con promedio estrictamente mayor a 0
      // Si el promedio es 0 o menor, saltar este descuento completamente
      if (average <= 0 || !isFinite(average)) continue;

      const discount: HomePageDiscount = {
        id: doc.id,
        title,
        image,
        category,
        discountPercentage,
        discountAmount: data.discountAmount,
        points: data.points || 0,
        distance: data.location ? "Calculando..." : "Sin ubicación",
        expiration: expirationDate.toLocaleDateString("es-ES"),
        description: data.description || data.descripcion || "",
        origin: data.origin || "Origen no especificado",
        status: data.status || "active",
        isVisible: data.isVisible ?? true,
        membershipRequired: data.membershipRequired,
        bancos: data.bancos || data.banks,
        availableMemberships: data.availableMemberships,
        availableCredentials: data.availableCredentials,
        location: data.location,
      };

      // Filtrar descuentos activos y visibles
      // Solo agregar si el promedio es mayor a 0 (doble verificación)
      if (
        average > 0 &&
        discount.status === "active" &&
        discount.isVisible !== false &&
        !isNaN(expirationDate.getTime())
      ) {
        discountsWithScore.push({ ...discount, average });
      }
    }

    // 5. Filtrar nuevamente para asegurar que solo se incluyan con promedio > 0
    // Esto es una verificación de seguridad adicional
    const filteredByScore = discountsWithScore.filter((item) => {
      const avg = item.average;
      const isValid = typeof avg === 'number' && avg > 0 && isFinite(avg);
      if (!isValid) {
        console.log(`[Tendencias] Descartando descuento "${item.title}" con promedio: ${avg}`);
      }
      return isValid;
    });
    
    console.log(`[Tendencias] Después del filtro: ${filteredByScore.length} descuentos con promedio > 0`);
    
    // 6. Ordenar por promedio (descendente)
    const sorted = filteredByScore.sort((a, b) => b.average - a.average);
    
    // 7. Limitar a máximo 5 descuentos
    const maxLimit = Math.min(limit, 5);
    const topDiscounts = sorted.slice(0, maxLimit);
    
    console.log(`[Tendencias] Retornando ${topDiscounts.length} descuentos (máximo ${maxLimit})`);

    // 8. Remover el campo average antes de retornar
    return topDiscounts.map(({ average, ...discount }) => discount);
  } catch (error) {
    console.error("Error obteniendo descuentos de tendencias:", error);
    return [];
  }
};

export const getDiscountsBySearch = async (
  searchTerm: string
): Promise<Discount[]> => {
  try {
    const snapshot = await getApprovedActiveDiscountDocs();
    const all = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreDiscount;
      const expirationDate = getDiscountExpirationDate(data) || new Date();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        expirationDate,
      } as Discount;
    });

    if (!searchTerm) return all;

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

    const now = new Date();
    return all.filter((d: Discount) => {
      const e = d as ExtendedDiscount;
      // Filtrar descuentos expirados.
      const expiration = d.expirationDate;
      const isNotExpired = !expiration || expiration >= now;
      if (!isNotExpired) return false;

      const haystack = [
        normalize(e.title),
        normalize(e.name),
        normalize(e.description),
        normalize(e.descripcion),
        normalize(e.category),
        normalize(e.origin),
        normalize(e.type),
      ].filter((field) => field.length > 0);

      return haystack.some((field) => {
        const words = field.split(/\s+/);
        return words.some((word) => word.startsWith(term));
      });
    });
  } catch (error) {
    throw error;
  }
};

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
    throw error;
  }
};

export const getPendingDiscounts = async (): Promise<Discount[]> => {
  try {
    const allSnapshot = await getDocs(collection(db, "discounts"));

    const statusCounts: Record<string, number> = {};
    allSnapshot.docs.forEach((doc) => {
      const data = doc.data() as FirestoreDiscount;
      const status = data.approvalStatus || "sin status";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const items = allSnapshot.docs
      .filter((doc) => {
        const data = doc.data() as FirestoreDiscount;
        const status = data.approvalStatus;
        return !status || status === "pending";
      })
      .map((doc) => {
        const data = doc.data() as FirestoreDiscount;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          expirationDate: getDiscountExpirationDate(data) || new Date(),
          approvalStatus: data.approvalStatus || "pending",
          source: data.source || "scraping",
        } as Discount;
      });

    items.sort(
      (a, b) =>
        (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
    );

    return items;
  } catch (error) {
    throw error;
  }
};

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
    throw error;
  }
};

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
    throw error;
  }
};

export const getApprovedDiscounts = async (): Promise<Discount[]> => {
  try {
    const snapshot = await getApprovedActiveDiscountDocs();
    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as FirestoreDiscount;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          expirationDate: getDiscountExpirationDate(data) || new Date(),
          approvalStatus: data.approvalStatus || "approved",
          source: data.source || "scraping",
        } as Discount;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.getTime?.() || 0;
        const dateB = b.createdAt?.getTime?.() || 0;
        return dateB - dateA;
      })
      .filter((discount) => {
        return discount.isVisible !== false;
      });
  } catch (error) {
    throw error;
  }
};

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
        expirationDate: getDiscountExpirationDate(data) || new Date(),
        approvalStatus: data.approvalStatus || "pending",
        source: data.source || "scraping",
      } as Discount;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getNearbyDiscounts = async (
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number = MAX_DISTANCE_KM
): Promise<HomePageDiscount[]> => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));
    const nearbyDiscounts: HomePageDiscount[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as FirestoreDiscount;
      const id = doc.id;

      // Verificar si el descuento está expirado
      const now = new Date();
      const isExpired = isDiscountExpired(data, now);

      if (
        data.approvalStatus !== "approved" ||
        data.isVisible === false ||
        !data.location ||
        isExpired
      ) {
        continue;
      }

      const result = await getRealDistance(
        { lat: userLatitude, lng: userLongitude },
        { lat: data.location.latitude, lng: data.location.longitude }
      );

      if (!result) {
        continue;
      }

      const distanceKm = result.distance / 1000;
      if (distanceKm <= maxDistanceKm) {
        const title = data.title || data.name || "Sin título";
        const image =
          data.imageUrl ||
          data.image ||
          getImageByCategory(data.category || "general");
        const category = data.category || "general";
        const discountPercentage = data.discountPercentage
          ? `${data.discountPercentage}%`
          : "Descuento disponible";

        const expiration = getDiscountExpirationDate(data) || new Date();

        nearbyDiscounts.push({
          id,
          title,
          image,
          category,
          discountPercentage,
          discountAmount: data.discountAmount,
          points: data.points || 0,
          distance: result.distanceText,
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
          isVisible: data.isVisible ?? true,
        } as HomePageDiscount);
      }
    }

    return nearbyDiscounts.sort((a, b) => {
      const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ""));
      const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ""));
      return distanceA - distanceB;
    });
  } catch {
    return [];
  }
};

export const getNearbyDiscountsProgressive = async (
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number = MAX_DISTANCE_KM,
  onBatchComplete: (batch: HomePageDiscount[], isComplete: boolean) => void,
  batchSize: number = 5
): Promise<HomePageDiscount[]> => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));
    const allNearbyDiscounts: HomePageDiscount[] = [];
    const validDocs: Array<{
      doc: unknown;
      data: FirestoreDiscount;
      id: string;
    }> = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as FirestoreDiscount;
      const id = doc.id;

      // Verificar si el descuento está expirado
      const now = new Date();
      const isExpired = isDiscountExpired(data, now);

      if (
        data.approvalStatus === "approved" &&
        data.isVisible !== false &&
        data.location &&
        !isExpired
      ) {
        validDocs.push({ doc, data, id });
      }
    }

    for (let i = 0; i < validDocs.length; i += batchSize) {
      const batch = validDocs.slice(i, i + batchSize);
      const batchResults: HomePageDiscount[] = [];

      await Promise.all(
        batch.map(async ({ data, id }) => {
          try {
            const result = await getRealDistance(
              { lat: userLatitude, lng: userLongitude },
              { lat: data.location!.latitude, lng: data.location!.longitude }
            );

            if (!result) {
              return;
            }

            const distanceKm = result.distance / 1000;
            if (distanceKm <= maxDistanceKm) {
              const title = data.title || data.name || "Sin título";
              const image =
                data.imageUrl ||
                data.image ||
                getImageByCategory(data.category || "general");
              const category = data.category || "general";
              const discountPercentage = data.discountPercentage
                ? `${data.discountPercentage}%`
                : "Descuento disponible";

              const expiration = getDiscountExpirationDate(data) || new Date();

              const discount: HomePageDiscount = {
                id,
                title,
                image,
                category,
                discountPercentage,
                discountAmount: data.discountAmount,
                points: data.points || 0,
                distance: result.distanceText,
                expiration: expiration.toLocaleDateString("es-ES"),
                description: data.description || data.descripcion || "",
                origin: data.origin || "Origen no especificado",
                status: data.status || "active",
                isVisible: data.isVisible ?? true,
              };

              batchResults.push(discount);
              allNearbyDiscounts.push(discount);
            }
          } catch {}
        })
      );

      const sortedBatch = batchResults.sort((a, b) => {
        const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ""));
        const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ""));
        return distanceA - distanceB;
      });

      const isComplete = i + batchSize >= validDocs.length;
      if (sortedBatch.length > 0 || isComplete) {
        onBatchComplete(sortedBatch, isComplete);
      }
    }

    return allNearbyDiscounts.sort((a, b) => {
      const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ""));
      const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ""));
      return distanceA - distanceB;
    });
  } catch {
    return [];
  }
};

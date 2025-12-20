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
  availableMemberships?: string[];
  availableCredentials?: UserCredential[];

  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  points?: number;
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
        validUntil: data.validUntil?.toDate?.() || new Date(),
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
          id: doc.id,
          title,
          image,
          category,
          discountPercentage,
          points: data.points || 0,
          distance: data.location ? "Calculando..." : "Sin ubicación",
          expiration: expiration.toLocaleDateString("es-ES"),
          description: data.description || data.descripcion || "",
          origin: data.origin || "Origen no especificado",
          status: data.status || "active",
          isVisible: data.isVisible ?? true,
          location: data.location,
        } as HomePageDiscount;
      })
      .filter((discount) => {
        return discount.status === "active" && discount.isVisible !== false;
      });
  } catch {
    return [];
  }
};

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
          validUntil: data.validUntil?.toDate?.() || new Date(),
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
        validUntil: data.validUntil?.toDate?.() || new Date(),
        approvalStatus: data.approvalStatus || "pending",
        source: data.source || "scraping",
      } as Discount;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getPersonalizedDiscounts = async (
  userMemberships: string[],
  userCredentials: UserCredential[]
): Promise<HomePageDiscount[]> => {
  try {
    if (
      (!userMemberships || userMemberships.length === 0) &&
      (!userCredentials || userCredentials.length === 0)
    ) {
      return [];
    }

    const userMembershipsClean = userMemberships.filter(
      (m) => typeof m === "string" && m.trim().length > 0
    );

    const hasMembershipMatch = (discountMembership: string): boolean => {
      const result = userMembershipsClean.includes(discountMembership);
      return result;
    };

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
        return matches;
      });
      return result;
    };

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

    const matchedDiscounts = allDiscounts.filter(({ data }) => {
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

    return matchedDiscounts.slice(0, 10).map(({ id, data }) => {
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
        points: data.points || 0,
        distance: "",
        expiration: expiration.toLocaleDateString("es-ES"),
        description: data.description || data.descripcion || "",
        origin: data.origin,
        status: data.status,
        isVisible: data.isVisible ?? true,
        location: data.location,
      } as HomePageDiscount;
    });
  } catch {
    return [];
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

      if (
        data.approvalStatus !== "approved" ||
        data.isVisible === false ||
        !data.location
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

      if (
        data.approvalStatus === "approved" &&
        data.isVisible !== false &&
        data.location
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

              const expiration =
                data.validUntil?.toDate?.() ||
                data.expirationDate?.toDate?.() ||
                new Date();

              const discount: HomePageDiscount = {
                id,
                title,
                image,
                category,
                discountPercentage,
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

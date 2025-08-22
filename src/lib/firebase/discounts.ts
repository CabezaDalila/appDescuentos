import { db, collection, getDocs } from "@/lib/firebase";
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: "active" | "inactive" | "expired";
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Discount;
    });
  } catch (error) {
    console.error("Error al obtener descuentos:", error);
    throw error;
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Discount;
    });

    if (!searchTerm) return all;

    const term = searchTerm.toLowerCase();
    return all.filter((d: Discount) =>
      (d.name || "").toLowerCase().includes(term) ||
      (d.description || "").toLowerCase().includes(term) ||
      (d.category || "").toLowerCase().includes(term)
    );
  } catch (error) {
    console.error("Error al buscar descuentos:", error);
    throw error;
  }
}; 
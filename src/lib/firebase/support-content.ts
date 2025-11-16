import { db, Timestamp } from "@/lib/firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface TermsContent {
  id?: string;
  termsOfService: string;
  privacyPolicy: string;
  updatedAt?: any;
}

const FAQ_COLLECTION = "support_faqs";
const TERMS_COLLECTION = "support_terms";

// FAQs
export const getFAQs = async (): Promise<FAQItem[]> => {
  try {
    const q = query(collection(db, FAQ_COLLECTION), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQItem[];
  } catch (error: any) {
    // Si el error es por falta de índice, intentar sin ordenar
    if (
      error?.code === "failed-precondition" ||
      error?.message?.includes("index")
    ) {
      try {
        const querySnapshot = await getDocs(collection(db, FAQ_COLLECTION));
        const faqs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FAQItem[];
        // Ordenar manualmente
        return faqs.sort((a, b) => (a.order || 0) - (b.order || 0));
      } catch (fallbackError) {
        console.error("Error obteniendo FAQs (fallback):", fallbackError);
        return [];
      }
    }
    console.error("Error obteniendo FAQs:", error);
    return [];
  }
};

export const saveFAQ = async (faq: FAQItem): Promise<string> => {
  try {
    const faqData = {
      question: faq.question,
      answer: faq.answer,
      order: faq.order || 0,
      updatedAt: Timestamp.now(),
    };

    if (faq.id) {
      // Actualizar existente
      await setDoc(doc(db, FAQ_COLLECTION, faq.id), faqData, { merge: true });
      return faq.id;
    } else {
      // Crear nuevo
      faqData.createdAt = Timestamp.now();
      const docRef = doc(collection(db, FAQ_COLLECTION));
      await setDoc(docRef, faqData);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error guardando FAQ:", error);
    throw error;
  }
};

export const deleteFAQ = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, FAQ_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error eliminando FAQ:", error);
    throw error;
  }
};

// Términos y Política de Privacidad
export const getTermsContent = async (): Promise<TermsContent | null> => {
  try {
    const docRef = doc(db, TERMS_COLLECTION, "content");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as TermsContent;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo términos:", error);
    return null;
  }
};

export const saveTermsContent = async (
  content: TermsContent
): Promise<void> => {
  try {
    const docRef = doc(db, TERMS_COLLECTION, "content");
    await setDoc(
      docRef,
      {
        termsOfService: content.termsOfService,
        privacyPolicy: content.privacyPolicy,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error guardando términos:", error);
    throw error;
  }
};

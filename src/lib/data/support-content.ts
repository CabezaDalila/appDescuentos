/**
 * Contenido de soporte (FAQs + Términos) sobre Supabase.
 * Reemplaza las colecciones Firestore `support_faqs` / `support_terms`.
 * RLS: lectura pública; escritura solo admin.
 */
import { supabase } from "@/lib/supabase/client";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TermsContent {
  id?: string;
  termsOfService: string;
  privacyPolicy: string;
  updatedAt?: string;
}

const FAQ_TABLE = "support_faqs";
const TERMS_TABLE = "support_terms";
const TERMS_ID = "content";

interface FAQRow {
  id: string;
  question: string;
  answer: string;
  order: number;
  created_at: string;
  updated_at: string;
}

const rowToFAQ = (r: FAQRow): FAQItem => ({
  id: r.id,
  question: r.question,
  answer: r.answer,
  order: r.order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// ── FAQs ─────────────────────────────────────────────────────────────────
export const getFAQs = async (): Promise<FAQItem[]> => {
  try {
    const { data, error } = await supabase
      .from(FAQ_TABLE)
      .select("*")
      .order("order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToFAQ(r as FAQRow));
  } catch (error) {
    console.error("Error obteniendo FAQs:", error);
    return [];
  }
};

export const saveFAQ = async (faq: FAQItem): Promise<string> => {
  try {
    const now = new Date().toISOString();
    if (faq.id) {
      const { error } = await supabase
        .from(FAQ_TABLE)
        .update({
          question: faq.question,
          answer: faq.answer,
          order: faq.order || 0,
          updated_at: now,
        })
        .eq("id", faq.id);
      if (error) throw error;
      return faq.id;
    }
    const { data, error } = await supabase
      .from(FAQ_TABLE)
      .insert({
        question: faq.question,
        answer: faq.answer,
        order: faq.order || 0,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (error) {
    console.error("Error guardando FAQ:", error);
    throw error;
  }
};

export const deleteFAQ = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from(FAQ_TABLE).delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("Error eliminando FAQ:", error);
    throw error;
  }
};

// ── Términos y Política de Privacidad ─────────────────────────────────────
export const getTermsContent = async (): Promise<TermsContent | null> => {
  try {
    const { data, error } = await supabase
      .from(TERMS_TABLE)
      .select("*")
      .eq("id", TERMS_ID)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id as string,
      termsOfService: (data.terms_of_service as string) ?? "",
      privacyPolicy: (data.privacy_policy as string) ?? "",
      updatedAt: data.updated_at as string,
    };
  } catch (error) {
    console.error("Error obteniendo términos:", error);
    return null;
  }
};

export const saveTermsContent = async (
  content: TermsContent
): Promise<void> => {
  try {
    const { error } = await supabase.from(TERMS_TABLE).upsert({
      id: TERMS_ID,
      terms_of_service: content.termsOfService,
      privacy_policy: content.privacyPolicy,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error guardando términos:", error);
    throw error;
  }
};

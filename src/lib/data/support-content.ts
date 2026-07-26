/**
 * Contenido de soporte (FAQs + Términos) — ahora sobre Supabase.
 * Se re-exporta la capa `src/lib/supabase/support-content.ts` para no tocar a
 * los consumidores (admin/support-content, support/terms, support/faq).
 */
export type { FAQItem, TermsContent } from "@/lib/supabase/support-content";
export {
  getFAQs,
  saveFAQ,
  deleteFAQ,
  getTermsContent,
  saveTermsContent,
} from "@/lib/supabase/support-content";

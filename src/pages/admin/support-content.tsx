import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { Textarea } from "@/components/Share/textarea";
import { LayoutAdmin } from "@/layouts/layout-admin";
import {
  deleteFAQ,
  getFAQs,
  getTermsContent,
  saveFAQ,
  saveTermsContent,
  type FAQItem,
  type TermsContent,
} from "@/lib/firebase/support-content";
import { FileText, HelpCircle, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminSupportContent() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [termsContent, setTermsContent] = useState<TermsContent>({
    termsOfService: "",
    privacyPolicy: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "", order: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqsData, termsData] = await Promise.all([
        getFAQs(),
        getTermsContent(),
      ]);
      setFaqs(faqsData);
      if (termsData) {
        setTermsContent(termsData);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFAQ = async (faq: FAQItem) => {
    if (!faq.question.trim() || !faq.answer.trim()) {
      toast.error("La pregunta y respuesta son requeridas");
      return;
    }

    setSaving(true);
    try {
      await saveFAQ(faq);
      toast.success("FAQ guardada exitosamente");
      setEditingFAQ(null);
      await loadData();
    } catch (error) {
      console.error("Error guardando FAQ:", error);
      toast.error("Error al guardar la FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta FAQ?")) {
      return;
    }

    try {
      await deleteFAQ(id);
      toast.success("FAQ eliminada exitosamente");
      await loadData();
    } catch (error) {
      console.error("Error eliminando FAQ:", error);
      toast.error("Error al eliminar la FAQ");
    }
  };

  const handleSaveTerms = async () => {
    if (
      !termsContent.termsOfService.trim() ||
      !termsContent.privacyPolicy.trim()
    ) {
      toast.error("Los términos y la política de privacidad son requeridos");
      return;
    }

    setSaving(true);
    try {
      await saveTermsContent(termsContent);
      toast.success("Términos y política guardados exitosamente");
    } catch (error) {
      console.error("Error guardando términos:", error);
      toast.error("Error al guardar los términos");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LayoutAdmin>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin>
      <div className="space-y-6">
        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de FAQs */}
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {editingFAQ && editingFAQ.id === faq.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Pregunta</Label>
                        <Input
                          value={editingFAQ.question}
                          onChange={(e) =>
                            setEditingFAQ({
                              ...editingFAQ,
                              question: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Respuesta</Label>
                        <Textarea
                          value={editingFAQ.answer}
                          onChange={(e) =>
                            setEditingFAQ({
                              ...editingFAQ,
                              answer: e.target.value,
                            })
                          }
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Orden</Label>
                        <Input
                          type="number"
                          value={editingFAQ.order || 0}
                          onChange={(e) =>
                            setEditingFAQ({
                              ...editingFAQ,
                              order: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1 w-24"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            editingFAQ && handleSaveFAQ(editingFAQ)
                          }
                          disabled={saving}
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingFAQ(null)}
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {faq.question}
                          </h4>
                          <p className="text-sm text-gray-600">{faq.answer}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFAQ(faq)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => faq.id && handleDeleteFAQ(faq.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Agregar nueva FAQ */}
            {!editingFAQ && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Agregar nueva FAQ
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>Pregunta</Label>
                    <Input
                      value={newFAQ.question}
                      onChange={(e) =>
                        setNewFAQ({ ...newFAQ, question: e.target.value })
                      }
                      placeholder="¿Cómo puedo...?"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Respuesta</Label>
                    <Textarea
                      value={newFAQ.answer}
                      onChange={(e) =>
                        setNewFAQ({ ...newFAQ, answer: e.target.value })
                      }
                      placeholder="La respuesta a la pregunta..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Orden</Label>
                    <Input
                      type="number"
                      value={newFAQ.order}
                      onChange={(e) =>
                        setNewFAQ({
                          ...newFAQ,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-24"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      await handleSaveFAQ(newFAQ);
                      setNewFAQ({ question: "", answer: "", order: 0 });
                    }}
                    disabled={
                      saving || !newFAQ.question.trim() || !newFAQ.answer.trim()
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar FAQ
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Términos y Política */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Términos y Política de Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Términos de Servicio</Label>
              <Textarea
                value={termsContent.termsOfService}
                onChange={(e) =>
                  setTermsContent({
                    ...termsContent,
                    termsOfService: e.target.value,
                  })
                }
                rows={12}
                className="mt-1 font-mono text-sm"
                placeholder="Ingresa los términos de servicio aquí..."
              />
            </div>
            <div>
              <Label>Política de Privacidad</Label>
              <Textarea
                value={termsContent.privacyPolicy}
                onChange={(e) =>
                  setTermsContent({
                    ...termsContent,
                    privacyPolicy: e.target.value,
                  })
                }
                rows={12}
                className="mt-1 font-mono text-sm"
                placeholder="Ingresa la política de privacidad aquí..."
              />
            </div>
            <Button
              onClick={handleSaveTerms}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Términos y Política
            </Button>
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}

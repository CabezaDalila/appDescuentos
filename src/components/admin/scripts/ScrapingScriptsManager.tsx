import { Badge } from "@/components/Share/badge";
import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Share/dialog";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { Switch } from "@/components/Share/switch";
import { Textarea } from "@/components/Share/textarea";
import {
  createScrapedDiscount,
  createScrapingScript,
  deleteScrapingScript,
  getScrapingScripts,
  updateScrapingScript,
} from "@/lib/admin";
import { ScrapingScript } from "@/types/admin";
import {
  Calendar,
  Clock,
  Code,
  Copy,
  Edit,
  Globe,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function ScrapingScriptsManager() {
  const [scripts, setScripts] = useState<ScrapingScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<ScrapingScript | null>(
    null
  );
  const [formData, setFormData] = useState({
    siteName: "",
    script: "",
    frequency: "daily",
    isActive: true,
  });
  const [jsonData, setJsonData] = useState("");
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const data = await getScrapingScripts();
      setScripts(data);
    } catch (error) {
      toast.error("Error al cargar scripts de scraping");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.siteName.trim() || !formData.script.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      if (editingScript) {
        await updateScrapingScript(editingScript.id, formData);
        toast.success("Script actualizado correctamente");
      } else {
        await createScrapingScript(formData);
        toast.success("Script creado correctamente");
      }

      setIsDialogOpen(false);
      resetForm();
      loadScripts();
    } catch (error) {
      toast.error("Error al guardar el script");
      console.error(error);
    }
  };

  const handleEdit = (script: ScrapingScript) => {
    setEditingScript(script);
    setFormData({
      siteName: script.siteName,
      script: script.script,
      frequency: script.frequency || "daily",
      isActive: script.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este script?")) return;

    try {
      await deleteScrapingScript(id);
      toast.success("Script eliminado correctamente");
      loadScripts();
    } catch (error) {
      toast.error("Error al eliminar el script");
      console.error(error);
    }
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast.success("Script copiado al portapapeles");
  };

  const handlePasteJsonData = () => {
    setIsJsonDialogOpen(true);
  };

  const handleSaveJsonData = async () => {
    if (!jsonData.trim()) {
      toast.error("Por favor pega el JSON con los datos de descuentos");
      return;
    }

    try {
      const discounts = JSON.parse(jsonData);

      if (!Array.isArray(discounts)) {
        toast.error("El JSON debe ser un array de descuentos");
        return;
      }

      let savedCount = 0;
      for (const discount of discounts) {
        try {
          await createScrapedDiscount(discount);
          savedCount++;
        } catch (error) {
          console.error("Error guardando descuento:", error);
        }
      }

      toast.success(`${savedCount} descuentos guardados correctamente`);
      setJsonData("");
      setIsJsonDialogOpen(false);
    } catch (error) {
      toast.error("Error al procesar el JSON. Verifica el formato");
      console.error(error);
    }
  };

  const handleToggleActive = async (script: ScrapingScript) => {
    try {
      await updateScrapingScript(script.id, { isActive: !script.isActive });
      toast.success(
        `Script ${!script.isActive ? "activado" : "desactivado"} correctamente`
      );
      loadScripts();
    } catch (error) {
      toast.error("Error al cambiar estado del script");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      siteName: "",
      script: "",
      frequency: "daily",
      isActive: true,
    });
    setEditingScript(null);
  };

  const openNewScriptDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scripts de Scraping</h2>
          <p className="text-muted-foreground">
            Gestiona los scripts automatizados para extraer descuentos de
            diferentes sitios web
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePasteJsonData}
            variant="outline"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
          >
            <Upload className="h-4 w-4" />
            Subir Datos JSON
          </Button>
          <Button
            onClick={openNewScriptDialog}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Script
          </Button>
        </div>
      </div>

      {/* Scripts List */}
      <div className="grid gap-4">
        {scripts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Code className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay scripts de scraping configurados.
                <br />
                Crea el primero para comenzar a automatizar la extracción de
                descuentos.
              </p>
            </CardContent>
          </Card>
        ) : (
          scripts.map((script) => (
            <Card key={script.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">
                        {script.siteName}
                      </CardTitle>
                      <Badge
                        variant={script.isActive ? "default" : "secondary"}
                      >
                        {script.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Creado: {script.createdAt.toLocaleDateString()}
                      </span>
                      {script.frequency && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Frecuencia: {script.frequency}
                        </span>
                      )}
                      {script.lastExecuted && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Última ejecución:{" "}
                          {script.lastExecuted.toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={script.isActive}
                      onCheckedChange={() => handleToggleActive(script)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(script)}
                      className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyScript(script.script)}
                      title="Copiar script"
                      className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(script.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-md">
                  <Label className="text-sm font-medium mb-2 block">
                    Script:
                  </Label>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {script.script}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto admin-dialog">
          <DialogHeader>
            <DialogTitle className="dialog-title">
              {editingScript ? "Editar Script" : "Nuevo Script de Scraping"}
            </DialogTitle>
            <DialogDescription className="dialog-description">
              {editingScript
                ? "Modifica la configuración del script existente"
                : "Configura un nuevo script para extraer descuentos de un sitio web"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 admin-form">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nombre del Sitio Web *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) =>
                  setFormData({ ...formData, siteName: e.target.value })
                }
                placeholder="Ej: Amazon, Mercado Libre, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia de Ejecución *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Solo Manual</SelectItem>
                  <SelectItem value="hourly">Cada Hora</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define con qué frecuencia se ejecutará automáticamente el script
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="script">Script de Scraping *</Label>
              <Textarea
                id="script"
                value={formData.script}
                onChange={(e) =>
                  setFormData({ ...formData, script: e.target.value })
                }
                placeholder="Pega aquí tu script de scraping..."
                rows={10}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                El script debe estar en el formato correcto para tu motor de
                scraping
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Script activo</Label>
            </div>
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {editingScript ? "Actualizar" : "Crear Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON Data Dialog */}
      <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto admin-dialog">
          <DialogHeader>
            <DialogTitle className="dialog-title">
              Subir Datos de Descuentos
            </DialogTitle>
            <DialogDescription className="dialog-description">
              Pega aquí el JSON con los datos de descuentos obtenidos del script
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 admin-form">
            <div className="space-y-2">
              <Label htmlFor="jsonData">Datos JSON de Descuentos *</Label>
              <Textarea
                id="jsonData"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder="Pega aquí el JSON con los descuentos obtenidos del script..."
                rows={15}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                El JSON debe ser un array de objetos con los descuentos.
                Ejemplo: [{"{"}"name": "Descuento 1", "discountPercentage": 20
                {"}"}]
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsJsonDialogOpen(false)}
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveJsonData}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Guardar Descuentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

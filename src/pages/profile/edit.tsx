import { Button } from "@/components/Share/button";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { Textarea } from "@/components/Share/textarea";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, 
  Camera, 
  MapPin, 
  Phone, 
  User, 
  Mail,
  ArrowLeft 
} from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    dateOfBirth: "",
    preferredCategory: "",
    biography: "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aquí iría la lógica para guardar los datos
      // Por ahora solo simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Perfil actualizado exitosamente");
      router.back();
    } catch (error) {
      toast.error("Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Editar Perfil</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Foto de perfil */}
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <button 
              onClick={() => {
                // Aquí iría la lógica para cambiar la foto
                toast.success("Función de cambio de foto próximamente");
              }}
              className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-2 hover:bg-gray-700 transition-colors"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Información personal */}
        <div className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              Nombre completo
            </Label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Usuario Ejemplo"
              className="border-gray-300"
            />
          </div>

          {/* Correo electrónico */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4" />
              Correo electrónico
            </Label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@ejemplo.com"
              className="border-gray-300"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4" />
              Teléfono
            </Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+54 11 1234-5678"
              className="border-gray-300"
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4" />
              Ubicación
            </Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Buenos Aires, Argentina"
              className="border-gray-300"
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              Fecha de nacimiento
            </Label>
            <div className="relative">
              <Input
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                placeholder="01/01/1990"
                className="border-gray-300 pr-10"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Preferencias</h2>
          
          {/* Categoría preferida */}
          <div className="space-y-2">
            <Label className="text-gray-700">Categoría preferida</Label>
            <div className="relative">
              <Input
                value={formData.preferredCategory}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredCategory: e.target.value }))}
                placeholder="Restaurantes"
                className="border-gray-300 pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Biografía */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Biografía</h2>
          
          <div className="space-y-2">
            <Textarea
              value={formData.biography}
              onChange={(e) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
              placeholder="Me encanta encontrar las mejores promociones y compartirlas con mis amigos."
              className="border-gray-300 min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

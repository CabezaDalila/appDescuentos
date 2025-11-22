import { Button } from "@/components/Share/button";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  getUserProfile,
  updateUserProfile,
  updateDisplayName,
  uploadProfilePhoto,
  updatePhotoURL,
  validateDateOfBirth,
} from "@/lib/firebase/profileService";
import {
  Calendar,
  Camera,
  User,
  Mail,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    gender: "",
  });

  const [errors, setErrors] = useState({
    birthDate: "",
    firstName: "",
    lastName: "",
  });

  // Cargar datos del perfil cuando estén disponibles
  useEffect(() => {
    if (user && profile) {
      // Obtener firstName y lastName del perfil, o del displayName si no existen
      const firstName = profile.profile?.firstName || user.displayName?.split(" ")[0] || "";
      const lastName = profile.profile?.lastName || user.displayName?.split(" ").slice(1).join(" ") || "";
      
      // Para fecha de nacimiento, usar birthDate del perfil
      // Si existe dateOfBirth (deprecated), migrarlo a birthDate
      const birthDate = profile.profile?.birthDate || profile.profile?.dateOfBirth || "";
      
      // Convertir null a string vacío para gender también
      const gender = profile.profile?.gender || "";
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: user.email || "",
        birthDate: birthDate || "",
        gender: gender || "",
      });
      // Usar la foto actual del usuario si existe
      if (user.photoURL) {
        setPhotoPreview(user.photoURL);
      }
    }
  }, [user, profile]);

  // Detectar cambios
  useEffect(() => {
    if (!user || !profile) return;

    const currentFirstName = profile.profile?.firstName || user.displayName?.split(" ")[0] || "";
    const currentLastName = profile.profile?.lastName || user.displayName?.split(" ").slice(1).join(" ") || "";
    const currentBirthDate = profile.profile?.birthDate || profile.profile?.dateOfBirth || "";
    const currentGender = profile.profile?.gender || "";

    const hasFormChanges =
      formData.firstName !== currentFirstName ||
      formData.lastName !== currentLastName ||
      formData.birthDate !== currentBirthDate ||
      formData.gender !== currentGender ||
      selectedPhotoFile !== null;

    setHasChanges(hasFormChanges);
  }, [formData, user, profile, selectedPhotoFile]);

  // Confirmar antes de salir si hay cambios
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validar en tiempo real
    if (field === "birthDate") {
      const validation = validateDateOfBirth(value);
      if (!validation.valid) {
        setErrors((prev) => ({
          ...prev,
          birthDate: validation.error || "",
        }));
      } else {
        setErrors((prev) => ({ ...prev, birthDate: "" }));
      }
    }

    if (field === "firstName") {
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          firstName: "El nombre no puede estar vacío",
        }));
      } else {
        setErrors((prev) => ({ ...prev, firstName: "" }));
      }
    }

    if (field === "lastName") {
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          lastName: "El apellido no puede estar vacío",
        }));
      } else {
        setErrors((prev) => ({ ...prev, lastName: "" }));
      }
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de archivo no válido. Use JPG, PNG o WebP");
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("La imagen es demasiado grande. Máximo 5MB");
      return;
    }

    setSelectedPhotoFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Validar campos obligatorios
    if (!formData.firstName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    if (!formData.lastName.trim()) {
      toast.error("El apellido no puede estar vacío");
      return;
    }

    if (errors.birthDate || errors.firstName || errors.lastName) {
      toast.error("Por favor corrija los errores antes de guardar");
      return;
    }

    if (!user) {
      toast.error("No hay usuario autenticado");
      return;
    }

    setSaving(true);
    try {
      // 1. Subir foto si hay una seleccionada
      let newPhotoURL = user.photoURL;
      if (selectedPhotoFile) {
        setUploadingPhoto(true);
        try {
          newPhotoURL = await uploadProfilePhoto(selectedPhotoFile, user.uid);
          await updatePhotoURL(user, newPhotoURL);
          toast.success("Foto de perfil actualizada");
        } catch (error: any) {
          console.error("Error al subir foto:", error);
          toast.error(error.message || "Error al subir la foto");
          setSaving(false);
          setUploadingPhoto(false);
          return; // Salir si hay error al subir la foto
        } finally {
          setUploadingPhoto(false);
        }
      }

      // 2. Actualizar displayName y nombre/apellido
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      if (fullName !== user.displayName) {
        await updateDisplayName(user, fullName);
      }

      // 3. Actualizar datos del perfil en Firestore
      // Guardar el género solo si tiene un valor, de lo contrario null
      const genderValue = formData.gender && formData.gender.trim() ? formData.gender.trim() : null;
      
      await updateUserProfile(user.uid, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate.trim() || null,
        gender: genderValue,
      });

      toast.success("Perfil actualizado exitosamente");
      setHasChanges(false);
      setSelectedPhotoFile(null);
      setSaving(false);

      // Redirigir a la página del perfil
      router.push("/profile");
    } catch (error: any) {
      console.error("Error al actualizar el perfil:", error);
      toast.error(error.message || "Error al actualizar el perfil");
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
      );
      if (!confirmed) return;
    }
    router.back();
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600">No hay usuario autenticado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Editar Perfil</h1>
          <Button
            onClick={handleSave}
            disabled={saving || uploadingPhoto || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : uploadingPhoto ? "Subiendo..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Foto de perfil */}
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Foto de perfil"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Haz clic en la cámara para cambiar tu foto
          </p>
        </div>

        {/* Información personal */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Información personal
          </h2>

          {/* Nombre */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              Nombre *
            </Label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              placeholder="Juan"
              className={`border-gray-300 ${errors.firstName ? "border-red-500" : ""}`}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Apellido */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              Apellido *
            </Label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              placeholder="Pérez"
              className={`border-gray-300 ${errors.lastName ? "border-red-500" : ""}`}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Correo electrónico */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4" />
              Correo electrónico
            </Label>
            <Input
              value={formData.email}
              readOnly
              disabled
              className="border-gray-300 bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              Fecha de nacimiento
            </Label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleFieldChange("birthDate", e.target.value)}
              className={`border-gray-300 ${errors.birthDate ? "border-red-500" : ""}`}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.birthDate && (
              <p className="text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>

          {/* Género */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4" />
              Género
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleFieldChange("gender", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un género (opcional)">
                  {formData.gender === "masculino" && "Masculino"}
                  {formData.gender === "femenino" && "Femenino"}
                  {formData.gender === "otro" && "Otro"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

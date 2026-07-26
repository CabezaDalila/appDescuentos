/**
 * Servicio de perfil — datos y fotos en Supabase.
 * Perfil/nombre/foto-URL en public.profiles; foto de perfil en Supabase
 * Storage (bucket `profile-photos`).
 */
import { supabase } from "@/lib/supabase/client";
import { getProfile, updateProfileFields } from "@/lib/supabase/profiles";

const PROFILE_PHOTOS_BUCKET = "profile-photos";

/**
 * Obtiene el perfil completo del usuario desde Supabase.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(userId) {
    if (!userId) throw new Error("userId es requerido");
    return await getProfile(userId);
}

/**
 * Actualiza los datos del perfil del usuario.
 * @param {string} userId
 * @param {Object} profileData - { firstName, lastName, birthDate, gender }
 */
export async function updateUserProfile(userId, profileData) {
    if (!userId) throw new Error("userId es requerido");

    const genderValue = profileData.gender && profileData.gender.trim()
        ? profileData.gender.trim()
        : null;

    await updateProfileFields(userId, {
        first_name: profileData.firstName || null,
        last_name: profileData.lastName || null,
        birth_date: profileData.birthDate || null,
        gender: genderValue,
    });
}

/**
 * Actualiza el displayName (full_name) del usuario en Supabase (auth + profile).
 * También setea firstName/lastName derivados del nombre.
 * @param {{uid: string}} user - Usuario (se usa el uid)
 * @param {string} displayName - Nuevo nombre a mostrar
 */
export async function updateDisplayName(user, displayName) {
    if (!user) throw new Error("user es requerido");
    if (!displayName || displayName.trim() === "") {
        throw new Error("displayName no puede estar vacío");
    }
    const name = displayName.trim();

    // Metadata de auth (lo lee el useAuth adaptado para el header/avatar).
    await supabase.auth.updateUser({ data: { full_name: name } });

    // Tabla profiles.
    await updateProfileFields(user.uid, {
        full_name: name,
        first_name: name.split(" ")[0] || null,
        last_name: name.split(" ").slice(1).join(" ") || null,
    });
}

/**
 * Sube una foto de perfil a Supabase Storage y retorna la URL pública.
 * El objeto se guarda como `{userId}/{timestamp}.ext` en el bucket
 * `profile-photos` (RLS: cada usuario escribe solo en su carpeta).
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function uploadProfilePhoto(file, userId) {
    if (!file) throw new Error("file es requerido");
    if (!userId) throw new Error("userId es requerido");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Usuario no autenticado. Por favor, inicia sesión nuevamente.");
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
        throw new Error("Tipo de archivo no válido. Use JPG, PNG o WebP");
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error("La imagen es demasiado grande. Máximo 5MB");
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const path = `${userId}/${timestamp}.${fileExtension}`;

    const { error } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
        console.error("Error detallado al subir foto:", error);
        throw new Error(error.message || "Error al subir la imagen");
    }

    const { data } = supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Actualiza la foto de perfil del usuario en Supabase (auth + profile).
 * @param {{uid: string}} user - Usuario (se usa el uid)
 * @param {string} photoURL - URL de la nueva foto
 */
export async function updatePhotoURL(user, photoURL) {
    if (!user) throw new Error("user es requerido");
    if (!photoURL || photoURL.trim() === "") {
        throw new Error("photoURL no puede estar vacío");
    }
    const url = photoURL.trim();
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    await updateProfileFields(user.uid, { photo_url: url });
}

/**
 * Valida el formato de un número de teléfono.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    if (!phone) return true;
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 8;
}

/**
 * Valida una fecha de nacimiento.
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {{valid: boolean, error?: string}}
 */
export function validateDateOfBirth(dateString) {
    if (!dateString) return { valid: true };

    const date = new Date(dateString);
    const now = new Date();

    if (isNaN(date.getTime())) {
        return { valid: false, error: "Fecha no válida" };
    }
    if (date > now) {
        return { valid: false, error: "La fecha debe ser en el pasado" };
    }

    const age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    const dayDiff = now.getDate() - date.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 13) {
        return { valid: false, error: "Debes tener al menos 13 años" };
    }
    if (actualAge > 130) {
        return { valid: false, error: "Fecha no válida" };
    }
    return { valid: true };
}

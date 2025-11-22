import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, doc, getDoc, setDoc, updateDoc, deleteField, storage, auth } from "@/lib/firebase/firebase";
import { serverTimestamp } from "firebase/firestore";

/**
 * Obtiene el perfil completo del usuario desde Firestore
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(userId) {
    if (!userId) throw new Error("userId es requerido");

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;
    return userSnap.data();
}

/**
 * Limpia campos duplicados de nivel superior que deberían estar solo en profile
 * @param {string} userId 
 */
async function cleanDuplicateProfileFields(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data();
        const fieldsToRemove = {};
        let hasFieldsToRemove = false;
        
        // Verificar si existen campos duplicados de nivel superior
        if (userData["profile.firstName"] !== undefined) {
            fieldsToRemove["profile.firstName"] = deleteField();
            hasFieldsToRemove = true;
        }
        if (userData["profile.lastName"] !== undefined) {
            fieldsToRemove["profile.lastName"] = deleteField();
            hasFieldsToRemove = true;
        }
        // Eliminar dateOfBirth si existe (deprecated, usar birthDate)
        if (userData["profile.dateOfBirth"] !== undefined) {
            fieldsToRemove["profile.dateOfBirth"] = deleteField();
            hasFieldsToRemove = true;
        }
        if (userData["profile.gender"] !== undefined) {
            fieldsToRemove["profile.gender"] = deleteField();
            hasFieldsToRemove = true;
        }
        
        // Eliminar campos duplicados si existen
        if (hasFieldsToRemove) {
            await updateDoc(userRef, fieldsToRemove);
        }
    } catch (error) {
        // Silenciar errores de limpieza para no interrumpir el flujo principal
        console.warn("Error al limpiar campos duplicados:", error);
    }
}

/**
 * Actualiza los datos del perfil del usuario en Firestore
 * Usa el objeto profile anidado para evitar duplicación
 * @param {string} userId 
 * @param {Object} profileData - Datos del perfil a actualizar
 * @param {string} profileData.firstName - Nombre
 * @param {string} profileData.lastName - Apellido
 * @param {string} profileData.birthDate - Fecha de nacimiento
 * @param {string} profileData.gender - Género (masculino, femenino, otro)
 */
export async function updateUserProfile(userId, profileData) {
    if (!userId) throw new Error("userId es requerido");

    const userRef = doc(db, "users", userId);

    // Obtener el documento actual para preservar otros campos del profile
    const currentDoc = await getDoc(userRef);
    const currentData = currentDoc.exists() ? currentDoc.data() : {};
    const currentProfile = currentData.profile || {};

    // Preparar el valor del género - solo guardar si tiene un valor válido
    const genderValue = profileData.gender && profileData.gender.trim() 
        ? profileData.gender.trim() 
        : null;

    // Construir el objeto profile completo preservando campos existentes
    // Migrar dateOfBirth a birthDate si existe
    const updatedProfile = {
        ...currentProfile,
        firstName: profileData.firstName || null,
        lastName: profileData.lastName || null,
        birthDate: profileData.birthDate || null,
        gender: genderValue,
        // Eliminar dateOfBirth si existe (deprecated)
        ...(currentProfile.dateOfBirth !== undefined ? { dateOfBirth: null } : {}),
    };

    // Actualizar usando el objeto profile completo (no notación de punto)
    const updateData = {
        profile: updatedProfile,
        updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, updateData, { merge: true });

    // Limpiar campos duplicados de nivel superior si existen
    await cleanDuplicateProfileFields(userId);
    
    // Eliminar dateOfBirth del objeto profile si existe
    if (currentProfile.dateOfBirth !== undefined) {
        await updateDoc(userRef, {
            "profile.dateOfBirth": deleteField(),
        });
    }
}

/**
 * Actualiza el displayName del usuario en Firebase Auth y Firestore
 * Actualiza también firstName y lastName en el objeto profile (no duplicados)
 * @param {import('firebase/auth').User} user - Usuario de Firebase Auth
 * @param {string} displayName - Nuevo nombre a mostrar
 */
export async function updateDisplayName(user, displayName) {
    if (!user) throw new Error("user es requerido");
    if (!displayName || displayName.trim() === "") {
        throw new Error("displayName no puede estar vacío");
    }

    // Actualizar en Firebase Auth
    await updateProfile(user, { displayName: displayName.trim() });

    // Actualizar en Firestore
    const userRef = doc(db, "users", user.uid);
    
    // Obtener el perfil actual para preservar otros campos
    const currentDoc = await getDoc(userRef);
    const currentData = currentDoc.exists() ? currentDoc.data() : {};
    const currentProfile = currentData.profile || {};

    // Actualizar el objeto profile (no usar notación de punto para evitar duplicados)
    const updatedProfile = {
        ...currentProfile,
        firstName: displayName.trim().split(" ")[0] || null,
        lastName: displayName.trim().split(" ").slice(1).join(" ") || null,
    };

    await setDoc(
        userRef,
        {
            displayName: displayName.trim(),
            profile: updatedProfile,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );

    // Limpiar campos duplicados de nivel superior si existen
    await cleanDuplicateProfileFields(user.uid);
}

/**
 * Sube una foto de perfil a Firebase Storage y retorna la URL
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} URL de descarga de la imagen
 */
export async function uploadProfilePhoto(file, userId) {
    if (!file) throw new Error("file es requerido");
    if (!userId) throw new Error("userId es requerido");

    // Verificar que el usuario esté autenticado
    if (!auth.currentUser) {
        throw new Error("Usuario no autenticado. Por favor, inicia sesión nuevamente.");
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
        throw new Error("Tipo de archivo no válido. Use JPG, PNG o WebP");
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error("La imagen es demasiado grande. Máximo 5MB");
    }

    // Crear referencia de storage
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const storageRef = ref(storage, `profile-photos/${userId}/${timestamp}.${fileExtension}`);

    // Subir archivo con metadata
    const metadata = {
        contentType: file.type,
        customMetadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
        },
    };

    try {
        const snapshot = await uploadBytes(storageRef, file, metadata);

        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error("Error detallado al subir foto:", error);
        // Proporcionar mensajes de error más específicos
        if (error.code === "storage/unauthorized") {
            throw new Error("No tienes permisos para subir archivos. Verifica tu sesión.");
        } else if (error.code === "storage/canceled") {
            throw new Error("La subida fue cancelada.");
        } else if (error.code === "storage/unknown") {
            throw new Error("Error desconocido al subir la imagen. Intenta nuevamente.");
        }
        throw new Error(error.message || "Error al subir la imagen");
    }
}

/**
 * Actualiza la foto de perfil del usuario en Firebase Auth y Firestore
 * @param {import('firebase/auth').User} user - Usuario de Firebase Auth
 * @param {string} photoURL - URL de la nueva foto
 */
export async function updatePhotoURL(user, photoURL) {
    if (!user) throw new Error("user es requerido");
    if (!photoURL || photoURL.trim() === "") {
        throw new Error("photoURL no puede estar vacío");
    }

    // Actualizar en Firebase Auth
    await updateProfile(user, { photoURL: photoURL.trim() });

    // Actualizar en Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(
        userRef,
        {
            photoURL: photoURL.trim(),
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

/**
 * Valida el formato de un número de teléfono
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    if (!phone) return true; // El teléfono es opcional

    // Formato básico: +54 11 1234-5678 o similares
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 8;
}

/**
 * Valida una fecha de nacimiento
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {{valid: boolean, error?: string}}
 */
export function validateDateOfBirth(dateString) {
    if (!dateString) return { valid: true }; // Es opcional

    const date = new Date(dateString);
    const now = new Date();

    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
        return { valid: false, error: "Fecha no válida" };
    }

    // Verificar que sea en el pasado
    if (date > now) {
        return { valid: false, error: "La fecha debe ser en el pasado" };
    }

    // Verificar edad mínima de 13 años
    const age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    const dayDiff = now.getDate() - date.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 13) {
        return { valid: false, error: "Debes tener al menos 13 años" };
    }

    // Verificar edad máxima razonable (130 años)
    if (actualAge > 130) {
        return { valid: false, error: "Fecha no válida" };
    }

    return { valid: true };
}

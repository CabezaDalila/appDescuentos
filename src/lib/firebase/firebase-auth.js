import {
    applyActionCode,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from "firebase/auth";
import {
    doc,
    getDoc,
    increment,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// Registro
export const register = async (email, password, displayName = null) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Actualizar displayName si se proporciona
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }

  // Guardar datos del usuario antes de cerrar sesión
  await saveUserToFirestore(result.user);

  // Enviar email de verificación
  const actionCodeSettings = {
    // URL a la que se redirigirá después de hacer clic en el enlace
    url:
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : "https://app-descuentos-gvnpe8xm0-dalilacabeza-gmailcoms-projects.vercel.app/login",
    // Configuración adicional
    handleCodeInApp: true,
  };

  await sendEmailVerification(result.user, actionCodeSettings);

  // Cerrar sesión inmediatamente para que el usuario tenga que verificar su email primero
  await signOut(auth);

  return result;
};

export const login = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);

  // Verificar si el email está verificado
  if (!result.user.emailVerified) {
    // Cerrar sesión si el email no está verificado
    await signOut(auth);
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  await saveUserToFirestore(result.user);
  return result;
};

export const logout = async () => {
  return signOut(auth);
};

export const resetPassword = async (email) => {
  const actionCodeSettings = {
    // URL a la que se redirigirá después de hacer clic en el enlace
    url: typeof window !== "undefined" 
      ? `${window.location.origin}/reset-password`
      : "https://app-descuentos-one.vercel.app/reset-password",
  };

  return sendPasswordResetEmail(auth, email, actionCodeSettings);
};

const saveUserToFirestore = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const isNewUser = !userDoc.exists();
    const existingData = userDoc.exists() ? userDoc.data() : null;

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified || false,
      providerId: user.providerId || "google.com",
      isActive: true,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      lastLoginIP: null,
      appInfo: {
        version: "1.0.0",
        platform: typeof window !== "undefined" ? "web" : "mobile",
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : null,
      },
    };
    if (isNewUser) {
      userData.createdAt = serverTimestamp();
      userData.loginCount = 1;
      userData.role = "user";
      userData.preferences = {
        notifications: {
          email: true,
          push: true,
          discounts: true,
          promotions: true,
        },
        theme: "light",
        language: "es",
        currency: "ARS",
      };

      userData.activity = {
        totalLogins: 1,
        lastActivityAt: serverTimestamp(),
        favoriteCategories: [],
        savedDiscounts: [],
        sharedDiscounts: 0,
      };

      userData.profile = {
        firstName: user.displayName?.split(" ")[0] || null,
        lastName: user.displayName?.split(" ").slice(1).join(" ") || null,
        phone: null,
        birthDate: null,
        gender: null,
        location: {
          country: null,
          city: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
      userData.privacy = {
        profileVisible: true,
        emailVisible: false,
        activityVisible: true,
      };
    } else {
      userData.loginCount = increment(1);
      userData.activity = {
        totalLogins: increment(1),
        lastActivityAt: serverTimestamp(),
      };
      // Preservar el estado del onboarding si ya existe
      if (existingData?.onboarding) {
        userData.onboarding = existingData.onboarding;
      } else if (user.emailVerified) {
        // Si el email está verificado pero no hay onboarding, inicializarlo
        // Esto ocurre cuando el usuario inicia sesión por primera vez después de verificar
        userData.onboarding = {
          completed: false,
          spendingCategories: [],
          mainGoal: "",
          banks: [],
        };
      }
      // Preservar el rol si ya existe (importante para admins)
      if (existingData?.role) {
        userData.role = existingData.role;
      }
    }

    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error guardando usuario en Firestore:", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await saveUserToFirestore(result.user);
    return result;
  } catch (error) {
    console.error("Error en login con Google:", error);
    throw error;
  }
};

export const loginWithGoogleNative = async () => {
  try {
    const { GoogleAuth } = await import(
      "@codetrix-studio/capacitor-google-auth"
    );
    const googleUser = await GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(
      googleUser.authentication.idToken
    );
    const result = await signInWithCredential(auth, credential);
    await saveUserToFirestore(result.user);
    return result;
  } catch (error) {
    console.error("Error en login nativo con Google:", error);
    throw error;
  }
};

// Verificar email con código de acción
export const verifyEmail = async (oobCode) => {
  return applyActionCode(auth, oobCode);
};

// Reenviar email de verificación
export const resendEmailVerification = async (user) => {
  const actionCodeSettings = {
    // URL a la que se redirigirá después de hacer clic en el enlace
    url:
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : "https://app-descuentos-one.vercel.app/login",
  };

  return sendEmailVerification(user, actionCodeSettings);
};

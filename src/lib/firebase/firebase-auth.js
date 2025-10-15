import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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
export const register = async (email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await saveUserToFirestore(result.user);
  return result;
};

export const login = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await saveUserToFirestore(result.user);
  return result;
};

export const logout = async () => {
  return signOut(auth);
};

export const resetPassword = async (email) => {
  const actionCodeSettings = {
    // URL a la que se redirigirá después de hacer clic en el enlace
    url: "https://app-descuentos-mv0eb3mlj-dalilacabeza-gmailcoms-projects.vercel.app/reset-password",
    // Configuración adicional
    handleCodeInApp: true,
  };

  return sendPasswordResetEmail(auth, email, actionCodeSettings);
};

const saveUserToFirestore = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const isNewUser = !userDoc.exists();
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
    }

    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error guardando usuario en Firestore:", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  await saveUserToFirestore(result.user);
  return result;
};

export const loginWithGoogleNative = async () => {
  try {
    // Import dinámico para evitar errores en web
    const { GoogleAuth } = await import(
      "@codetrix-studio/capacitor-google-auth"
    );

    const googleUser = await GoogleAuth.signIn();

    const idToken = googleUser.authentication.idToken;

    const credential = GoogleAuthProvider.credential(idToken);

    const result = await signInWithCredential(auth, credential);

    await saveUserToFirestore(result.user);

    return result;
  } catch (error) {
    console.error("Error en login nativo de Google:", error);
    throw error;
  }
};

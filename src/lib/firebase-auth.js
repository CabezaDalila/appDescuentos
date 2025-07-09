import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signInWithCredential, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Registro
export const register = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login
export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout
export const logout = async () => {
  return signOut(auth);
};

// Login con Google (Web - navegador)
export const loginWithGoogle = async () => {
  return signInWithPopup(auth, new GoogleAuthProvider());
};

// Login con Google (Nativo - Capacitor/Android)
export const loginWithGoogleNative = async () => {
  try {
    // Import dinámico para evitar errores en web
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    
    // 1. Login nativo con Google
    const googleUser = await GoogleAuth.signIn();
    
    // 2. Obtener el idToken
    const idToken = googleUser.authentication.idToken;
    
    // 3. Crear credencial de Firebase
    const credential = GoogleAuthProvider.credential(idToken);
    
    // 4. Login en Firebase
    return signInWithCredential(auth, credential);
  } catch (error) {
    console.error('Error en login nativo de Google:', error);
    throw error;
  }
};
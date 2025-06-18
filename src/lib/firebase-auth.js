import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
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

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, new GoogleAuthProvider());
};
// src/utils/auth.js
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error; // Propagamos el error para manejarlo en el componente
  }
};

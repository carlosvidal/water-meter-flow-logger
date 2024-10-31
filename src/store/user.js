// src/store/user.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const useUserStore = defineStore("user", () => {
  // Estado
  const currentUser = ref(null);
  const userType = ref(null);
  const userData = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => userType.value === "admin");
  const isSuperAdmin = computed(() => userType.value === "superadmin");
  const isEditor = computed(() => userType.value === "editor");
  const isOwner = computed(() => userType.value === "owner");
  const isAnalyst = computed(() => userType.value === "analyst");

  // Acciones
  async function setUser(user) {
    console.log("Setting user in store:", user?.uid);
    currentUser.value = user;

    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userData.value = userDoc.data();
          userType.value = userData.value.userType;
          console.log("User data loaded:", userData.value);
        } else {
          console.warn("No user document found in Firestore");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        throw error;
      }
    }
  }

  async function clearUser() {
    console.log("Clearing user store");
    currentUser.value = null;
    userType.value = null;
    userData.value = null;

    // Asegurarnos de que todas las referencias al usuario se limpien
    localStorage.removeItem("user"); // Si estás usando localStorage
  }

  // Para mantener compatibilidad con el código existente
  function setUserType(type) {
    console.log("Setting user type:", type);
    userType.value = type;
  }

  return {
    // Estado
    currentUser,
    userType,
    userData,

    // Getters
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isOwner,
    isAnalyst,

    // Acciones
    setUser,
    clearUser,
    setUserType, // Mantener para compatibilidad
  };
});

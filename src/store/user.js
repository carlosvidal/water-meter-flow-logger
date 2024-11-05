// src/store/user.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const useUserStore = defineStore("user", () => {
  // Estado
  const currentUser = ref(null);
  const baseRole = ref(null);
  const userData = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => baseRole.value === "admin");
  const isSuperAdmin = computed(() => baseRole.value === "superadmin");
  const isEditor = computed(() => baseRole.value === "editor");
  const isOwner = computed(() => baseRole.value === "owner");
  const isAnalyst = computed(() => baseRole.value === "analyst");

  // Acciones
  async function setUser(user) {
    console.log("Setting user in store:", user?.uid);
    currentUser.value = user;

    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userData.value = userDoc.data();
          baseRole.value = userData.value.baseRole;
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
    baseRole.value = null;
    userData.value = null;
    localStorage.removeItem("user");
  }

  return {
    // Estado
    currentUser,
    baseRole,
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
  };
});

import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: useLocalStorage("currentUser", ""),
    userType: useLocalStorage("userType", ""),
  }),
  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isAdmin: (state) => state.userType === "admin",
    isSuperAdmin: (state) => state.userType === "superadmin",
    isEditor: (state) => state.userType === "editor",
    isAnalyst: (state) => state.userType === "analyst",
    isOwner: (state) => state.userType === "owner",
  },
  actions: {
    setUser(user) {
      this.currentUser = user;
    },
    setUserType(userType) {
      this.userType = userType;
    },
    clearUser() {
      this.currentUser = null;
      this.userType = null;
      console.log("User cleared");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userType");
      localStorage.clear();
    },
  },
});

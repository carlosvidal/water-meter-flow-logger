import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: useLocalStorage("currentUser", null),
    userType: useLocalStorage("userType", null),
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
    async setUser(user) {
      this.currentUser = user;
      console.log("User set");
    },
    async setUserType(userType) {
      this.userType = userType;
      console.log("User type set");
    },
    clearUser() {
      this.currentUser = null;
      this.userType = null;

      localStorage.removeItem("currentUser");
      localStorage.removeItem("userType");
      localStorage.clear();

      console.log("User cleared");
    },
  },
});

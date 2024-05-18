import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: null,
    userType: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isAdmin: (state) => state.userType === "admin",
    isSuperAdmin: (state) => state.userType === "super-admin",
    isEditor: (state) => state.userType === "editor",
    isAnalyst: (state) => state.userType === "analyst",
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
    },
  },
});

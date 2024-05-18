import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: null,
    userType: null,
  }),
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

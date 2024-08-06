// import "./assets/main.css";

import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import { useUserStore } from "./store/user";

import App from "./App.vue";
import router from "./router";
import { auth } from "./firebase";

let app;
const pinia = createPinia();

auth.onAuthStateChanged(() => {
  if (!app) {
    app = createApp(App);
    app.use(pinia);
    app.use(router);
    app.mount("#app");

    const userStore = useUserStore();

    watch(
      pinia.state,
      (state) => {
        localStorage.setItem("userType", JSON.stringify(state.userType));
        localStorage.setItem("currentUser", JSON.stringify(state.currentUser));
      },
      { deep: true }
    );
  }
});

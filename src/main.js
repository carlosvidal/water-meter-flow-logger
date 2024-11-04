import { createApp } from "vue";
import { createPinia } from "pinia";
import { useUserStore } from "./store/user";
import App from "./App.vue";
import router from "./router";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Importar el componente de teléfono y sus estilos DESPUÉS de las otras importaciones
import VueTelInput from "vue-tel-input";
import "vue-tel-input/dist/vue-tel-input.css";

import "./assets/main.css";

const pinia = createPinia();
let app;

onAuthStateChanged(auth, async (user) => {
  if (!app) {
    app = createApp(App);

    // Registrar el componente globalmente con opciones
    app.use(VueTelInput, {
      mode: "international",
      onlyCountries: [
        "PE",
        "AR",
        "BO",
        "CL",
        "CO",
        "CR",
        "CU",
        "DO",
        "EC",
        "SV",
        "GT",
        "HN",
        "MX",
        "NI",
        "PA",
        "PY",
        "PR",
        "UY",
        "VE",
      ],
      preferredCountries: ["PE"],
    });

    app.use(pinia);
    app.use(router);

    const userStore = useUserStore();
    if (user) {
      await userStore.setUser(user);
    } else {
      await userStore.clearUser();
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push("/login");
      }
    }

    app.mount("#app");
  } else {
    const userStore = useUserStore();
    if (user) {
      await userStore.setUser(user);
    } else {
      await userStore.clearUser();
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push("/login");
      }
    }
  }
});

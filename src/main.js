// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import { useUserStore } from "./store/user";
import App from "./App.vue";
import router from "./router";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const pinia = createPinia();
let app;

// Esperar a que Firebase Auth inicialice
onAuthStateChanged(auth, async (user) => {
  if (!app) {
    app = createApp(App);
    app.use(pinia);
    app.use(router);

    const userStore = useUserStore();

    // Inicializar el store con el usuario actual
    if (user) {
      await userStore.setUser(user);
    } else {
      // Si no hay usuario, asegurarse de limpiar el store
      await userStore.clearUser();
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push("/login");
      }
    }

    app.mount("#app");
  } else {
    // Actualizar el store cuando cambie el estado de autenticación
    const userStore = useUserStore();
    if (user) {
      await userStore.setUser(user);
    } else {
      // Si el usuario se desconecta, limpiar el store y redirigir
      await userStore.clearUser();
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push("/login");
      }
    }
  }
});

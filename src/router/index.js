import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/HomeView.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Users from "../views/Users.vue";
import Profile from "../views/Profile.vue";
import Condos from "../views/Condos.vue";
import Condo from "../views/Condo.vue";
import Units from "../views/Units.vue";
import MeterReadings from "../views/MeterReadings.vue";
import Reports from "../views/Reports.vue";
import CreateUnit from "../views/CreateUnit.vue";
import CreateReading from "../views/CreateReading.vue";
import CreateUser from "../views/CreateUser.vue";
import CreateCondo from "@/views/CreateCondo.vue";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { logout } from "../utils/auth";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  {
    path: "/users",
    component: Users,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin"],
    },
  },
  {
    path: "/profile/:id",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/condos",
    component: Condos,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/condo/:id",
    component: Condo,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/units",
    component: Units,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/unit/:id",
    component: () => import("@/views/Unit.vue"),
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/meter-readings",
    component: MeterReadings,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/reports",
    component: Reports,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/create-condo",
    component: CreateCondo,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["superadmin"],
    },
  },
  {
    path: "/create-unit",
    component: CreateUnit,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/create-reading",
    component: CreateReading,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin", "editor"],
    },
  },
  {
    path: "/logout",
    beforeEnter: async (to, from, next) => {
      await logout();
      next("/login");
    },
  },
  {
    path: "/create-user",
    component: CreateUser,
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["owner", "admin", "superadmin"],
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      next("/login");
    } else {
      const userType = await getUserType(currentUser.uid);
      const allowedUserTypes = to.meta.allowedUserTypes || [];
      if (allowedUserTypes.length && !allowedUserTypes.includes(userType)) {
        alert("No tienes permiso para acceder a esta página.");
        next("/");
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

async function getUserType(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().userType;
  } else {
    return null;
  }
}

export default router;

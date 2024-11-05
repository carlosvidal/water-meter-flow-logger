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
import CreateMeterReading from "../views/CreateMeterReading.vue";
import CreateUser from "../views/CreateUser.vue";
import CreateCondo from "@/views/CreateCondo.vue";
import RegisterInvitation from "../views/RegisterInvitation.vue";
import Unauthorized from "../views/Unauthorized.vue";

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
    path: "/unit/:id/edit",
    component: () => import("@/views/UnitEdit.vue"),
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
    path: "/reading/:id",
    component: () => import("../views/Reading.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["superadmin", "admin", "editor", "analyst"],
    },
  },
  {
    path: "/reading/:id/edit",
    component: CreateMeterReading,
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: ["superadmin", "admin", "editor"],
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
    component: CreateMeterReading,
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
  {
    path: "/register/invite",
    component: RegisterInvitation,
    // No requiere autenticación porque es para usuarios nuevos
    meta: { requiresAuth: false },
  },
  {
    path: "/test-invitation",
    component: () => import("../views/TestInvitation.vue"),
    meta: {
      requiresAuth: true,
      allowedUserTypes: ["superadmin", "admin"],
    },
  },
  {
    path: "/unauthorized",
    component: Unauthorized,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const hasRequiredRole = (allowedRoles, userRole) => {
  return allowedRoles.includes(userRole);
};

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const currentUser = auth.currentUser;

  if (requiresAuth && !currentUser) {
    next("/login");
    return;
  }

  if (currentUser) {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.data();
      const userRole = userData?.baseRole;

      // Verificar permisos específicos de la ruta
      if (
        to.meta.allowedRoles &&
        !hasRequiredRole(to.meta.allowedRoles, userRole)
      ) {
        console.log(
          "Access denied. User role:",
          userRole,
          "Required roles:",
          to.meta.allowedRoles
        );
        next("/unauthorized");
        return;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      next("/error");
      return;
    }
  }

  next();
});

async function getUserRole(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().baseRole;
  } else {
    return null;
  }
}

export default router;

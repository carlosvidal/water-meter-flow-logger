<template>
    <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/units" v-if="isAuthenticated && (isAdmin || isSuperAdmin || isEditor)">Units</router-link>
        <router-link to="/meter-readings" v-if="isAuthenticated && (isAdmin || isSuperAdmin || isEditor)">Meter
            Readings</router-link>
        <router-link to="/reports" v-if="isAuthenticated && (isAdmin || isSuperAdmin || isEditor)">Reports</router-link>
        <router-link to="/users" v-if="isAuthenticated && (isAdmin || isSuperAdmin)">Users</router-link>
        <button @click="handleLogout" v-if="isAuthenticated">Logout</button>
        <router-link to="/login" v-else>Login</router-link>
    </nav>
</template>

<script setup>
import { computed } from 'vue'; // Asegúrate de importar `computed`
import { useRouter } from 'vue-router';
import { logout } from '../utils/auth';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const isAuthenticated = computed(() => userStore.isAuthenticated);
const isAdmin = computed(() => userStore.isAdmin);
const isSuperAdmin = computed(() => userStore.isSuperAdmin);
const isEditor = computed(() => userStore.isEditor);

const handleLogout = async () => {
    await logout();
    userStore.clearUser();
    router.push('/login');
};
</script>

<style>
nav {
    display: flex;
    gap: 10px;
}

button {
    background-color: red;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
}
</style>
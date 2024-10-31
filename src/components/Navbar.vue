<!-- src/components/Navbar.vue -->
<template>
    <div class="container">
        <nav>
            <a href="/"><img alt="Logo" src="https://via.placeholder.com/200x70?text=Logo" width="200" height="70"
                    style="display: block; width: 200px;"></a>
            <ul>
                <li v-if="isAuthenticated">
                    <router-link to="/">Home</router-link>
                </li>
                <li v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)">
                    <router-link to="/condos">Condos</router-link>
                </li>
                <li v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)">
                    <router-link to="/units">Units</router-link>
                </li>
                <li v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)">
                    <router-link to="/meter-readings">Readings</router-link>
                </li>
                <li v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)">
                    <router-link to="/reports">Reports</router-link>
                </li>
                <li v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin)">
                    <router-link to="/users">Users</router-link>
                </li>
                <li v-if="isAuthenticated">
                    <router-link :to="`/profile/${userID}`">Profile</router-link>
                </li>
                <li v-if="isAuthenticated"><a @click="handleLogout">Logout</a></li>
                <li v-else>
                    <router-link to="/login">Login</router-link>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup>
import { computed } from 'vue'; // Removemos watchEffect
import { useRouter } from 'vue-router';
import { logout } from '../utils/auth';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const isAuthenticated = computed(() => userStore.isAuthenticated);
const isAdmin = computed(() => userStore.isAdmin);
const isSuperAdmin = computed(() => userStore.isSuperAdmin);
const isEditor = computed(() => userStore.isEditor);
const isOwner = computed(() => userStore.isOwner);
const userID = computed(() => userStore.currentUser?.uid);

const handleLogout = async () => {
    try {
        await logout();
        await userStore.clearUser();
        userStore.$reset();
        router.push('/login');
    } catch (error) {
        console.error('Error during logout:', error);
    }
};
</script>

<style></style>
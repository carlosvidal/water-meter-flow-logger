<!-- src/components/Navbar.vue -->
<template>
    <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <!-- Logo -->
                <div class="flex-shrink-0 flex items-center">
                    <router-link to="/">
                        <img class="h-8 w-auto" src="https://via.placeholder.com/200x70?text=Logo" alt="Logo">
                    </router-link>
                </div>

                <!-- Navigation Links -->
                <div class="flex">
                    <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <!-- Navigation Items -->
                        <router-link v-if="isAuthenticated" to="/"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                            active-class="border-b-2 border-blue-500">
                            Home
                        </router-link>

                        <router-link v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)"
                            to="/condos"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                            active-class="border-b-2 border-blue-500">
                            Condos
                        </router-link>

                        <router-link v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)"
                            to="/units"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                            active-class="border-b-2 border-blue-500">
                            Units
                        </router-link>

                        <router-link v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)"
                            to="/meter-readings"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                            active-class="border-b-2 border-blue-500">
                            Readings
                        </router-link>

                        <router-link v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin || isEditor)"
                            to="/reports"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                            active-class="border-b-2 border-blue-500">
                            Reports
                        </router-link>

                        <router-link v-if="isAuthenticated && (isOwner || isAdmin || isSuperAdmin)" to="/users"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                            active-class="border-b-2 border-blue-500">
                            Users
                        </router-link>
                    </div>
                </div>

                <!-- Right side menu -->
                <div class="flex items-center">
                    <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <router-link v-if="isAuthenticated" :to="`/profile/${userID}`"
                            class="text-sm font-medium text-gray-900 hover:text-blue-600">
                            Profile
                        </router-link>

                        <button v-if="isAuthenticated" @click="handleLogout"
                            class="text-sm font-medium text-gray-900 hover:text-blue-600">
                            Logout
                        </button>

                        <router-link v-else to="/login" class="text-sm font-medium text-gray-900 hover:text-blue-600">
                            Login
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { computed } from 'vue';
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
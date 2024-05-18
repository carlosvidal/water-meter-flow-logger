<template>
    <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/users">Users</router-link>
        <router-link to="/units">Units</router-link>
        <router-link to="/meter-readings">Meter Readings</router-link>
        <router-link to="/reports">Reports</router-link>
        <button @click="handleLogout">Logout</button>
    </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { logout } from '../utils/auth';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

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
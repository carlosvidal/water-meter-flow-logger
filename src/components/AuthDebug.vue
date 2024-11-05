<!-- src/components/AuthDebug.vue -->
<template>
    <div v-if="userStore.userData" class="text-sm text-gray-500 mb-4">
        <div>Usuario: {{ userStore.userData.email }}</div>
        <div>Rol: {{ userStore.userData.baseRole }}</div>
    </div>
</template>

<script setup>
import { useUserStore } from '../store/user';
const userStore = useUserStore();
</script>
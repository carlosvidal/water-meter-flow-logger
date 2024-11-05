<!-- src/views/Unauthorized.vue -->
<template>
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full px-6 py-8 bg-white shadow-lg rounded-lg">
            <h1 class="text-2xl font-bold text-center text-red-600 mb-4">
                Acceso No Autorizado
            </h1>
            <p class="text-gray-600 text-center mb-6">
                No tienes los permisos necesarios para acceder a esta página.
            </p>
            <div class="text-center">
                <router-link to="/" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Volver al Inicio
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
// El script es necesario aunque esté vacío
</script>
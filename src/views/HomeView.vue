<!-- src/views/HomeView.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h1 class="text-4xl font-bold text-gray-900 mb-6">
          Control inteligente del agua para condominios
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          AquaSync simplifica la gestión del consumo de agua en condominios,
          ahorrando tiempo y recursos para administradores y residentes.
        </p>
        <router-link to="/register"
          class="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Comenzar ahora
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div v-for="(feature, index) in features" :key="index"
          class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <component :is="feature.icon" class="h-12 w-12 text-blue-500 mb-4" />
          <h3 class="font-semibold text-lg mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600">{{ feature.description }}</p>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-blue-600 text-white rounded-2xl p-8 text-center">
        <h2 class="text-3xl font-bold mb-4">
          ¿Administras un condominio?
        </h2>
        <p class="text-xl mb-6">
          Únete a los administradores que ya optimizan la gestión del agua con AquaSync
        </p>
        <div class="space-x-4">
          <router-link to="/register"
            class="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Registrarse
          </router-link>
          <router-link to="/about"
            class="inline-block border border-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Conocer más
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const features = [
  {
    icon: 'DropletIcon',
    title: 'Control de Consumo',
    description: 'Monitoreo preciso del consumo de agua por unidad'
  },
  {
    icon: 'BuildingIcon',
    title: 'Gestión de Unidades',
    description: 'Administración eficiente de condominios y residentes'
  },
  {
    icon: 'ChartBarIcon',
    title: 'Reportes Detallados',
    description: 'Informes y estadísticas en tiempo real'
  },
  {
    icon: 'ShieldIcon',
    title: 'Control de Acceso',
    description: 'Gestión de roles y permisos de usuarios'
  }
];

// Componentes de los íconos
const DropletIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  `
};

const BuildingIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2v20M18 2v20M6 12h12M6 7h12M6 17h12"/>
    </svg>
  `
};

const ChartBarIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20V10M18 20V4M6 20v-4"/>
    </svg>
  `
};

const ShieldIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `
};
</script>
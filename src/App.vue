<script setup>
import { RouterLink, RouterView } from 'vue-router';
import Navbar from './components/Navbar.vue';
</script>

<template>
  <header>
    <Navbar />
  </header>

  <main class="container">
    <RouterView />
  </main>
</template>

<style scoped></style>

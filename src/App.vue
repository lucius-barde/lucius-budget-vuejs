<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NavBar />
    <RouterView />
    <footer class="text-center m-4 p-4 text-gray-600 text-xs">
        &copy; 2026 <a href="https://www.bardic.space" target="_blank" class="underline">Bardic.Space</a>
    </footer>
  </div>
</template>

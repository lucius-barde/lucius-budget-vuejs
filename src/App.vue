<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NavBar />
    <RouterView />
    <footer class="text-center p-2 text-white text-xs">
        &copy; 2026 <a href="https://www.bardic.space" target="_blank" class="underline">Bardic.Space</a>
    </footer>
  </div>
</template>

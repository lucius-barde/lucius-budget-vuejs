<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../lib/useAuth'

const router = useRouter()
const { user, signOut } = useAuth()

async function handleSignOut() {
  await signOut()
  router.push('/')
}
</script>

<template>
  <header style="">
    <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 text-white">
        <img id="logo" src="/logo.png" alt="Lucius Budget" class="h-8 w-8" />
        <span :class="['font-semibold', { 'hidden sm:inline': user }]">Lucius Budget</span>
      </RouterLink>
      <nav v-if="user" class="flex items-center gap-4 text-sm text-white">
        <RouterLink to="/" class="hover:opacity-80">Ajouter</RouterLink>
        <RouterLink to="/budget" class="hover:opacity-80">Budget</RouterLink>
        <button @click="handleSignOut" class="hover:opacity-80 cursor-pointer">
          Déconnexion
        </button>
      </nav>
    </div>
  </header>
</template>

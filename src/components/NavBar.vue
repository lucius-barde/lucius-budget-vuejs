<script setup>
import { RouterLink } from 'vue-router'
import { useAuth } from '../lib/useAuth'

const { user, signOut } = useAuth()

async function handleSignOut() {
  await signOut()
}
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
      <RouterLink to="/" class="font-semibold text-gray-900">Lucius Budget</RouterLink>
      <nav v-if="user" class="flex items-center gap-4 text-sm">
        <RouterLink to="/" class="text-gray-600 hover:text-gray-900">Ajouter</RouterLink>
        <RouterLink to="/budget" class="text-gray-600 hover:text-gray-900">Budget</RouterLink>
        <button @click="handleSignOut" class="text-gray-600 hover:text-gray-900 cursor-pointer">
          Déconnexion
        </button>
      </nav>
    </div>
  </header>
</template>

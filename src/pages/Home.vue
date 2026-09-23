<script setup>
import { ref } from 'vue'
import { useAuth } from '../lib/useAuth'
import { createEntry } from '../lib/entries'
import LoginForm from '../components/LoginForm.vue'
import EntryForm from '../components/EntryForm.vue'

const { user, isReady } = useAuth()

const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit(values) {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    await createEntry({
      ...values,
      date: new Date(values.date).toISOString(),
      author: user.value.id,
    })
    success.value = true
  } catch (err) {
    error.value = err.message || "Impossible d'ajouter l'entrée."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex-1 flex items-center justify-center p-4">
    <template v-if="isReady">
      <LoginForm v-if="!user" />
      <div v-else class="w-full max-w-sm mx-auto flex flex-col gap-4">
        <h1 class="text-lg font-semibold text-gray-900 text-center">Ajouter une entrée</h1>
        <p v-if="success" class="text-sm text-green-600 text-center">Entrée ajoutée avec succès !</p>
        <!-- :key force la réinitialisation du formulaire après un ajout réussi -->
        <EntryForm
          :key="success"
          :loading="loading"
          :error="error"
          submit-label="Ajouter"
          @submit="handleSubmit"
        />
      </div>
    </template>
  </main>
</template>

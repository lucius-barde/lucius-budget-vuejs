<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../lib/useAuth'
import { getEntry, updateEntry, toDatetimeLocalValue } from '../lib/entries'
import EntryForm from '../components/EntryForm.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const { user, isReady } = useAuth()
const router = useRouter()

const entry = ref(null)
const loadError = ref('')
const loading = ref(false)
const saveError = ref('')

onMounted(async () => {
  try {
    const data = await getEntry(props.id)
    entry.value = data
  } catch (err) {
    loadError.value = err.message || "Impossible de charger l'entrée."
  }
})

const initialValues = () => ({
  date: toDatetimeLocalValue(new Date(entry.value.date)),
  category: entry.value.category,
  label: entry.value.label,
  amount: entry.value.amount,
  is_income: entry.value.is_income,
})

async function handleSubmit(values) {
  saveError.value = ''
  loading.value = true
  try {
    await updateEntry(props.id, {
      ...values,
      date: new Date(values.date).toISOString(),
    })
    router.push('/budget')
  } catch (err) {
    saveError.value = err.message || "Impossible d'enregistrer les modifications."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex-1 flex items-center justify-center p-4">
    <template v-if="isReady">
      <div v-if="!user" class="text-center text-gray-500">
        Veuillez vous connecter pour accéder à cette page.
      </div>

      <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>

      <div v-else-if="entry" class="w-full max-w-sm mx-auto flex flex-col gap-4">
        <h1 class="text-lg font-semibold text-gray-900 text-center">Éditer l'entrée</h1>
        <EntryForm
          :initial-values="initialValues()"
          :loading="loading"
          :error="saveError"
          submit-label="Enregistrer"
          @submit="handleSubmit"
        />
      </div>

      <p v-else class="text-sm text-gray-500">Chargement...</p>
    </template>
  </main>
</template>

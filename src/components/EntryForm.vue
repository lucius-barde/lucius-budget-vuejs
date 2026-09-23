<script setup>
import { ref, onMounted } from 'vue'
import { CATEGORIES } from '../lib/categories'
import { toDatetimeLocalValue, endOfCurrentMonth, topCategories, topLabels } from '../lib/entries'
import { useAuth } from '../lib/useAuth'

const props = defineProps({
  // Valeurs initiales du formulaire (utilisé aussi bien pour créer que pour éditer)
  initialValues: {
    type: Object,
    default: () => ({}),
  },
  submitLabel: {
    type: String,
    default: 'Ajouter',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit'])

const { user } = useAuth()

const maxDate = toDatetimeLocalValue(endOfCurrentMonth())

const date = ref(props.initialValues.date ?? toDatetimeLocalValue(new Date()))
const category = ref(props.initialValues.category ?? CATEGORIES[0])
const label = ref(props.initialValues.label ?? '')
const amount = ref(props.initialValues.amount ?? '')
const isIncome = ref(props.initialValues.is_income ?? false)

const suggestedCategories = ref([])
const suggestedLabels = ref([])

onMounted(async () => {
  if (!user.value) return
  try {
    suggestedCategories.value = await topCategories(user.value.id)
    suggestedLabels.value = await topLabels(user.value.id)
  } catch {
    // Les suggestions sont un bonus, on ignore silencieusement les erreurs.
  }
})

function pickCategory(value) {
  category.value = value
}

function pickLabel(value) {
  label.value = value
}

function handleSubmit() {
  emit('submit', {
    date: date.value,
    category: category.value,
    label: label.value,
    amount: parseFloat(amount.value),
    is_income: isIncome.value,
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="w-full max-w-sm mx-auto flex flex-col gap-4">
    <div>
      <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Date / Heure</label>
      <input
        id="date"
        v-model="date"
        type="datetime-local"
        :max="maxDate"
        required
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
      <select
        id="category"
        v-model="category"
        required
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </select>
      <div v-if="suggestedCategories.length" class="flex flex-wrap gap-1 mt-1">
        <button
          v-for="c in suggestedCategories"
          :key="c"
          type="button"
          @click="pickCategory(c)"
          class="rounded-md bg-blue-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-blue-200 cursor-pointer"
        >
          {{ c }}
        </button>
      </div>
    </div>

    <div>
      <label for="label" class="block text-sm font-medium text-gray-700 mb-1">Étiquette</label>
      <input
        id="label"
        v-model="label"
        type="text"
        maxlength="32"
        required
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div v-if="suggestedLabels.length" class="flex flex-wrap gap-1 mt-1">
        <button
          v-for="l in suggestedLabels"
          :key="l"
          type="button"
          @click="pickLabel(l)"
          class="rounded-md bg-blue-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-blue-200 cursor-pointer"
        >
          {{ l }}
        </button>
      </div>
    </div>

    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Montant (CHF)</label>
      <input
        id="amount"
        v-model="amount"
        type="number"
        step="0.01"
        min="0"
        required
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        id="is_income"
        v-model="isIncome"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <label for="is_income" class="text-sm font-medium text-gray-700">Est un revenu</label>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button id="loginSubmit"
      type="submit"
      :disabled="loading"
      style="background-color: rgb(50, 70, 97);"
      class="w-full cursor-pointer rounded-md text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
    >
      {{ loading ? 'Enregistrement...' : submitLabel }}
    </button>
  </form>
</template>

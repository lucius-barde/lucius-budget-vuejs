<script setup>
import { ref } from 'vue'
import { CATEGORIES } from '../lib/categories'
import { toDatetimeLocalValue, endOfCurrentMonth } from '../lib/entries'

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

const maxDate = toDatetimeLocalValue(endOfCurrentMonth())

const date = ref(props.initialValues.date ?? toDatetimeLocalValue(new Date()))
const category = ref(props.initialValues.category ?? CATEGORIES[0])
const label = ref(props.initialValues.label ?? '')
const amount = ref(props.initialValues.amount ?? '')
const isIncome = ref(props.initialValues.is_income ?? false)

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

    <button
      type="submit"
      :disabled="loading"
      class="w-full cursor-pointer rounded-md bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
    >
      {{ loading ? 'Enregistrement...' : submitLabel }}
    </button>
  </form>
</template>

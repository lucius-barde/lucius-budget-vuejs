<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuth } from '../lib/useAuth'
import { listEntriesForMonth, duplicateEntry, deleteEntry, formatDateShort } from '../lib/entries'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const { user, isReady } = useAuth()
const router = useRouter()

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth()) // 0-11

const entries = ref([])
const loading = ref(false)
const error = ref('')
const groupExpensesByCategory = ref(false)

const isCurrentMonth = computed(
  () => viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth()
)

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  const label = d.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

const expenses = computed(() => entries.value.filter((e) => !e.is_income))
const incomes = computed(() => entries.value.filter((e) => e.is_income))

const totalExpenses = computed(() => expenses.value.reduce((sum, e) => sum + Number(e.amount), 0))
const totalIncomes = computed(() => incomes.value.reduce((sum, e) => sum + Number(e.amount), 0))
const availableAmount = computed(() => totalIncomes.value - totalExpenses.value)

const groupedExpenses = computed(() => {
  const groups = new Map()
  for (const e of expenses.value) {
    const current = groups.get(e.category) || { category: e.category, count: 0, total: 0 }
    current.count += 1
    current.total += Number(e.amount)
    groups.set(e.category, current)
  }
  return [...groups.values()].sort((a, b) => b.total - a.total)
})

const currencyFormatter = new Intl.NumberFormat('fr-CH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(amount) {
  return currencyFormatter.format(amount)
}

async function loadEntries() {
  if (!user.value) return
  loading.value = true
  error.value = ''
  try {
    entries.value = await listEntriesForMonth(user.value.id, viewYear.value, viewMonth.value)
  } catch (err) {
    error.value = err.message || 'Impossible de charger les entrées.'
  } finally {
    loading.value = false
  }
}

function goToPreviousMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function goToNextMonth() {
  if (isCurrentMonth.value) return
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function toggleGroupExpenses() {
  groupExpensesByCategory.value = !groupExpensesByCategory.value
}

watch([viewYear, viewMonth, user], loadEntries, { immediate: true })

// Gestion des boîtes de dialogue de confirmation (duplication / suppression)
const dialog = ref({ type: null, entry: null })

function askDuplicate(entry) {
  dialog.value = { type: 'duplicate', entry }
}

function askDelete(entry) {
  dialog.value = { type: 'delete', entry }
}

function closeDialog() {
  dialog.value = { type: null, entry: null }
}

const dialogMessage = computed(() => {
  if (!dialog.value.entry) return ''
  const { category, label } = dialog.value.entry
  if (dialog.value.type === 'duplicate') {
    return `Dupliquer l'entrée ${category} - ${label} ?`
  }
  if (dialog.value.type === 'delete') {
    return `Voulez-vous vraiment supprimer l'entrée ${category} - ${label} ?`
  }
  return ''
})

async function confirmDialog() {
  const { type, entry } = dialog.value
  if (!entry) return
  try {
    if (type === 'duplicate') {
      const created = await duplicateEntry(entry)
      closeDialog()
      router.push(`/entry/${created.id}/edit`)
      return
    }
    if (type === 'delete') {
      await deleteEntry(entry.id)
      entries.value = entries.value.filter((e) => e.id !== entry.id)
    }
  } catch (err) {
    error.value = err.message || "Une erreur est survenue."
  } finally {
    closeDialog()
  }
}
</script>

<template>
  <main class="flex-1 p-4">
    <template v-if="isReady">
      <div v-if="!user" class="text-center text-gray-500 mt-10">
        Veuillez vous connecter pour accéder à cette page.
      </div>

      <div v-else class="max-w-3xl mx-auto flex flex-col gap-6">
        <div class="flex items-center justify-between">
          <button
            type="button"
            @click="goToPreviousMonth"
            class="month-selector rounded-md p-2 text-gray-600 hover:bg-gray-100 cursor-pointer"
            aria-label="Mois précédent"
          >
            ←
          </button>
          <h1 class="text-lg font-semibold text-gray-900">{{ monthLabel }}</h1>
          <button
            type="button"
            @click="goToNextMonth"
            :disabled="isCurrentMonth"
            class="month-selector rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <!--<p v-if="loading" class="text-sm text-gray-500">Chargement...</p>-->

        <section>
          <h2 class="text-sm font-semibold text-gray-700 mb-2">
            {{ groupExpensesByCategory ? 'Dépenses (groupées)' : 'Dépenses' }}
          </h2>

          <div v-if="!groupExpensesByCategory" class="overflow-x-auto rounded-md border border-blue-200">
            <table class="w-full text-sm">
              <thead class="bg-blue-200 text-gray-700">
                <tr>
                  <th class="px-2 py-2 text-left font-medium">Date</th>
                  <th class="px-2 py-2 text-left font-medium">Catégorie</th>
                  <th class="px-2 py-2 text-left font-medium">Étiquette</th>
                  <th class="px-2 py-2 text-right font-medium">Prix</th>
                  <th class="px-2 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="entry in expenses" :key="entry.id">
                  <td class="px-2 py-2 whitespace-nowrap text-gray-700">{{ formatDateShort(entry.date) }}</td>
                  <td class="px-2 py-2 text-gray-700">{{ entry.category }}</td>
                  <td class="px-2 py-2 text-gray-700">{{ entry.label }}</td>
                  <td class="px-2 py-2 text-right text-gray-700 whitespace-nowrap">{{ formatAmount(entry.amount) }}</td>
                  <td class="px-2 py-2">
                    <div class="flex flex-nowrap justify-end gap-1">
                      <button
                        type="button"
                        @click="askDuplicate(entry)"
                        style="background-color: rgb(50, 70, 97);"
                        class="rounded-md px-2 py-1 text-xs font-medium text-white hover:opacity-90 cursor-pointer"
                      >
                        Dupliquer
                      </button>
                      <RouterLink
                        :to="`/entry/${entry.id}/edit`"
                        style="background-color: rgb(50, 70, 97);"
                        class="rounded-md px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                      >
                        Éditer
                      </RouterLink>
                      <button
                        type="button"
                        @click="askDelete(entry)"
                        class="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && expenses.length === 0">
                  <td colspan="5" class="px-2 py-4 text-center text-gray-400">Aucune dépense ce mois-ci.</td>
                </tr>
              </tbody>
              <tfoot class="bg-blue-200 text-gray-700">
                <tr>
                  <td colspan="3" class="px-2 py-2 text-left font-medium">Total dépenses</td>
                  <td class="px-2 py-2 text-right font-medium whitespace-nowrap">{{ formatAmount(totalExpenses) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-else class="overflow-x-auto rounded-md border border-blue-200">
            <table class="w-full text-sm">
              <thead class="bg-blue-200 text-gray-700">
                <tr>
                  <th class="px-2 py-2 text-left font-medium">Catégorie</th>
                  <th class="px-2 py-2 text-right font-medium">Quantité</th>
                  <th class="px-2 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="group in groupedExpenses" :key="group.category">
                  <td class="px-2 py-2 text-gray-700">{{ group.category }}</td>
                  <td class="px-2 py-2 text-right text-gray-700">{{ group.count }}</td>
                  <td class="px-2 py-2 text-right text-gray-700 whitespace-nowrap">{{ formatAmount(group.total) }}</td>
                </tr>
                <tr v-if="!loading && groupedExpenses.length === 0">
                  <td colspan="3" class="px-2 py-4 text-center text-gray-400">Aucune dépense ce mois-ci.</td>
                </tr>
              </tbody>
              <tfoot class="bg-blue-200 text-gray-700">
                <tr>
                  <td class="px-2 py-2 text-left font-medium">Total dépenses</td>
                  <td></td>
                  <td class="px-2 py-2 text-right font-medium whitespace-nowrap">{{ formatAmount(totalExpenses) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            type="button"
            @click="toggleGroupExpenses"
            style="background-color: rgb(50, 70, 97);"
            class="mt-2 rounded-md border px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
          >
            {{ groupExpensesByCategory ? 'Dissocier les catégories' : 'Grouper les catégories' }}
          </button>
        </section>

        <section>
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Revenus</h2>
          <div class="overflow-x-auto rounded-md border border-blue-200">
            <table class="w-full text-sm">
              <thead class="bg-blue-200 text-gray-700">
                <tr>
                  <th class="px-2 py-2 text-left font-medium">Date</th>
                  <th class="px-2 py-2 text-left font-medium">Catégorie</th>
                  <th class="px-2 py-2 text-left font-medium">Étiquette</th>
                  <th class="px-2 py-2 text-right font-medium">Prix</th>
                  <th class="px-2 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="entry in incomes" :key="entry.id">
                  <td class="px-2 py-2 whitespace-nowrap text-gray-700">{{ formatDateShort(entry.date) }}</td>
                  <td class="px-2 py-2 text-gray-700">{{ entry.category }}</td>
                  <td class="px-2 py-2 text-gray-700">{{ entry.label }}</td>
                  <td class="px-2 py-2 text-right text-gray-700 whitespace-nowrap">{{ formatAmount(entry.amount) }}</td>
                  <td class="px-2 py-2">
                    <div class="flex flex-nowrap justify-end gap-1">
                      <button
                        type="button"
                        @click="askDuplicate(entry)"
                        style="background-color: rgb(50, 70, 97);"
                        class="rounded-md px-2 py-1 text-xs font-medium text-white hover:opacity-90 cursor-pointer"
                      >
                        Dupliquer
                      </button>
                      <RouterLink
                        :to="`/entry/${entry.id}/edit`"
                        style="background-color: rgb(50, 70, 97);"
                        class="rounded-md px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                      >
                        Éditer
                      </RouterLink>
                      <button
                        type="button"
                        @click="askDelete(entry)"
                        class="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && incomes.length === 0">
                  <td colspan="5" class="px-2 py-4 text-center text-gray-400">Aucun revenu ce mois-ci.</td>
                </tr>
              </tbody>
              <tfoot class="bg-blue-200 text-gray-700">
                <tr>
                  <td colspan="3" class="px-2 py-2 text-left font-medium">Total revenus</td>
                  <td class="px-2 py-2 text-right font-medium whitespace-nowrap">{{ formatAmount(totalIncomes) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <p class="text-sm font-medium" :class="availableAmount < 0 ? 'text-red-600' : 'text-black'">
          Montant disponible : {{ formatAmount(availableAmount) }}
        </p>
      </div>
    </template>

    <ConfirmDialog
      :open="dialog.type !== null"
      :message="dialogMessage"
      :confirm-label="dialog.type === 'delete' ? 'Supprimer' : 'Dupliquer'"
      @confirm="confirmDialog"
      @cancel="closeDialog"
    />
  </main>
</template>

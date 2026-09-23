import { supabase } from './supabase'

// Formate une Date JS en valeur compatible <input type="datetime-local"> (heure locale, sans secondes/TZ).
export function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// Dernière seconde du mois en cours (heure locale), utilisée comme "max" du champ date.
export function endOfCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59)
}

// Formate une date ISO en "jj.mm" (heure locale) pour un affichage compact dans les tableaux.
export function formatDateShort(isoDate) {
  const d = new Date(isoDate)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`
}

export async function createEntry({ date, category, label, amount, is_income, author }) {
  const { data, error } = await supabase
    .from('luciusbudget_entries')
    .insert({ date, category, label, amount, is_income, author })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEntry(id) {
  const { data, error } = await supabase
    .from('luciusbudget_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateEntry(id, { date, category, label, amount, is_income }) {
  const { data, error } = await supabase
    .from('luciusbudget_entries')
    .update({ date, category, label, amount, is_income })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('luciusbudget_entries').delete().eq('id', id)
  if (error) throw error
}

// Duplique une entrée existante avec la date/heure actuelle.
export async function duplicateEntry(entry) {
  const { data, error } = await supabase
    .from('luciusbudget_entries')
    .insert({
      date: new Date().toISOString(),
      category: entry.category,
      label: entry.label,
      amount: entry.amount,
      is_income: entry.is_income,
      author: entry.author,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Retourne les `limit` valeurs les plus fréquentes d'une colonne (category ou label)
// parmi les entrées de l'utilisateur, triées par fréquence décroissante.
async function topValues(authorId, column, limit = 5) {
  const { data, error } = await supabase
    .from('luciusbudget_entries')
    .select(column)
    .eq('author', authorId)

  if (error) throw error

  const counts = new Map()
  for (const row of data) {
    const value = row[column]
    if (!value) continue
    counts.set(value, (counts.get(value) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value)
}

export async function topCategories(authorId, limit = 5) {
  return topValues(authorId, 'category', limit)
}

export async function topLabels(authorId, limit = 5) {
  return topValues(authorId, 'label', limit)
}

export async function listEntriesForMonth(authorId, year, month) {
  // month: 0-11 (comme Date JS)
  const start = new Date(year, month, 1, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('luciusbudget_entries')
    .select('*')
    .eq('author', authorId)
    .gte('date', start.toISOString())
    .lte('date', end.toISOString())
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

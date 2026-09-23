import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Budget from '../pages/Budget.vue'
import EntryEdit from '../pages/EntryEdit.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/budget', name: 'budget', component: Budget },
    { path: '/entry/:id/edit', name: 'entry-edit', component: EntryEdit, props: true },
  ],
})

export default router

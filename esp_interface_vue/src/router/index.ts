import { createRouter, createWebHistory } from 'vue-router'
import BaseView from '../views/BaseView.vue'
import DefaultLayout from '../layouts/default.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      meta: { title: 'Manage' },
      children: [
        {
          path: '',
          name: 'home',
          component: BaseView
        },

      ]
    },
  ]
})

export default router

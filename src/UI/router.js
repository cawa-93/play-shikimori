import Vue from 'vue'
import VueRouter from 'vue-router'

import Player from './player/components/App.vue'
import History from './history/components/App.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    { path: '/history', component: History },
    { path: '/player/anime/:anime/:episode?', component: Player },
    { path: '/', redirect: '/history' },
    { path: '/player', redirect: '/history' },
    { path: '/player/anime', redirect: '/history' },
  ]
})
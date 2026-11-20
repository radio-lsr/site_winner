import { createApp } from 'vue'
import axios from 'axios'
import App from './App.vue'
import router from './router'

// Cookie de session HttpOnly (aucun JWT dans localStorage).
axios.defaults.withCredentials = true
localStorage.removeItem('token') // purge le jeton lisible par JS des anciennes versions

const app = createApp(App)
app.use(router)
app.mount('#app')

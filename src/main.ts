import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.scss'

const demoMediaLibrary = [
  { url: 'https://placehold.co/600x400/2563eb/fff?text=Hero', label: 'Hero' },
  { url: 'https://placehold.co/600x400/16a34a/fff?text=Product', label: 'Product' },
  { url: 'https://placehold.co/600x400/f97316/fff?text=Banner', label: 'Banner' },
  { url: 'https://placehold.co/600x400/a855f7/fff?text=Lifestyle', label: 'Lifestyle' },
  { url: 'https://placehold.co/600x400/ef4444/fff?text=Sale', label: 'Sale' },
  { url: 'https://placehold.co/600x400/0ea5e9/fff?text=Announcement', label: 'Announcement' },
]

createApp({
  render: () =>
    h(App, {
      mediaLibrary: demoMediaLibrary,
      sendTestUrl: '/api/send-test',
    }),
})
  .use(createPinia())
  .mount('#app')

import { defineCustomElement } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.scss'

// Light DOM (shadowRoot: false) — Vue 3.5+. Avoids shadow-DOM gotchas with
// SortableJS/iframe event retargeting. Per-component scoped styles still
// isolate via Vue's data-v attributes; globals come from the host-loaded
// style.css that Vite emits alongside this bundle.
export const MjmlEditorElement = defineCustomElement(App, {
  shadowRoot: false,
  configureApp(app) {
    app.use(createPinia())
  },
})

export function registerMjmlEditor(tagName = 'mjml-editor'): void {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tagName)) {
    customElements.define(tagName, MjmlEditorElement)
  }
}

// Auto-register when loaded as a script; consumers using the ESM build
// can opt out by importing { MjmlEditorElement } directly and skipping this.
registerMjmlEditor()

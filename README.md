# @mixx/mjml-editor

Standalone MJML email editor verpakt als Web Component. Drop een `<mjml-editor>` element in eender welke HTML-pagina, Vue/React/Inertia/Livewire host — geen framework-runtime nodig aan host-zijde.

De editor is bundled met al z'n dependencies (Vue, Pinia, mjml-browser, …) zodat hij naast eender welke stack draait zonder versieconflicten.

## Installatie

```bash
npm install @mixx/mjml-editor
```

Of via CDN (IIFE, registreert `<mjml-editor>` automatisch):

```html
<link rel="stylesheet" href="https://unpkg.com/@mixx/mjml-editor/dist/mjml-editor.css" />
<script src="https://unpkg.com/@mixx/mjml-editor"></script>
```

## Gebruik

### Plain HTML / ES module

```html
<!DOCTYPE html>
<link rel="stylesheet" href="/node_modules/@mixx/mjml-editor/dist/mjml-editor.css" />

<mjml-editor id="editor" send-test-url="/api/send-test"></mjml-editor>

<script type="module">
  import '@mixx/mjml-editor'

  const el = document.getElementById('editor')

  // Complexe waarden moeten als property gezet worden (HTML attributes zijn strings).
  el.mediaLibrary = [
    { url: 'https://example.com/hero.jpg', label: 'Hero' },
    { url: 'https://example.com/product.png', label: 'Product' },
  ]

  el.addEventListener('change', (e) => {
    // Vue's custom element levert de payload als eerste element van detail.
    const payload = e.detail[0]
    console.log(payload.mjml)  // huidige MJML-bron
    console.log(payload.html)  // gecompileerde e-mail-HTML
    console.log(payload.json)  // structureel JSON-document
  })
</script>
```

### Vue host

```vue
<script setup>
import '@mixx/mjml-editor'
import '@mixx/mjml-editor/style.css'

const initial = '<mjml><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>'
const media = [{ url: '/img/logo.png', label: 'Logo' }]

function onChange(e) {
  const { mjml, html, json } = e.detail[0]  // payload zit in detail[0]
}
</script>

<template>
  <mjml-editor
    :initial-mjml="initial"
    :media-library.prop="media"
    send-test-url="/api/send-test"
    @change="onChange"
  />
</template>
```

> Vue herkent `mjml-editor` als custom element. Configureer dit in `vite.config.ts` / Vue compiler-opties:
> ```ts
> vue({ template: { compilerOptions: { isCustomElement: tag => tag === 'mjml-editor' } } })
> ```

### React host

```tsx
import { useEffect, useRef } from 'react'
import '@mixx/mjml-editor'
import '@mixx/mjml-editor/style.css'

export function MailEditor({ mjml, media, onChange }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.mediaLibrary = media        // property, geen attribuut
    const handler = (e) => onChange(e.detail[0])
    ref.current.addEventListener('change', handler)
    return () => ref.current?.removeEventListener('change', handler)
  }, [media, onChange])

  return <mjml-editor ref={ref} initial-mjml={mjml} send-test-url="/api/send-test" />
}
```

### Inertia / Blade / Livewire

Geen build-stap nodig — laad de IIFE direct:

```html
<link rel="stylesheet" href="{{ asset('vendor/mjml-editor/mjml-editor.css') }}" />
<script src="{{ asset('vendor/mjml-editor/mjml-editor.iife.js') }}" defer></script>

<mjml-editor initial-mjml="{{ $template->mjml }}" send-test-url="/admin/email/test"></mjml-editor>
```

## API

### Attributen / Props

| Attribuut | Property | Type | Beschrijving |
|---|---|---|---|
| `initial-mjml` | `initialMjml` | `string` | MJML-bron waarmee de editor opstart. Wijzigingen op deze prop herladen het document. |
| — | `mediaLibrary` | `MediaAsset[]` of JSON-string | Lijst met afbeeldingen voor de image picker. Zet als **property** (objecten kunnen niet via attribuut). |
| `send-test-url` | `sendTestUrl` | `string` | Endpoint dat een POST `{ to, subject, html }` ontvangt voor "test versturen". Niet meegegeven → geen test-knop. |
| `no-persist` | `noPersist` | `boolean` (presence) | Zet als **attribuut** (`<mjml-editor no-persist>`) om de localStorage-auto-restore uit te zetten. Nodig wanneer de host de data zelf beheert (bv. een Filament-veld) — anders delen meerdere editors één opslagsleutel. |

```ts
interface MediaAsset {
  url: string
  label?: string
  thumbnail?: string
}
```

### Events

| Event | Detail | Wanneer |
|---|---|---|
| `change` | `{ mjml: string, html: string, json: MjmlJsonDocument }` | Telkens het document wijzigt (gedebounced). `mjml` is de geserialiseerde bron, `html` de gecompileerde e-mail-HTML (klaar om te versturen — geen aparte MJML-compile aan host-zijde nodig), `json` een structurele weergave. |

> ⚠️ Vue's custom element levert de payload als **`event.detail[0]`** (Vue stopt emit-argumenten in een array), dus lees `event.detail[0].mjml` — niet `event.detail.mjml`.

### Custom tag-naam

De auto-registratie gebruikt `<mjml-editor>`. Wil je een eigen naam, skip dan de auto-import en registreer manueel:

```ts
import { registerMjmlEditor } from '@mixx/mjml-editor'
registerMjmlEditor('my-mail-editor')
```

## Test-mail endpoint

`send-test-url` moet een POST accepteren met JSON body:

```json
{ "to": "user@example.com", "subject": "Test", "html": "<html>…</html>" }
```

Antwoord met HTTP 200 en `{ "ok": true }` bij succes, of een non-2xx status met `{ "error": "…" }`. De editor doet de MJML→HTML compilatie aan client-zijde via `mjml-browser`; het endpoint hoeft enkel SMTP te doen.

## Build outputs

Het package bevat drie bundle-formaten plus losse CSS:

| Bestand | Use case |
|---|---|
| `dist/mjml-editor.es.js` | ESM import (bundlers, modern hosts) |
| `dist/mjml-editor.umd.js` | UMD / CommonJS |
| `dist/mjml-editor.iife.js` | Drop-in `<script src>` zonder bundler |
| `dist/mjml-editor.css` | Stijlen — **altijd apart laden** |

## Lokale development

```bash
npm install
npm run dev          # demo (src/main.ts → index.html)
npm run build:lib    # produceert dist/ voor publicatie
npm run preview:lib  # preview dist/ via demo/element.html
```

`demo/element.html` toont een minimale host-integratie die de gebouwde bundle laadt.

## Licentie

Intern Mixx — niet publiek gepubliceerd.

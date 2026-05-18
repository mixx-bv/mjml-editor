import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

// IPv6 loopback (::1) reaches Mailpit's OrbStack-published *:1025 listener while
// avoiding macOS's FinderSync which holds 127.0.0.1:1025. Override via MJED_SMTP_HOST.
const SMTP_HOST = process.env.MJED_SMTP_HOST || '::1'
const SMTP_PORT = Number(process.env.MJED_SMTP_PORT || 1025)
const FROM_EMAIL = process.env.MJED_FROM_EMAIL || 'editor@mixx.local'

function sendTestEmailPlugin(): PluginOption {
  return {
    name: 'mjed-send-test-email',
    apply: 'serve',
    async configureServer(server) {
      // Dynamic import keeps nodemailer out of any production/library bundle.
      const { default: nodemailer } = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false,
        ignoreTLS: true,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      })

      server.middlewares.use('/api/send-test', (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { to, subject, html } = JSON.parse(body || '{}') as {
              to?: string
              subject?: string
              html?: string
            }
            if (!to || !html) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing "to" or "html"' }))
              return
            }
            const info = await transporter.sendMail({
              from: FROM_EMAIL,
              to,
              subject: subject || 'Test email',
              html,
            })
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, messageId: info.messageId }))
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: msg }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  if (isLib) {
    return {
      // No `customElement: true` here — only App.vue is wrapped as a custom
      // element (via defineCustomElement in web-component.ts); the rest stay
      // normal Vue components.
      plugins: [vue()],
      // Skip copying public/ (favicon, demo icons) into the published bundle.
      publicDir: false,
      define: {
        // Vite's lib mode does NOT auto-replace process.env.NODE_ENV the way
        // app mode does. Vue's runtime reads it (`if (process.env.NODE_ENV ...)`),
        // and without this define it throws "process is not defined" in the browser.
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        lib: {
          entry: fileURLToPath(new URL('./src/web-component.ts', import.meta.url)),
          name: 'MjmlEditor',
          fileName: (format) => `mjml-editor.${format}.js`,
          formats: ['es', 'umd', 'iife'],
        },
        cssCodeSplit: false,
        sourcemap: true,
        emptyOutDir: true,
        rollupOptions: {
          // Everything bundled — drop-in standalone package, no host deps required.
          external: [],
          output: {
            // Emit CSS + any other assets flat into dist/ (no assets/ subdir),
            // so consumers can pin a single predictable path.
            assetFileNames: '[name][extname]',
          },
        },
      },
    }
  }

  // Default: demo dev/build (existing behavior, served from index.html).
  return {
    plugins: [vue(), sendTestEmailPlugin()],
  }
})

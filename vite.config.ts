import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import nodemailer from 'nodemailer'

// IPv6 loopback (::1) reaches Mailpit's OrbStack-published *:1025 listener while
// avoiding macOS's FinderSync which holds 127.0.0.1:1025. Override via MJED_SMTP_HOST.
const SMTP_HOST = process.env.MJED_SMTP_HOST || '::1'
const SMTP_PORT = Number(process.env.MJED_SMTP_PORT || 1025)
const FROM_EMAIL = process.env.MJED_FROM_EMAIL || 'editor@mixx.local'

function sendTestEmailPlugin(): PluginOption {
  return {
    name: 'mjed-send-test-email',
    configureServer(server) {
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

export default defineConfig({
  plugins: [vue(), sendTestEmailPlugin()],
})

import { ref, watch, type Ref } from 'vue'
import { compileMjml } from '../utils/compileMjml'

/**
 * Debounced MJML→HTML compilation with a sequence guard so a slow compile can't
 * overwrite a newer one. Keeps the last good HTML under the error on failure.
 */
export function useMjmlCompiler(mjml: Ref<string>, delay = 80) {
  const compiledHtml = ref('')
  const compileError = ref<string | null>(null)
  let seq = 0
  let timer: number | undefined

  async function compile(source: string) {
    const mine = ++seq
    const { html, error } = await compileMjml(source)
    if (mine !== seq) return
    compileError.value = error
    if (html) compiledHtml.value = html
  }

  watch(
    mjml,
    (source) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => compile(source), delay)
    },
    { immediate: true },
  )

  return { compiledHtml, compileError }
}

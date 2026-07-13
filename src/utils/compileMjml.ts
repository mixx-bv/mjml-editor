import mjml2html from 'mjml-browser'

export interface CompileResult {
  html: string
  error: string | null
}

/**
 * Compile MJML to email HTML with soft validation. Joins any validation errors
 * into a single message (null when there are none) and turns thrown errors into
 * the same shape, so callers never deal with `mjml2html`'s raw result or `any`.
 */
export async function compileMjml(mjml: string): Promise<CompileResult> {
  try {
    const { html, errors } = await mjml2html(mjml, { validationLevel: 'soft' })
    return {
      html: html ?? '',
      error: errors?.length ? errors.map((e) => e.formattedMessage).join('\n') : null,
    }
  } catch (err) {
    return { html: '', error: err instanceof Error ? err.message : String(err) }
  }
}

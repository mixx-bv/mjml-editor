/**
 * Remove the editor's `mjed-*` marker classes (see mjedMarker.ts and serialize.ts
 * `includeEditorIds`) from compiled HTML. mjml2html renders the `css-class` markers
 * only as tokens inside element `class` attributes, so dropping every `mjed-`
 * prefixed token — and the now-empty `class=""` it may leave behind — yields the
 * same email HTML a marker-free compile would, without a second mjml2html pass
 * (review P2). Real classes and all other markup are left untouched.
 */
export function stripEditorMarkers(html: string): string {
  return html.replace(/\sclass="([^"]*)"/g, (_match, value: string) => {
    const kept = value
      .split(/\s+/)
      .filter((token) => token && !token.startsWith('mjed-'))
      .join(' ')

    return kept ? ` class="${kept}"` : ''
  })
}

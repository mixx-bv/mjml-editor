import type { MjmlJsonDocument } from './mjmlJson'

/**
 * One consistent compiled snapshot of the document — every field is derived from
 * the same tree version, so the host can persist all three together (review L1).
 */
export interface DocumentSnapshot {
  /** Clean MJML source (no editor markers). */
  mjml: string
  json: MjmlJsonDocument
  /** Compiled HTML WITH `mjed-*` markers, for the canvas preview. */
  editorHtml: string
  /** Compiled HTML with markers stripped, for the host; '' when uncompilable. */
  emailHtml: string
  error: string | null
}

/** The change payload handed to the embedding host. */
export interface HostChange {
  mjml: string
  html: string
  json: MjmlJsonDocument
}

/**
 * Decide whether a snapshot should be pushed to the host. Returns null — no emit —
 * when there is nothing new to persist:
 *  - no snapshot yet;
 *  - a transient uncompilable source (empty `emailHtml`): keep the host's last
 *    consistent triple instead of pairing fresh mjml/json with stale html (L1);
 *  - a document identical to what the host already holds (`lastSyncedMjml`). This
 *    last case is what stops merely opening a template — which re-serializes every
 *    locale body — from writing each one back untouched (review M1).
 */
export function nextHostChange(
  snapshot: DocumentSnapshot | null,
  lastSyncedMjml: string,
): HostChange | null {
  if (!snapshot || !snapshot.emailHtml) {
    return null
  }

  if (snapshot.mjml === lastSyncedMjml) {
    return null
  }

  return { mjml: snapshot.mjml, html: snapshot.emailHtml, json: snapshot.json }
}

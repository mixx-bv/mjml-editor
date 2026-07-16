import { flattenParagraphs } from './sanitize'
import quillJs from 'quill/dist/quill.js?raw'
import quillCss from 'quill/dist/quill.bubble.css?raw'

// The sandboxed preview iframe's document. It can't import modules, so its
// runtime — Quill included — is inlined here as a string. Quill is bundled from
// the installed package rather than fetched from a CDN, so the privileged
// same-origin iframe never executes third-party code pulled at runtime, and
// inline text-editing keeps working under a strict host CSP / offline (M2).
// flattenParagraphs is injected from its single source (self-contained, uses only
// DOM globals) instead of a hand-mirrored copy (M6).
//
// Defensive escape: stop an inlined asset from closing its host <script>/<style>
// early should a future Quill build ever contain a literal closing sequence.
const inlineQuillJs = quillJs.replace(/<\/script/gi, '<\\/script')
const inlineQuillCss = quillCss.replace(/<\/style/gi, '<\\/style')

export const BRIDGE_SRCDOC = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style id="mjed-quill-css">${inlineQuillCss}</style>
<script>${inlineQuillJs}<\/script>
<style id="mjed-overlay-css">
  body { cursor: default; margin: 0; }

  /* Empty container hints — idle only (DropOverlay shows drop affordance during drag) */
  body:not(.mjed-dragging) .mjed-t-mj-column:not(:has(tr)) {
    min-height: 70px !important;
  }
  body:not(.mjed-dragging) .mjed-t-mj-column:not(:has(tr))::after {
    content: 'Empty column — click to select';
    display: block;
    padding: 18px 12px;
    color: #475569;
    font: 600 12px/1.3 -apple-system, BlinkMacSystemFont, sans-serif;
    text-align: center;
    border: 2px dashed #94a3b8;
    border-radius: 6px;
    margin: 6px;
    background: rgba(148, 163, 184, 0.08);
    cursor: pointer;
    pointer-events: none;
    transition: background 0.1s, border-color 0.1s, color 0.1s;
  }
  body:not(.mjed-dragging) .mjed-t-mj-column:not(:has(tr)):hover::after {
    background: rgba(96, 165, 250, 0.12);
    border-color: #60a5fa;
    color: #1e40af;
  }
  body:not(.mjed-dragging) .mjed-t-mj-section:not(:has(.mjed-t-mj-column)) {
    min-height: 70px !important;
    position: relative;
  }
  body:not(.mjed-dragging) .mjed-t-mj-section:not(:has(.mjed-t-mj-column))::after {
    content: 'Empty section — click to select';
    display: block;
    padding: 18px 12px;
    color: #475569;
    font: 600 12px/1.3 -apple-system, BlinkMacSystemFont, sans-serif;
    text-align: center;
    border: 2px dashed #94a3b8;
    border-radius: 6px;
    margin: 12px;
    background: rgba(148, 163, 184, 0.08);
    pointer-events: none;
    transition: background 0.1s, border-color 0.1s, color 0.1s;
  }
  body:not(.mjed-dragging) .mjed-t-mj-section:not(:has(.mjed-t-mj-column)):hover::after {
    background: rgba(96, 165, 250, 0.12);
    border-color: #60a5fa;
    color: #1e40af;
  }

  /* Hover / selection — suppressed during drag and inline edit */
  .mjed-hover { outline: 2px dashed #93c5fd !important; outline-offset: -2px !important; cursor: pointer; }
  .mjed-selected { outline: 2px solid #2563eb !important; outline-offset: -2px !important; }
  body.mjed-editing .mjed-hover,
  body.mjed-editing .mjed-selected,
  body.mjed-dragging .mjed-hover,
  body.mjed-dragging .mjed-selected { outline: none !important; }

  /* Inline rich-text editor */
  [contenteditable="true"] { outline: 2px solid #2563eb !important; outline-offset: 2px; cursor: text; }
  .mjed-edit-root {
    min-height: 1em;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    font-family: inherit !important;
    font-size: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
  }
  /* Inherit text styles so the editor matches the surrounding mj-text styling. */
  .mjed-edit-root .ql-editor {
    font: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    background: transparent !important;
    text-align: inherit !important;
    padding: 0 !important;
    min-height: 1em !important;
  }
  /* <p> in Quill gets flattened to inline + <br> on commit. Match by killing
     block margins so visual matches the post-flatten rendered output. */
  .mjed-edit-root .ql-editor p {
    font: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    background: transparent !important;
    text-align: inherit !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Reset Quill's list styling to native browser defaults so spacing matches
     the rendered email. */
  .mjed-edit-root .ql-editor ul,
  .mjed-edit-root .ql-editor ol {
    font: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    margin: 1em 0 !important;
    padding-left: 40px !important;
    list-style-position: outside !important;
  }
  .mjed-edit-root .ql-editor li {
    font: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    background: transparent !important;
    text-align: inherit !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  /* Quill's bullet uses \\2022 (•) which is ~20% smaller than the native disc
     marker. Scale it up so edit-mode bullets visually match the rendered email. */
  .mjed-edit-root .ql-editor li[data-list=bullet] > .ql-ui::before {
    font-size: 1.3em !important;
  }
  .ql-bubble .ql-tooltip { z-index: 9999 !important; }
</style>
<style id="mjed-mjml-styles"></style>
</head>
<body></body>
<script>
(function () {
  // allow-same-origin keeps this srcdoc on the host page's origin, so target it
  // explicitly instead of the '*' wildcard when posting back to the parent (S2).
  // Use window.origin, NOT location.origin: for an about:srcdoc document the
  // latter serializes to the string "null", which postMessage rejects as an
  // invalid target origin — breaking the whole ready/render handshake. window.origin
  // returns the inherited host origin the same-origin sandbox actually runs on.
  var PARENT_ORIGIN = window.origin;
  var selectedId = null;
  var editing = null;
  var lastHover = null;

  function parseIds(el) {
    var cls = el.className || '';
    if (typeof cls !== 'string') return null;
    var idMatch = cls.match(/mjed-([a-z]+-[a-z0-9]+-[a-z0-9]+)/);
    var typeMatch = cls.match(/mjed-t-(mj-[a-z]+)/);
    if (!idMatch || !typeMatch) return null;
    return { id: idMatch[1], type: typeMatch[1] };
  }

  function findNodeInfo(el) {
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      var info = parseIds(el);
      if (info) return { el: el, id: info.id, type: info.type };
      el = el.parentElement;
    }
    return null;
  }

  function applySelectionHighlight() {
    document.querySelectorAll('.mjed-selected').forEach(function (n) {
      n.classList.remove('mjed-selected');
    });
    if (selectedId) {
      var t = document.querySelector('.mjed-' + selectedId);
      if (t) t.classList.add('mjed-selected');
    }
  }

  document.addEventListener('mouseover', function (e) {
    if (editing) return;
    var info = findNodeInfo(e.target);
    if (lastHover && (!info || lastHover !== info.el)) lastHover.classList.remove('mjed-hover');
    if (info) { info.el.classList.add('mjed-hover'); lastHover = info.el; }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target && e.target.classList) e.target.classList.remove('mjed-hover');
  });

  document.addEventListener('click', function (e) {
    if (editing && editing.host.contains(e.target)) return;
    if (e.target.closest && e.target.closest('.ql-toolbar,.ql-tooltip,.ql-container,.ql-picker')) return;
    var info = findNodeInfo(e.target);
    if (!info) {
      if (editing) exitEdit(true);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    var targetId = info.id;
    if (info.id === selectedId) {
      if (info.type === 'mj-text' && !editing) {
        enterEdit(info.el, info.id);
        return;
      }
      var parentEl = info.el.parentElement;
      var parentInfo = parentEl ? findNodeInfo(parentEl) : null;
      if (parentInfo && parentInfo.id !== info.id) targetId = parentInfo.id;
    }
    if (editing) exitEdit(true);
    parent.postMessage({ type: 'mjed:select', id: targetId }, PARENT_ORIGIN);
  }, true);

  function enterEdit(host, id) {
    if (editing) exitEdit(true);
    if (typeof Quill === 'undefined') return;
    var wrap = host.querySelector(':scope > div') || host;
    var originalHTML = wrap.innerHTML;
    var editorDiv = document.createElement('div');
    editorDiv.innerHTML = originalHTML;
    editorDiv.className = 'mjed-edit-root';
    wrap.innerHTML = '';
    wrap.appendChild(editorDiv);
    document.body.classList.add('mjed-editing');
    var quill = new Quill(editorDiv, {
      theme: 'bubble',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'clean'],
        ],
      },
    });
    quill.focus();
    quill.setSelection(0, quill.getLength());
    editing = { host: host, wrap: wrap, id: id, quill: quill, originalHTML: originalHTML, range: quill.getSelection() };
    // Remember the caret so a variable picked from the parent panel (which blurs
    // this editor) still inserts at the right spot.
    quill.on('selection-change', function (range) { if (editing && range) editing.range = range; });
    document.addEventListener('keydown', onEditKey, true);
    parent.postMessage({ type: 'mjed:edit-state', editing: true, id: id }, PARENT_ORIGIN);
  }

  function exitEdit(commit) {
    if (!editing) return;
    document.removeEventListener('keydown', onEditKey, true);
    var info = editing;
    editing = null;
    var html = '';
    if (commit) {
      try {
        html = info.quill.getSemanticHTML ? info.quill.getSemanticHTML() : info.quill.root.innerHTML;
      } catch (_) { html = info.quill.root.innerHTML; }
      html = flattenParagraphsLocal(html);
    }
    var unchanged = commit && html === info.originalHTML;
    info.wrap.innerHTML = (commit && !unchanged) ? html : info.originalHTML;
    document.body.classList.remove('mjed-editing');
    parent.postMessage({ type: 'mjed:edit-state', editing: false, id: null }, PARENT_ORIGIN);
    if (commit && !unchanged) {
      parent.postMessage({ type: 'mjed:text-edit', id: info.id, content: html }, PARENT_ORIGIN);
    }
  }

  function onEditKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      exitEdit(false);
    }
  }

  // Injected from src/utils/sanitize.ts so the iframe shares one definition with
  // the store instead of a hand-maintained mirror (M6).
  var flattenParagraphsLocal = ${flattenParagraphs.toString()};

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var data = e.data || {};
    if (data.type === 'mjed:highlight') {
      selectedId = data.id || null;
      applySelectionHighlight();
    } else if (data.type === 'mjed:drag-state') {
      if (data.dragging) {
        document.body.classList.add('mjed-dragging');
        if (lastHover) { lastHover.classList.remove('mjed-hover'); lastHover = null; }
        if (editing) exitEdit(false);
      } else {
        document.body.classList.remove('mjed-dragging');
      }
    } else if (data.type === 'mjed:insert-variable') {
      if (editing && typeof data.token === 'string') {
        var q = editing.quill;
        var r = (editing.range && editing.range.index != null) ? editing.range : { index: q.getLength(), length: 0 };
        // Insert at the END of any selection (never delete) so a variable picked
        // while text is selected — the state right after entering edit — appends
        // instead of wiping the content.
        var at = r.index + (r.length || 0);
        q.insertText(at, data.token, 'user');
        q.setSelection(at + data.token.length, 0, 'user');
        editing.range = { index: at + data.token.length, length: 0 };
      }
    } else if (data.type === 'mjed:render') {
      if (editing) exitEdit(false);
      lastHover = null;
      var styleEl = document.getElementById('mjed-mjml-styles');
      if (styleEl) styleEl.textContent = data.styles || '';
      document.body.className = data.bodyClass || '';
      document.body.innerHTML = data.bodyHTML || '';
      applySelectionHighlight();
    }
  });

  parent.postMessage({ type: 'mjed:ready' }, PARENT_ORIGIN);
})();
<\/script>
</html>`

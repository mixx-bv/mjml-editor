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
        enterEdit(info.el, info.id, { x: e.clientX, y: e.clientY, target: e.target });
        return;
      }
      var parentEl = info.el.parentElement;
      var parentInfo = parentEl ? findNodeInfo(parentEl) : null;
      if (parentInfo && parentInfo.id !== info.id) targetId = parentInfo.id;
    }
    if (editing) exitEdit(true);
    parent.postMessage({ type: 'mjed:select', id: targetId }, PARENT_ORIGIN);
  }, true);

  function enterEdit(host, id, at) {
    if (editing) exitEdit(true);
    var wrap = host.querySelector(':scope > div') || host;
    // Imported templates often nest a full <table>/layout inside an mj-text block.
    // Quill's inline model can't represent that and would flatten it on commit, so
    // such blocks use a native contentEditable mode that edits text in place and
    // leaves the table structure untouched (enterPlainEdit); the simpler
    // inline-formatting blocks go through Quill.
    if (host.querySelector('table')) return enterPlainEdit(host, wrap, id, at);
    if (typeof Quill === 'undefined') return;
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
    editing = { mode: 'quill', host: host, wrap: wrap, id: id, quill: quill, originalHTML: originalHTML, range: quill.getSelection() };
    // Remember the caret so a variable picked from the parent panel (which blurs
    // this editor) still inserts at the right spot.
    quill.on('selection-change', function (range) { if (editing && range) editing.range = range; });
    document.addEventListener('keydown', onEditKey, true);
    parent.postMessage({ type: 'mjed:edit-state', editing: true, id: id }, PARENT_ORIGIN);
  }

  // Native contentEditable edit mode for mj-text blocks that carry a full <table>
  // card layout. Unlike Quill it edits the existing DOM in place, so the table
  // structure survives; commit reads wrap.innerHTML back (see exitEdit). The at
  // param is the click position, used to drop the caret where the user clicked.
  function enterPlainEdit(host, wrap, id, at) {
    var editEl = pickEditable(at, wrap);
    if (!editEl) return; // click didn't land on an editable text run — click the text
    var originalHTML = wrap.innerHTML;
    editEl.setAttribute('contenteditable', 'true');
    document.body.classList.add('mjed-editing');
    editing = { mode: 'plain', host: host, wrap: wrap, editEl: editEl, id: id, originalHTML: originalHTML, savedRange: null };
    placeCaret(editEl, at);
    document.addEventListener('selectionchange', onPlainSelectionChange);
    document.addEventListener('keydown', onEditKey, true);
    parent.postMessage({ type: 'mjed:edit-state', editing: true, id: id }, PARENT_ORIGIN);
  }

  // Native contentEditable on the whole card (root = a bare <table>), or on a table
  // cell that wraps a block <div>, makes Chrome delete catastrophically — Backspace
  // eats the whole block or destroys table structure, and select-all+delete no-ops.
  // So edit only the leaf text RUN the click landed in, resolved from the actual
  // text node at the caret point (not the click target, which is often a cell's
  // padding). The run may never contain a table or block child. Returns null when
  // the click didn't resolve to a safe text run (e.g. mixed text+table blocks).
  var PLAIN_TABLE_EL = { TD: 1, TH: 1, TR: 1, TBODY: 1, THEAD: 1, TFOOT: 1, TABLE: 1, COLGROUP: 1, COL: 1 };
  var PLAIN_BLOCK_EL = {
    DIV: 1, P: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, PRE: 1, SECTION: 1, ARTICLE: 1,
    HEADER: 1, FOOTER: 1, FIGURE: 1, FIGCAPTION: 1, ADDRESS: 1, HR: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
    TABLE: 1, TBODY: 1, THEAD: 1, TFOOT: 1, TR: 1, TD: 1, TH: 1,
  };
  function plainHasBlockChild(el) {
    for (var i = 0; i < el.children.length; i++) if (PLAIN_BLOCK_EL[el.children[i].tagName]) return true;
    return false;
  }
  function pickEditable(at, wrap) {
    var node = null;
    if (at && document.caretRangeFromPoint) {
      var rng = document.caretRangeFromPoint(at.x, at.y);
      if (rng) node = rng.startContainer;
    } else if (at && document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(at.x, at.y);
      if (pos) node = pos.offsetNode;
    }
    if (!node && at) node = at.target;
    var el = (node && node.nodeType === 3) ? node.parentElement : node;
    if (!el || el === wrap || !wrap.contains(el)) return null;
    // Grow to the whole text run (e.g. from a <b> up to its paragraph) while staying
    // clear of tables, table-structural elements and block children.
    while (
      el.parentElement && el.parentElement !== wrap &&
      !PLAIN_TABLE_EL[el.parentElement.tagName] &&
      !el.parentElement.querySelector('table') &&
      !plainHasBlockChild(el.parentElement)
    ) {
      el = el.parentElement;
    }
    // The resolved element must itself be a safe leaf: a cell wrapping a block <div>
    // or a nested table is exactly the unsafe case, so bail on it.
    if (el.querySelector('table') || plainHasBlockChild(el)) return null;
    return el;
  }

  // Drop the caret at the click point (caretRangeFromPoint / caretPositionFromPoint,
  // whichever the browser exposes). The caret MUST end up inside el: if the click
  // hit the surrounding cell's padding the point resolves outside it, and leaving
  // the selection there would make editing keys act on the cell (corrupting the
  // table) instead of the text run. So fall back to the end of the element.
  function placeCaret(el, at) {
    var range = null;
    if (at && document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(at.x, at.y);
    } else if (at && document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(at.x, at.y);
      if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
    }
    if (!range || !el.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }
    el.focus();
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Remember the caret while plain-editing so a variable picked from the parent
  // panel (which blurs this block) still inserts at the right spot.
  function onPlainSelectionChange() {
    if (!editing || editing.mode !== 'plain') return;
    var sel = window.getSelection();
    if (sel && sel.rangeCount) {
      var r = sel.getRangeAt(0);
      if (editing.wrap.contains(r.startContainer)) editing.savedRange = r.cloneRange();
    }
  }

  // Insert a personalization token into the native contentEditable block at the
  // saved caret; fall back to the end of the block.
  function insertPlainToken(token) {
    if (!editing || editing.mode !== 'plain') return;
    var host = editing.editEl || editing.wrap;
    var range = editing.savedRange;
    if (!range || !host.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(host);
      range.collapse(false);
    }
    range.deleteContents();
    var node = document.createTextNode(token);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    editing.savedRange = range.cloneRange();
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function exitEdit(commit) {
    if (!editing) return;
    document.removeEventListener('keydown', onEditKey, true);
    var info = editing;
    editing = null;
    if (info.mode === 'plain') {
      document.removeEventListener('selectionchange', onPlainSelectionChange);
      // Drop contenteditable BEFORE reading: it sits on a child of wrap, so it
      // would otherwise serialize into the committed mj-text content.
      if (info.editEl) info.editEl.removeAttribute('contenteditable');
      // Native contentEditable edits the DOM in place, so read the block back
      // directly; flatten is a no-op for the table root but normalizes any stray
      // <p> the browser may have introduced.
      var phtml = commit ? flattenParagraphsLocal(info.wrap.innerHTML) : '';
      var punchanged = commit && phtml === info.originalHTML;
      info.wrap.innerHTML = (commit && !punchanged) ? phtml : info.originalHTML;
      document.body.classList.remove('mjed-editing');
      parent.postMessage({ type: 'mjed:edit-state', editing: false, id: null }, PARENT_ORIGIN);
      if (commit && !punchanged) {
        parent.postMessage({ type: 'mjed:text-edit', id: info.id, content: phtml }, PARENT_ORIGIN);
      }
      return;
    }
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
      return;
    }
    // In plain (table) edit mode insert a <br> instead of letting the browser split
    // the current cell into new block elements, which would corrupt the table
    // layout. execCommand is deprecated but reliably supported across our targets.
    if (editing && editing.mode === 'plain' && e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
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
        if (editing.mode === 'plain') {
          insertPlainToken(data.token);
        } else {
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
      }
    } else if (data.type === 'mjed:render') {
      // A re-render mid-edit means the parent mutated the tree (e.g. a property
      // field changed while the inline editor was open). Commit the pending edit
      // (not discard) so the user's in-progress typing survives; the commit posts
      // its own text-edit + edit-state:false, and the body innerHTML is replaced
      // just below, so the (about-to-be-overwritten) wrap write is harmless.
      if (editing) exitEdit(true);
      lastHover = null;
      var styleEl = document.getElementById('mjed-mjml-styles');
      if (styleEl) styleEl.textContent = data.styles || '';
      document.body.className = data.bodyClass || '';
      // Reapply the compiled <body>'s inline style (mj-body background-color, …);
      // cssText replaces it each render so it can't stack. The overlay's
      // body{margin:0;cursor:default} still wins — mjml's body style sets neither.
      document.body.style.cssText = data.bodyStyle || '';
      document.body.innerHTML = data.bodyHTML || '';
      applySelectionHighlight();
    }
  });

  parent.postMessage({ type: 'mjed:ready' }, PARENT_ORIGIN);
})();
<\/script>
</html>`

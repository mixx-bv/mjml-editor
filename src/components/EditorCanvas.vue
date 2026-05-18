<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import mjml2html from 'mjml-browser'
import { useEditorStore } from '../stores/editor'
import { sanitizeInlineHtml, flattenParagraphs } from '../utils/sanitize'
import { useDnd } from '../composables/useDnd'
import DropOverlay from './DropOverlay.vue'

const store = useEditorStore()
const { dragType, endDrag } = useDnd()
const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeReady = ref(false)
const compiledHtml = ref('')
const compileError = ref<string | null>(null)

const bodyWidth = computed(() => {
  const w = store.tree.attrs.width
  if (!w) return '600px'
  return /^\d+(\.\d+)?$/.test(w) ? `${w}px` : w
})

const deviceWidth = computed(() => {
  switch (store.device) {
    case 'mobile':
      return '375px'
    case 'tablet':
      return '768px'
    default:
      return bodyWidth.value
  }
})

let compileTimer: number | undefined
watch(
  () => store.editorMjml,
  (mjml) => {
    window.clearTimeout(compileTimer)
    compileTimer = window.setTimeout(() => compile(mjml), 80)
  },
  { immediate: true },
)

let compileSeq = 0
async function compile(mjml: string) {
  const seq = ++compileSeq
  try {
    const result: any = await mjml2html(mjml, { validationLevel: 'soft' })
    if (seq !== compileSeq) return
    const { html, errors } = result
    compileError.value = errors?.length ? errors.map((e: any) => e.formattedMessage).join('\n') : null
    compiledHtml.value = html ?? ''
  } catch (err: any) {
    if (seq !== compileSeq) return
    compileError.value = err?.message || String(err)
  }
}

const BRIDGE_SRCDOC = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.bubble.css" />
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"><\/script>
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
    parent.postMessage({ type: 'mjed:select', id: targetId }, '*');
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
    editing = { host: host, wrap: wrap, id: id, quill: quill, originalHTML: originalHTML };
    document.addEventListener('keydown', onEditKey, true);
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
    if (commit && !unchanged) {
      parent.postMessage({ type: 'mjed:text-edit', id: info.id, content: html }, '*');
    }
  }

  function onEditKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      exitEdit(false);
    }
  }

  // Mirrors flattenParagraphs in src/utils/sanitize.ts — strips Quill's <p> block
  // wrappers so the iframe shows the same HTML the store would round-trip to.
  function flattenParagraphsLocal(html) {
    var tmpl = document.createElement('template');
    tmpl.innerHTML = html;
    var nodes = Array.from(tmpl.content.childNodes);
    var parts = [];
    nodes.forEach(function (node, i) {
      if (node.nodeType === 3) {
        var t = node.textContent || '';
        if (t) parts.push(t);
        return;
      }
      if (node.nodeType !== 1) return;
      var el = node;
      if (el.tagName === 'P') {
        var inner = el.innerHTML.trim();
        if (inner === '<br>' || inner === '<br/>' || inner === '<br />') inner = '';
        parts.push(inner);
        if (i < nodes.length - 1) parts.push('<br>');
      } else {
        parts.push(el.outerHTML);
      }
    });
    return parts.join('');
  }

  window.addEventListener('message', function (e) {
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

  parent.postMessage({ type: 'mjed:ready' }, '*');
})();
<\/script>
</html>`

function extractRender(html: string): { styles: string; bodyHTML: string; bodyClass: string } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const styleNodes = Array.from(doc.head.querySelectorAll('style'))
  const styles = styleNodes.map((s) => s.textContent || '').join('\n')
  const bodyClassBase = doc.body.className || ''
  const bodyClass = `${bodyClassBase} mjed-${store.tree.id} mjed-t-mj-body`.trim()
  return { styles, bodyHTML: doc.body.innerHTML, bodyClass }
}

function render() {
  if (!iframeReady.value || !compiledHtml.value) return
  const payload = extractRender(compiledHtml.value)
  postToIframe({ type: 'mjed:render', ...payload })
  postToIframe({ type: 'mjed:highlight', id: store.selectedId })
}

function onMessage(e: MessageEvent) {
  const data = e.data
  if (!data) return
  if (data.type === 'mjed:ready') {
    iframeReady.value = true
    render()
  } else if (data.type === 'mjed:select') {
    store.select(data.id)
  } else if (data.type === 'mjed:text-edit') {
    store.beginEdit()
    store.updateContent(data.id, sanitizeInlineHtml(flattenParagraphs(data.content)))
  }
}

function postToIframe(msg: unknown) {
  iframeRef.value?.contentWindow?.postMessage(msg, '*')
}

function onWindowDragEnd() {
  endDrag()
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  window.addEventListener('dragend', onWindowDragEnd)
})
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  window.removeEventListener('dragend', onWindowDragEnd)
})

watch(compiledHtml, render)

watch(
  () => store.selectedId,
  (id) => postToIframe({ type: 'mjed:highlight', id }),
)

watch(dragType, (t) => {
  postToIframe({ type: 'mjed:drag-state', dragging: !!t })
})

function onCanvasClick() {
  store.select(null)
}
</script>

<template>
  <main class="canvas" @click="onCanvasClick">
    <div
      class="canvas__frame-wrap"
      :style="{ maxWidth: deviceWidth }"
      @click.stop
    >
      <iframe
        ref="iframeRef"
        class="canvas__frame"
        :srcdoc="BRIDGE_SRCDOC"
        sandbox="allow-scripts allow-same-origin"
      />
      <DropOverlay :iframe-el="iframeRef" />
    </div>
    <div v-if="dragType" class="canvas__drag-hint">
      Dragging <strong>{{ dragType.replace('mj-', '') }}</strong> — drop on a highlighted line
    </div>
    <div v-if="compileError" class="canvas__error">
      <strong>MJML error</strong>
      <pre>{{ compileError }}</pre>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.canvas {
  position: relative;
  background: $color-bg;
  overflow: auto;
  padding: 24px;
  min-width: 0;

  &__frame-wrap {
    position: relative;
    margin: 0 auto;
    background: $color-panel;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    transition: max-width 0.2s;
    min-height: 400px;
  }

  &__frame {
    width: 100%;
    height: calc(100vh - #{$topbar-height} - 48px);
    border: 0;
    border-radius: $radius-md;
    background: white;
    display: block;
  }

  &__drag-hint {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    background: $color-panel;
    border: 1px solid $color-accent;
    color: $color-accent;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: $shadow-sm;
    z-index: 20;
    pointer-events: none;

    strong {
      text-transform: capitalize;
    }
  }

  &__error {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    background: #fff1f2;
    border: 1px solid #fecaca;
    color: $color-danger;
    padding: 8px 12px;
    border-radius: $radius-md;
    font-size: 12px;

    pre {
      margin: 4px 0 0;
      white-space: pre-wrap;
    }
  }
}
</style>

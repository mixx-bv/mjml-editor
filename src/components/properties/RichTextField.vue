<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useEditorStore } from '../../stores/editor'
import { sanitizeInlineHtml } from '../../utils/sanitize'

const props = defineProps<{ nodeId: string }>()
const store = useEditorStore()

const content = computed({
  get: () => {
    const n = store.findNode(props.nodeId)?.node
    return (n && 'content' in n ? n.content : '') ?? ''
  },
  set: (v: string) => store.updateContent(props.nodeId, v),
})

let committing = false

const editor = useEditor({
  content: content.value,
  extensions: [
    StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
  ],
  editorProps: {
    attributes: { class: 'rtf__area' },
  },
  onFocus: () => store.beginEdit(),
  onUpdate: ({ editor: ed }) => {
    committing = true
    content.value = sanitizeInlineHtml(ed.getHTML())
    committing = false
  },
})

watch(
  () => content.value,
  (v) => {
    if (committing) return
    const ed = editor.value
    if (ed && ed.getHTML() !== v) ed.commands.setContent(v || '', { emitUpdate: false })
  },
)

watch(
  () => props.nodeId,
  () => {
    const ed = editor.value
    if (ed) ed.commands.setContent(content.value || '', { emitUpdate: false })
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const linkUrl = ref('')
const showLink = ref(false)

function isActive(name: string, attrs?: Record<string, unknown>) {
  return !!editor.value?.isActive(name, attrs)
}

function toggle(action: string) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus()[action as 'toggleBold']().run()
}

function openLink() {
  const ed = editor.value
  if (!ed) return
  linkUrl.value = (ed.getAttributes('link').href as string) || 'https://'
  showLink.value = true
}

function applyLink() {
  const ed = editor.value
  if (!ed) return
  const url = linkUrl.value.trim()
  if (!url) {
    ed.chain().focus().unsetLink().run()
  } else {
    ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  showLink.value = false
}

function unlink() {
  editor.value?.chain().focus().unsetLink().run()
}

function clearFormat() {
  editor.value?.chain().focus().unsetAllMarks().clearNodes().run()
}
</script>

<template>
  <div class="rtf">
    <span class="rtf__label">Content</span>
    <div class="rtf__toolbar">
      <button
        type="button"
        :class="{ 'is-active': isActive('bold') }"
        title="Bold"
        @click="toggle('toggleBold')"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('italic') }"
        title="Italic"
        @click="toggle('toggleItalic')"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('underline') }"
        title="Underline"
        @click="toggle('toggleUnderline')"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('strike') }"
        title="Strike"
        @click="toggle('toggleStrike')"
      >
        <s>S</s>
      </button>
      <span class="rtf__sep" />
      <button
        type="button"
        :class="{ 'is-active': isActive('bulletList') }"
        title="Bullet list"
        @click="toggle('toggleBulletList')"
      >
        •
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('orderedList') }"
        title="Numbered list"
        @click="toggle('toggleOrderedList')"
      >
        1.
      </button>
      <span class="rtf__sep" />
      <button
        type="button"
        :class="{ 'is-active': isActive('link') }"
        title="Link"
        @click="openLink"
      >
        🔗
      </button>
      <button v-if="isActive('link')" type="button" title="Remove link" @click="unlink">⊘</button>
      <span class="rtf__sep" />
      <button type="button" title="Clear formatting" @click="clearFormat">T×</button>
    </div>

    <div v-if="showLink" class="rtf__linkbar">
      <input
        v-model="linkUrl"
        type="url"
        placeholder="https://…"
        @keydown.enter.prevent="applyLink"
        @keydown.esc="showLink = false"
      />
      <button type="button" @click="applyLink">Apply</button>
      <button type="button" @click="showLink = false">Cancel</button>
    </div>

    <EditorContent :editor="editor" class="rtf__editor" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.rtf {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;

  &__label {
    font-size: 11px;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  &__toolbar {
    display: flex;
    gap: 2px;
    align-items: center;
    padding: 4px;
    background: $color-bg;
    border: 1px solid $color-border;
    border-radius: $radius-sm $radius-sm 0 0;
    border-bottom: 0;
    flex-wrap: wrap;

    button {
      border: 0;
      background: transparent;
      color: $color-text;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      min-width: 26px;
      font-size: 12px;

      &:hover {
        background: $color-panel;
      }

      &.is-active {
        background: $color-accent-soft;
        color: $color-accent;
      }
    }
  }

  &__sep {
    width: 1px;
    align-self: stretch;
    background: $color-border;
    margin: 0 4px;
  }

  &__linkbar {
    display: flex;
    gap: 4px;
    padding: 6px;
    background: $color-bg;
    border: 1px solid $color-border;
    border-top: 0;

    input {
      flex: 1;
      padding: 5px 8px;
      border: 1px solid $color-border;
      border-radius: $radius-sm;
      background: $color-panel;

      &:focus {
        outline: 2px solid $color-accent-soft;
        border-color: $color-accent;
      }
    }

    button {
      padding: 5px 10px;
      border: 1px solid $color-border;
      background: $color-panel;
      border-radius: $radius-sm;
      font-size: 11px;
      cursor: pointer;

      &:first-of-type {
        border-color: $color-accent;
        background: $color-accent;
        color: #fff;
      }
    }
  }

  &__editor {
    border: 1px solid $color-border;
    border-radius: 0 0 $radius-sm $radius-sm;
    background: $color-panel;
  }
}
</style>

<style lang="scss">
.rtf__area {
  min-height: 90px;
  padding: 10px 12px;
  outline: none;
  font-size: 13px;
  line-height: 1.55;

  p {
    margin: 0 0 8px;
    &:last-child { margin-bottom: 0; }
  }
  ul, ol {
    margin: 0 0 8px;
    padding-left: 22px;
  }
  a {
    color: #2563eb;
    text-decoration: underline;
  }
}
</style>

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from './ui'

beforeEach(() => setActivePinia(createPinia()))

describe('ui store — variable insertion wiring', () => {
  it('stores host-provided variables', () => {
    const ui = useUiStore()
    ui.setVariables([{ label: 'Voornaam', value: '{{ attendee.first_name }}' }])
    expect(ui.variables).toHaveLength(1)
    expect(ui.variables[0].value).toBe('{{ attendee.first_name }}')
  })

  it('tracks the id of the node being inline-edited', () => {
    const ui = useUiStore()
    expect(ui.editingNodeId).toBeNull()
    ui.setEditingNode('txt-1')
    expect(ui.editingNodeId).toBe('txt-1')
    ui.setEditingNode(null)
    expect(ui.editingNodeId).toBeNull()
  })

  it('routes insertVariable to the registered handler', () => {
    const ui = useUiStore()
    const seen: string[] = []
    ui.onInsertVariable((t) => seen.push(t))
    ui.insertVariable('{{ naam }}')
    expect(seen).toEqual(['{{ naam }}'])
  })

  it('is a no-op when no handler is registered (or after it is cleared)', () => {
    const ui = useUiStore()
    expect(() => ui.insertVariable('{{ x }}')).not.toThrow()
    ui.onInsertVariable(() => {
      throw new Error('should not be called after clearing')
    })
    ui.onInsertVariable(null)
    expect(() => ui.insertVariable('{{ y }}')).not.toThrow()
  })
})

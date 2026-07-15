import { describe, it, expect } from 'vitest'
import { parseMjmlString } from './mjmlJson'
import { serializeTree } from './serialize'

// EventSight email bodies carry Twig markup (e.g. `{{ attendee.name }}`,
// `{{ order_edit_url(order.id) }}`). This suite pins exactly what survives the
// parse → serialize round-trip the editor performs on every load/change, so the
// Filament integration knows what it can rely on. See mjmlJson.ts (parse) and
// serialize.ts (write) for the mechanism.
const wrap = (leaf: string) =>
  `<mjml><mj-body><mj-section><mj-column>${leaf}</mj-column></mj-section></mj-body></mjml>`

const roundtrip = (mjml: string) => serializeTree(parseMjmlString(mjml)!.body)

describe('Twig round-trip — safe cases (the common EventSight usage)', () => {
  it('keeps `{{ variable }}` interpolation in mj-text verbatim', () => {
    const out = roundtrip(wrap('<mj-text>Beste {{ attendee.name }},</mj-text>'))
    expect(out).toContain('Beste {{ attendee.name }},')
  })

  it('keeps a `{{ function(args) }}` call in an href attribute verbatim', () => {
    const out = roundtrip(wrap('<mj-button href="{{ order_edit_url(order.id) }}">Wijzig</mj-button>'))
    expect(out).toContain('href="{{ order_edit_url(order.id) }}"')
  })

  it('keeps `{{ variable }}` in an mj-image src attribute verbatim', () => {
    const out = roundtrip(wrap('<mj-image src="{{ event.logo_url }}"></mj-image>'))
    expect(out).toContain('src="{{ event.logo_url }}"')
  })

  it('keeps `{{ value|filter }}` (filters and quotes) in mj-text verbatim', () => {
    const out = roundtrip(wrap("<mj-text>{{ order.total|number_format(2, ',', '.') }}</mj-text>"))
    expect(out).toContain("{{ order.total|number_format(2, ',', '.') }}")
  })

  it('keeps operator-free `{% if %}` logic tags in mj-text verbatim', () => {
    const out = roundtrip(wrap('<mj-text>{% if attendee.vip %}VIP{% endif %}</mj-text>'))
    expect(out).toContain('{% if attendee.vip %}VIP{% endif %}')
  })

  it('keeps `{{ variable }}` inside an mj-button label verbatim', () => {
    const out = roundtrip(wrap('<mj-button>Betaal {{ order.total }}</mj-button>'))
    expect(out).toContain('Betaal {{ order.total }}')
  })

  it('is a fixed point across a second round-trip (no entity stacking)', () => {
    const first = roundtrip(wrap('<mj-text>Hallo {{ attendee.name }} &amp; team</mj-text>'))
    const second = serializeTree(parseMjmlString(first)!.body)
    expect(second).toBe(first)
    expect(second).not.toContain('&amp;amp;')
  })
})

// CHARACTERIZATION TEST — pins CURRENT, UNDESIRED behaviour so a fix is noticed,
// NOT a specification of what should happen. Tracked as a separate ticket
// ("Twig comparison operators survive the round-trip"); do not treat the encoding
// below as correct.
describe('Twig round-trip — characterization of a KNOWN LIMITATION (undesired; see ticket)', () => {
  // Comparison operators `<` / `>` inside a text leaf are HTML-entity-encoded on
  // parse (mj-text via innerHTML) or on serialize (escapeText for button/title),
  // producing `&gt;` / `&lt;` — which Twig does NOT decode, so the tag breaks.
  // `{{ }}` interpolation is unaffected; this bites only inline `{% if a > b %}`.
  // Mitigation today: EventSight's ValidTwig rule catches a broken body server-side,
  // and the VariablePicker inserts `{{ }}` (operator-free). Documented, not fixed here.
  it('entity-encodes `>` in an inline comparison inside mj-text (current behaviour, not desired)', () => {
    const out = roundtrip(wrap('<mj-text>{% if order.count > 5 %}veel{% endif %}</mj-text>'))
    expect(out).toContain('&gt;')
    expect(out).not.toContain('> 5 %}')
  })
})

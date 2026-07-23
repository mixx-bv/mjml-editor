import { describe, it, expect } from 'vitest'
import { listCardButtons, removeCardButtonHtml } from './cardButtons'

// The real imported e-ticket card: one mj-text whose content is a nested-table card
// with a heading, a paragraph and two CTA buttons. The card must survive removal of
// a single button byte-for-byte apart from that button.
const ETICKET_CARD = `<table role="presentation" width="100%" style="border-radius:16px;background:#ffffff;">
  <tbody>
    <tr>
      <td style="padding:14px 16px 12px;">
        <div style="font-weight:900;color:#3129d6;">E-ticket &amp; management</div>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 16px;">
        <div style="margin:0 0 10px 0;">
          <table><tbody><tr><td bgcolor="#3129d6" style="border-radius:999px;">
            <a href="{{dqfdsfsdf}}" style="display:inline-block;padding:12px 18px;color:#ffffff;border-radius:999px;">Download e-ticket</a>
          </td></tr></tbody></table>
        </div>
        <div style="font-size:14px;color:#111827;">
          <span style="color:#3129d6;">Important:</span>&nbsp;Please bring your <b>E-TICKET</b>.
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 16px;">
        <div>
          <table><tbody><tr><td bgcolor="#3129d6" style="border-radius:999px;">
            <a href="{{invitation_url}}" style="display:inline-block;padding:12px 18px;color:#ffffff;border-radius:999px;">Modify your registration</a>
          </td></tr></tbody></table>
        </div>
      </td>
    </tr>
  </tbody>
</table>`

describe('listCardButtons', () => {
  it('lists the buttons in document order', () => {
    expect(listCardButtons(ETICKET_CARD)).toEqual(['Download e-ticket', 'Modify your registration'])
  })

  it('returns [] for a plain block and ignores non-button in-text links', () => {
    expect(listCardButtons('<div>just text</div>')).toEqual([])
    expect(listCardButtons('<div>See <a href="https://x.com">our site</a></div>')).toEqual([])
  })
})

describe('removeCardButtonHtml', () => {
  it('removes only the chosen button when it shares a cell with other content', () => {
    const out = removeCardButtonHtml(ETICKET_CARD, 0)! // Download shares a cell with "Important:"
    expect(out).not.toContain('Download e-ticket')
    expect(out).toContain('Modify your registration') // other button kept
    expect(out).toContain('Important:') // sibling text kept
    expect(out).toContain('E-ticket &amp; management') // heading kept
    expect(out).toContain('border-radius:16px') // card frame kept 1:1
  })

  it('removes the whole now-empty row when a button owned its row', () => {
    const out = removeCardButtonHtml(ETICKET_CARD, 1)! // Modify is alone in its row
    expect(out).not.toContain('Modify your registration')
    expect(out).toContain('Download e-ticket') // other button kept
    expect(out).toContain('Important:')
    // Its row (the only content of the 3rd <tr>) is gone, not left as an empty row.
    expect(out).not.toContain('{{invitation_url}}')
  })

  it('returns null for an out-of-range index', () => {
    expect(removeCardButtonHtml(ETICKET_CARD, 5)).toBeNull()
    expect(removeCardButtonHtml('<div>no buttons</div>', 0)).toBeNull()
  })
})

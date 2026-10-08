import type { CSSProperties } from 'react'
import { PROGRAMS, type Balance } from './data'
import { artFor } from './cardColors'
import styles from './pointpool.module.css'

// A mini card face drawn entirely in CSS. No issuer artwork is shipped — the look is brand-tinted
// only (see cardColors.ts), so there's nothing to license and it stays sharp at any density. To use
// real card images later, swap the <span> body for an <img> and keep the .cardArt wrapper.

// Only label a network we can actually read off the card's name — no guessing.
const network = (cardName: string, brand: string) => {
  const n = cardName.toLowerCase()
  if (n.includes('visa')) return 'VISA'
  if (n.includes('mastercard')) return 'MASTERCARD'
  if (brand === 'Discover') return 'DISCOVER'
  if (brand === 'Amex') return 'AMEX'
  return ''
}

export function CardArt({ balance: b }: { balance: Balance }) {
  const p = PROGRAMS[b.programId]
  const art = artFor(p.short)
  const net = network(b.cardName, p.brand)

  return (
    <span
      className={styles.cardArt}
      style={{ '--art-from': art.from, '--art-to': art.to } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.cardChip} />
      <span className={styles.cardBrand}>{p.short}</span>
      {net && <span className={styles.cardNet}>{net}</span>}
    </span>
  )
}

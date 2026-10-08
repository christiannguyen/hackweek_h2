import type { CSSProperties } from 'react'
import { PROGRAMS, type Balance } from './data'
import styles from './pointpool.module.css'

// A mini card face drawn entirely in CSS. No issuer artwork is shipped — the look is brand-tinted
// only, so there's nothing to license and it stays sharp at any density. To use real card images
// later, swap the <span> body for an <img> and keep the .cardArt wrapper.
const ART: Record<string, { from: string; to: string }> = {
  discover: { from: '#ffa64d', to: '#e2610d' },
  creditone: { from: '#3156a0', to: '#13224a' },
  amex_mr: { from: '#39a7ec', to: '#00568f' },
  chase_ur: { from: '#2f86da', to: '#10406f' },
  citi_typ: { from: '#23a3e4', to: '#004b7c' },
  capone: { from: '#e4493f', to: '#8c1d18' },
  other: { from: '#7b8794', to: '#39424c' },
}

const FALLBACK = { from: '#7b8794', to: '#39424c' }

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
  const art = ART[b.programId] ?? FALLBACK
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

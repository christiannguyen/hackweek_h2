import type { CSSProperties } from 'react'
import { PROGRAMS, type Balance } from './data'
import { artFor } from './cardColors'
import styles from './pointpool.module.css'

// The wallet as a deck rather than a list: one card face at a time, the next ones fanned below it and
// the ones behind you peeking out above. Tapping the front card deals the next one; tapping any card
// that's peeking out brings that one forward. Whoever renders the deck says what the front card means
// — the wallet shows its balance and limit, "Use rewards" shows what the balance could cover.

// How far from the front a card can sit before it's tucked out of sight. Two each way keeps the fan
// shallow no matter how many cards are in the wallet; the rest wait behind the outermost layer.
const PEEK_SPAN = 2
// Each step away from the front moves a card this far and shrinks it by this much. PEEK_STEP has to
// match the step in .deck's margins, which reserve the room the fan hangs into.
const PEEK_STEP = 15
const PEEK_SCALE = 0.055
// The cards still to come sit below the front one; the ones already seen stay above it. Signed, so
// the fan opens in both directions instead of growing into one long stack.
const offsetFrom = (i: number, top: number, n: number) => {
  const ahead = (i - top + n) % n
  return ahead * 2 > n ? ahead - n : ahead
}

interface Props {
  balances: Balance[]
  /** Index of the card in front. */
  top: number
  onTop: (index: number) => void
}

export function CardDeck({ balances, top, onTop }: Props) {
  const n = balances.length
  // The fan's reach in each direction, so the deck box can reserve exactly the room it needs.
  const offsets = balances.map((_, i) => offsetFrom(i, top, n))
  const up = Math.min(PEEK_SPAN, -Math.min(0, ...offsets))
  const down = Math.min(PEEK_SPAN, Math.max(0, ...offsets))

  return (
    <div className={styles.deckWrap}>
      <div className={styles.deck} style={{ '--up': up, '--down': down } as CSSProperties}>
        {balances.map((b, i) => {
          const offset = offsets[i]
          const depth = Math.abs(offset)
          const hidden = depth > PEEK_SPAN
          const step = Math.sign(offset) * Math.min(depth, PEEK_SPAN)
          return (
            <button
              key={b.id}
              className={styles.deckCard}
              style={{
                transform: `translateY(${step * PEEK_STEP}px) scale(${1 - Math.abs(step) * PEEK_SCALE})`,
                zIndex: n - depth,
                // The cards behind sit back a little in the light, so the fan reads as depth.
                filter: depth > 0 ? `brightness(${1 - Math.min(depth, PEEK_SPAN) * 0.12})` : undefined,
                opacity: hidden ? 0 : 1,
                pointerEvents: hidden ? 'none' : undefined,
              }}
              aria-hidden={hidden}
              tabIndex={hidden ? -1 : undefined}
              onClick={() => onTop(offset === 0 ? (top + 1) % n : i)}
              aria-label={offset === 0
                ? `${b.cardName}, card ${top + 1} of ${n}. Tap for the next card.`
                : `Bring ${b.cardName} to the front`}
            >
              <DeckFace balance={b} />
            </button>
          )
        })}
      </div>
      {n > 1 && (
        <div className={styles.deckDots} aria-hidden="true">
          {balances.map((b, i) => (
            <span key={b.id} className={`${styles.deckDot} ${i === top ? styles.on : ''}`} />
          ))}
        </div>
      )}
      {n > 1 && <p className={styles.deckHint}>Tap the deck for the next card · <b>{top + 1} of {n}</b></p>}
    </div>
  )
}

// The face itself: the program's brand-tinted art, the same look the wallet thumbnails use, so the
// cards stay apart while they're stacked.
function DeckFace({ balance: b }: { balance: Balance }) {
  const p = PROGRAMS[b.programId]
  const art = artFor(p.short)
  return (
    <span className={styles.deckFace} style={{ '--art-from': art.from, '--art-to': art.to } as CSSProperties}>
      <span className={styles.deckChip} aria-hidden="true" />
      <span className={styles.deckShort} aria-hidden="true">{p.short}</span>
      <span className={styles.deckFaceFoot}>
        <span className={styles.deckProgram}>{p.name}</span>
        <strong className={styles.deckName}>{b.cardName}</strong>
      </span>
    </span>
  )
}

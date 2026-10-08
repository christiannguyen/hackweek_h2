import { useState, type CSSProperties } from 'react'
import {
  ageDays,
  fmtPts,
  fmtUSD,
  isCash,
  PROGRAMS,
  utilization,
  type Balance,
} from './data'
import { artFor } from './cardColors'
import { Disclaimer, FreshnessTag } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
}

export function PointpoolPage({ balances, onEdit }: Props) {
  return (
    <>
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Wallet</div>
        <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
          + Add
        </button>
      </div>

      {balances.length === 0 && (
        <div className={styles.card}>
          <div className={styles.empty}>Add a card to get started.</div>
        </div>
      )}

      {balances.length > 0 && <CardDeck balances={balances} onEdit={onEdit} />}

      <div className={styles.card} style={{ paddingTop: 4, paddingBottom: 4 }}>
        <a className={styles.row} href="#redeem">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>🎯</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Ways to use your points</div>
            <div className={styles.rowSub}>What they could cover on a trip, everyday buys or as cash</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
        <a className={styles.row} href="#learn">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>📘</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Rewards 101</div>
            <div className={styles.rowSub}>How points and cashback work, in 2 minutes</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
      </div>

      <Disclaimer />
    </>
  )
}

function UtilBar({ pct }: { pct: number }) {
  const color = pct > 0.7 ? 'var(--orange)' : pct > 0.3 ? '#f0ad1a' : 'var(--green)'
  return (
    <div className={styles.meterBar} style={{ height: 8, borderRadius: 4 }}>
      <span className={styles.meterFill} style={{ width: `${Math.min(pct * 100, 100)}%`, background: color }} />
    </div>
  )
}

// How far from the front a card can sit before it's tucked out of sight. Two each way keeps the fan
// shallow no matter how many cards are in the wallet; the rest wait behind the outermost layer.
const PEEK_SPAN = 2
// Each step away from the front moves a card this far and shrinks it by this much.
const PEEK_STEP = 15
const PEEK_SCALE = 0.055
// The cards still to come sit below the front one; the ones already seen stay above it. Signed, so
// the fan opens in both directions instead of growing into one long stack.
const offsetFrom = (i: number, top: number, n: number) => {
  const ahead = (i - top + n) % n
  return ahead * 2 > n ? ahead - n : ahead
}

// The wallet as a deck rather than a list: one card face at a time, the next ones fanned below it
// and the ones behind you peeking out above. Tapping the front card deals the next one; tapping any
// card that's peeking out brings that one forward. The panel below describes whichever is in front.
function CardDeck({ balances, onEdit }: { balances: Balance[]; onEdit: (id?: number) => void }) {
  const [top, setTop] = useState(0)
  const n = balances.length
  const front = balances[top]
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
              onClick={() => setTop(offset === 0 ? (top + 1) % n : i)}
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
      <DeckDetails balance={front} onEdit={onEdit} />
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

const updated = (b: Balance) => {
  const d = ageDays(b.updatedAt)
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

// Everything about the card in front: what it has earned first, then what's owed against it.
function DeckDetails({ balance: b, onEdit }: { balance: Balance; onEdit: (id?: number) => void }) {
  const p = PROGRAMS[b.programId]
  const cash = isCash(b)
  const util = utilization(b)
  const utilPct = util !== null ? Math.round(util * 100) : null

  return (
    <div className={`${styles.card} ${styles.deckPanel}`}>
      <div className={styles.deckHero}>
        <span className={styles.deckHeroLabel}>{cash ? 'Cashback' : p.unit === 'miles' ? 'Miles' : 'Points'}</span>
        <span className={styles.deckHeroValue}>
          {cash ? fmtUSD(b.amount) : `${fmtPts(b.amount)} ${p.unit === 'points' ? 'pts' : p.unit}`}
        </span>
      </div>
      {cash && <div className={styles.rowSub}>Comes off what you owe; options vary by card</div>}

      {(b.cardBalance != null || b.creditLimit != null) && (
        <div className={styles.tileSection}>
          <div className={styles.tileStat}>
            <span className={styles.tileLabel}>You owe</span>
            <span className={styles.tileValue}>{b.cardBalance != null ? fmtUSD(b.cardBalance) : '—'}</span>
          </div>
          {b.creditLimit != null && b.creditLimit > 0 && (
            <div className={styles.tileStat}>
              <span className={styles.tileLabel}>Limit</span>
              <span className={styles.tileValue}>{fmtUSD(b.creditLimit)}</span>
            </div>
          )}
          {utilPct !== null && (
            <div className={styles.tileStat}>
              <span className={styles.tileLabel}>Limit used</span>
              <span className={styles.tileValue}>{utilPct}%</span>
            </div>
          )}
          {util !== null && <UtilBar pct={util} />}
        </div>
      )}

      {/* Tapping the deck cycles it, so editing needs a control of its own. */}
      <div className={styles.deckFoot}>
        <span className={styles.deckAge}>Updated {updated(b)}</span>
        <FreshnessTag balance={b} />
        <button className={styles.btnText} onClick={() => onEdit(b.id)}>Edit card</button>
      </div>
    </div>
  )
}

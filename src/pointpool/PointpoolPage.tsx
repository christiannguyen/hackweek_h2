import { useState } from 'react'
import {
  ageDays,
  fmtPts,
  fmtUSD,
  isCash,
  hasEstimates,
  PROGRAMS,
  utilization,
  type Balance,
} from './data'
import { CardDeck } from './CardDeck'
import { RewardsFinePrint, RewardsPreview, RewardsWelcome } from './Rewards'
import { Disclaimer, FreshnessTag } from './shared'
import { routeParam } from './useHashRoute'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
  onRewards: (id?: number) => void
}

// One page for the whole wallet: the deck picks a card, and everything below it — what's owed on it
// and what its rewards could cover — is about that card. Those used to be two tabs showing the same
// balance twice.
export function PointpoolPage({ balances, onEdit, onRewards }: Props) {
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Wallet</h1>
        {balances.length > 0 && (
          <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
            + Add
          </button>
        )}
      </div>

      {balances.length === 0 && <RewardsWelcome onAdd={() => onEdit()} />}

      {balances.length > 0 && <WalletDeck balances={balances} onEdit={onEdit} onRewards={onRewards} />}

      <div className={styles.card} style={{ paddingTop: 4, paddingBottom: 4 }}>
        <a className={styles.row} href="#learn">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>📘</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Rewards 101</div>
            <div className={styles.rowSub}>How points and cashback work, in 2 minutes</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
      </div>

      {/* One block of fine print: the rewards one already says values are illustrative and points aren't pooled. */}
      {balances.length > 0 ? <RewardsFinePrint /> : <Disclaimer />}
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

// Whichever card is in front drives the panel and the redemption examples under it. Clamped against
// a shrinking wallet, so removing the front card doesn't strand the index.
function WalletDeck({ balances, onEdit, onRewards }: Props) {
  // "#wallet/<id>" (and the old "#redeem/<id>") opens on that card; otherwise the first one.
  const [top, setTop] = useState(() => Math.max(0, balances.findIndex((b) => b.id === Number(routeParam()))))
  const index = Math.min(top, balances.length - 1)
  const front = balances[index]

  return (
    <>
      <div className={styles.deckWrap}>
        <CardDeck balances={balances} top={index} onTop={setTop} />
        <DeckDetails balance={front} onEdit={onEdit} onRewards={onRewards} />
      </div>
      {/* Remounted per card so the chosen example and any typed-in price start fresh. */}
      {/* A program without estimates needs the card itself edited (its program), not just its balance. */}
      <RewardsPreview key={front.id} balance={front} onEdit={() => (hasEstimates(PROGRAMS[front.programId]) ? onRewards : onEdit)(front.id)} />
    </>
  )
}

const updated = (b: Balance) => {
  const d = ageDays(b.updatedAt)
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

// Everything about the card in front: what it has earned first, then what's owed against it.
function DeckDetails({ balance: b, onEdit, onRewards }: { balance: Balance; onEdit: (id?: number) => void; onRewards: (id?: number) => void }) {
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

      {/* Tapping the deck cycles it, so editing needs controls of its own. The balance is entered by
          hand, so it gets its own shortcut rather than only living behind "Edit card". */}
      <div className={styles.deckFoot}>
        <span className={styles.deckAge}>Updated {updated(b)}</span>
        <FreshnessTag balance={b} />
        <span className={styles.deckActions}>
          <button className={styles.btnText} onClick={() => onRewards(b.id)}>Update balance</button>
          <button className={styles.btnText} onClick={() => onEdit(b.id)}>Edit card</button>
        </span>
      </div>
    </div>
  )
}

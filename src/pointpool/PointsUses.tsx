import { balanceUses, fmtBalance, fmtMoney, isCash, lifestyleTie, type Balance } from './data'
import { FreshnessTag } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  variant?: 'condensed' | 'full'
  moreHref?: string // shows a chevron link in the header (e.g. to #redeem)
  onEdit?: (id?: number) => void
}

// Where each balance could go, side by side, with an estimated value per use. No totals across programs.
export function PointsUses({ balances, variant = 'condensed', moreHref, onEdit }: Props) {
  const full = variant === 'full'

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2>Where your points could go</h2>
        {moreHref && (
          <a className={styles.chev} href={moreHref} aria-label="Ways to use your points">
            ›
          </a>
        )}
      </div>
      <div className={styles.cardSub}>
        If you have this many points, here’s where they could go. Each program’s points are used within that program.
      </div>

      {balances.length === 0 && (
        <div className={styles.empty}>
          Add a card to see where your points could go.
          {onEdit && (
            <div>
              <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
                + Add a card
              </button>
            </div>
          )}
        </div>
      )}

      {balances.map((b) => (
        <UsesBlock key={b.id} balance={b} full={full} />
      ))}

      {balances.length > 0 && (
        <div className={styles.sample}>Illustrative value per point for each use — real pricing varies by program.</div>
      )}
    </div>
  )
}

function UsesBlock({ balance: b, full }: { balance: Balance; full: boolean }) {
  const uses = balanceUses(b)
  const credit = uses.find((u) => u.id === 'cashback')
  const tie = credit ? lifestyleTie(credit.value) : null
  const cash = isCash(b)

  return (
    <div className={styles.useBlock}>
      <div className={styles.useHead}>
        <div className={styles.rowMain}>
          <div className={`${styles.useTitle} ${styles.ellipsis}`}>{b.cardName}</div>
          <div className={`${styles.rowSub} ${styles.ellipsis}`}>{fmtBalance(b)}</div>
        </div>
        {full && <FreshnessTag balance={b} />}
      </div>

      {uses.length > 0 && !(b.amount > 0) ? (
        <div className={styles.note}>{cash ? 'Update this balance to see where your cashback could go.' : 'Update this balance to see where your points could go.'}</div>
      ) : uses.length === 0 ? (
        <div className={styles.note}>
          Estimates for this program are coming soon — its rewards site lists every way to use your points.
        </div>
      ) : cash ? (
        <>
          <div className={styles.useLine}>
            <span className={styles.useEmoji}>💵</span>
            <span>Same value as a statement credit, bank deposit, or at checkout.</span>
          </div>
          {full &&
            uses.map((u) => (
              <div key={u.id} className={styles.useLine}>
                <span className={styles.useEmoji}>{u.emoji}</span>
                <span>
                  {u.label[0].toUpperCase() + u.label.slice(1)}
                  <span className={styles.useDetail}>{u.detail}</span>
                </span>
              </div>
            ))}
        </>
      ) : (
        uses.map((u) => (
          <div key={u.id} className={styles.useLine}>
            <span className={styles.useEmoji}>{u.emoji}</span>
            <span>
              <b>≈{fmtMoney(u.value)}</b> {u.label}
              {full && <span className={styles.useDetail}>{u.detail}</span>}
            </span>
          </div>
        ))
      )}

      {tie && <div className={styles.tie}>As a statement credit, that’s {tie}.</div>}
    </div>
  )
}

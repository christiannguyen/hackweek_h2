import { balanceUses, fmtBalance, fmtMoney, isCash, lifestyleTie, type Balance } from './data'
import { FreshnessTag } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit?: (id?: number) => void
}

// Where each balance could go, side by side, with an estimated value per use. No totals across programs.
export function PointsUses({ balances, onEdit }: Props) {
  return (
    <div className={styles.card}>
      <h2>Where your points could go</h2>
      <div className={styles.cardSub}>With the balance you have, here’s what each use could look like.</div>

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
        <UsesBlock key={b.id} balance={b} />
      ))}

    </div>
  )
}

function UsesBlock({ balance: b }: { balance: Balance }) {
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
        <FreshnessTag balance={b} />
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
          {uses.map((u) => (
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
              <span className={styles.useDetail}>{u.detail}</span>
            </span>
          </div>
        ))
      )}

      {tie && <div className={styles.tie}>As a statement credit, that’s {tie}.</div>}
    </div>
  )
}

import {
  cardEarnings,
  catName,
  categoriesBySpend,
  earnRateLabel,
  fmtMoney,
  fmtPts,
  SPEND,
  type Balance,
  type CardEarning,
  type CategoryId,
} from './data'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
  variant?: 'condensed' | 'full'
}

// Personal, spend-driven view: what a month of the user's (sample) spending could earn on each card.
// Cards are listed in wallet order, side by side — no ranking.
export function SpendCoach({ balances, category, onCategory, onEdit, variant = 'condensed' }: Props) {
  const full = variant === 'full'
  const cats = categoriesBySpend(SPEND)
  const amount = SPEND[category] ?? 0
  const earnings = cardEarnings(balances, category)
  // Condensed view keeps the top named categories (plus the selected one) so chips stay in one short row.
  const shown = full ? cats : cats.filter((c) => c.id !== 'other').slice(0, 4)
  if (!shown.some((c) => c.id === category)) shown.push(cats.find((c) => c.id === category)!)

  return (
    <>
      <div className={styles.chips} style={{ marginTop: 12 }}>
        {shown.map((c) => (
          <button
            key={c.id}
            className={`${styles.chip} ${c.id === category ? styles.active : ''}`}
            onClick={() => onCategory(c.id)}
          >
            {c.emoji} {c.label}
            {full && ` · ${fmtMoney(SPEND[c.id])}`}
          </button>
        ))}
      </div>

      <div className={styles.headline}>
        You spend about <b>{fmtMoney(amount)}</b> a month on {catName(category)}
      </div>

      {earnings.length === 0 ? (
        <div className={styles.empty}>
          Add a card to see what this spending could earn.
          <div>
            <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
              + Add a card
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.earnList}>
            {earnings.map((e) => (
              <EarnRow key={e.balance.id} earning={e} full={full} onEdit={onEdit} />
            ))}
          </div>
        </>
      )}

    </>
  )
}

const unitLabel = (e: CardEarning) => (e.program.unit === 'points' ? 'pts' : e.program.unit)

function EarnRow({ earning: e, full, onEdit }: { earning: CardEarning; full: boolean; onEdit: (id?: number) => void }) {
  const cash = e.program.type === 'cashback'
  const base = earnRateLabel({ program: e.program, rate: 1 })
  const upTo = e.rate > 1 && e.note?.startsWith('Rotating') ? 'up to ' : ''
  const amount = cash ? fmtMoney(e.monthly) : `${fmtPts(e.monthly)} ${unitLabel(e)}`
  const sub = `${upTo}${earnRateLabel(e)} · ${upTo}${amount}/mo`

  return (
    <div className={styles.earnRow} onClick={() => onEdit(e.balance.id)}>
      <div className={styles.rowIcon}>{e.program.short}</div>
      <div className={styles.earnMain}>
        <div className={`${styles.rowTitle} ${styles.ellipsis}`}>{e.balance.cardName}</div>
        <div className={styles.rowSub}>
          {sub}
          {!e.known && ` (est. at ${base})`}
        </div>
        {full && e.note && <div className={styles.note}>{e.note}</div>}
      </div>
      <div className={styles.earnValues}>
        {cash ? (
          <span className={styles.earnValue}>
            💵 {upTo}
            {fmtMoney(e.value.cashback)}
          </span>
        ) : (
          <>
            <span className={styles.earnValue}>✈️ ≈{fmtMoney(e.value.travel)}</span>
            {full && <span className={styles.earnValue}>💵 ≈{fmtMoney(e.value.cashback)}</span>}
          </>
        )}
      </div>
    </div>
  )
}

import {
  cardEarnings,
  catName,
  categoriesBySpend,
  earnRateLabel,
  fmtMoney,
  fmtPts,
  SAMPLE_PERIOD,
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
  // Condensed view keeps the top four categories (plus the selected one) so chips stay in one short row.
  const shown = full ? cats : cats.filter((c, i) => i < 4 || c.id === category)

  return (
    <>
      <div className={styles.chips} style={{ marginTop: 12 }}>
        {shown.map((c) => (
          <button
            key={c.id}
            className={`${styles.chip} ${c.id === category ? styles.active : ''}`}
            onClick={() => onCategory(c.id)}
          >
            {c.emoji} {c.label} · {fmtMoney(SPEND[c.id])}
          </button>
        ))}
      </div>

      <div className={styles.headline}>
        You spend about <b>{fmtMoney(amount)}</b> on {catName(category)} in an average month
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
          <div className={styles.subhead}>Here’s what that could earn on each of your cards:</div>
          <div className={styles.sample} style={{ textAlign: 'right', marginTop: 6 }}>
            Est. value a month
          </div>
          <div className={styles.earnList}>
            {earnings.map((e) => (
              <EarnRow key={e.balance.id} earning={e} full={full} onEdit={onEdit} />
            ))}
          </div>
        </>
      )}

      <div className={styles.sample}>
        Based on sample transactions ({SAMPLE_PERIOD}) · monthly average.
        {!full && ' Earn rates and point values are illustrative.'}
      </div>
    </>
  )
}

const unitLabel = (e: CardEarning) => (e.program.unit === 'points' ? 'pts' : e.program.unit)

function EarnRow({ earning: e, full, onEdit }: { earning: CardEarning; full: boolean; onEdit: (id?: number) => void }) {
  const cash = e.program.type === 'cashback'
  const base = earnRateLabel({ program: e.program, rate: 1 })
  // Rotating bonus categories earn the bonus rate only in featured quarters, so figures are an upper bound.
  const upTo = e.rate > 1 && e.note?.startsWith('Rotating') ? 'up to ' : ''
  const sub = cash
    ? `${upTo}${earnRateLabel(e)} · ${upTo}${fmtMoney(e.monthly)} cashback a month`
    : `${upTo}${earnRateLabel(e)} · ${upTo}${fmtPts(e.monthly)} ${unitLabel(e)} a month`
  const yearly = cash ? `${upTo}${fmtMoney(e.yearly)} a year` : `${upTo}${fmtPts(e.yearly)} ${unitLabel(e)} a year`

  return (
    <div className={styles.earnRow} onClick={() => onEdit(e.balance.id)}>
      <div className={styles.rowIcon}>{e.program.short}</div>
      <div className={styles.earnMain}>
        <div className={`${styles.rowTitle} ${styles.ellipsis}`}>{e.balance.cardName}</div>
        <div className={styles.rowSub}>
          {sub}
          {!e.known && ` (estimated at ${base})`}
        </div>
        {full && <div className={styles.rowSub}>{yearly}</div>}
        {full
          ? e.note && <div className={styles.note}>{e.note}</div>
          : upTo
            ? <div className={styles.note}>Rotating bonus · once activated</div>
            : e.rate > 1 && e.note && <div className={styles.note}>{e.note}</div>}
      </div>
      <div className={styles.earnValues}>
        {cash ? (
          <>
            <span className={styles.earnValue}>
              💵 {upTo}
              {fmtMoney(e.value.cashback)} cash
            </span>
            <span className={styles.note}>same value any way you use it</span>
          </>
        ) : (
          <>
            <span className={styles.earnValue}>✈️ ≈{fmtMoney(e.value.travel)} travel</span>
            {full && <span className={styles.earnValue}>🛒 ≈{fmtMoney(e.value.everyday)} gift cards</span>}
            <span className={styles.earnValue}>💵 ≈{fmtMoney(e.value.cashback)} cash</span>
          </>
        )}
      </div>
    </div>
  )
}

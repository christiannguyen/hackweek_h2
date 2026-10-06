import { useState } from 'react'
import { fmtBalance, fmtMoney, fmtPts, fmtUSD, GOALS, hasEstimates, isCash, PROGRAMS, type Balance, type GoalId } from './data'
import { BackLink, Disclaimer, FreshnessTag } from './shared'
import styles from './pointpool.module.css'

export function RedeemPage({ balances }: { balances: Balance[] }) {
  const [goal, setGoal] = useState<GoalId>('travel')
  const [price, setPrice] = useState(300)

  return (
    <>
      <BackLink />
      <div>
        <div className={styles.pageTitle}>Ways to use your points</div>
        <div className={styles.pageSub}>Each program’s points are used within that program.</div>
      </div>
      <div className={styles.card}>
        <h2>What would you like to use them on?</h2>
        <div className={styles.chips} style={{ marginTop: 12 }}>
          {(Object.keys(GOALS) as GoalId[]).map((k) => (
            <button key={k} className={`${styles.chip} ${k === goal ? styles.active : ''}`} onClick={() => setGoal(k)}>
              {GOALS[k].label}
            </button>
          ))}
        </div>
        <div className={styles.priceInput}>
          <span className={styles.label} style={{ whiteSpace: 'nowrap' }}>
            Cash price $
          </span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      {balances.length === 0 && (
        <div className={`${styles.card} ${styles.empty}`}>Add a card to see where your points could go.</div>
      )}
      {balances.map((b) => (
        <RedeemOption key={b.id} balance={b} goal={goal} price={price} />
      ))}

      <Disclaimer />
    </>
  )
}

function RedeemOption({ balance: b, goal, price }: { balance: Balance; goal: GoalId; price: number }) {
  const p = PROGRAMS[b.programId]

  if (!hasEstimates(p)) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.ellipsis}>{b.cardName}</h2>
          <span className={`${styles.tag} ${styles.sm} ${styles.gray}`}>Coming soon</span>
        </div>
        <div className={`${styles.body} ${styles.mt}`}>
          Estimates for this program are coming soon — its rewards site lists every way to use your points.
        </div>
      </div>
    )
  }

  let estimate
  let assumption
  if (!(price > 0)) {
    estimate = <>Enter a price to see what your points could cover.</>
    assumption = 'Illustrative, not live pricing. Taxes/fees may apply.'
  } else if (!(b.amount > 0)) {
    estimate = <>Update this balance to see what it could cover.</>
    assumption = 'Illustrative, not live pricing. Taxes/fees may apply.'
  } else if (isCash(b)) {
    const covered = Math.min(b.amount, price)
    estimate = (
      <>
        Your {fmtUSD(b.amount)} cashback could cover <b>{fmtUSD(covered)}</b> of the {fmtMoney(price)} cost
        {covered < price ? '; the rest would be paid as usual.' : '.'}
      </>
    )
    assumption = 'Assumes $1 cashback = $1 when used. Illustrative, not live pricing. Taxes/fees may apply.'
  } else {
    const cpp = p.cpp![goal]
    const needed = (price * 100) / cpp
    const coverable = (b.amount * cpp) / 100
    estimate = (
      <>
        {fmtMoney(price)} would take about <b>{fmtPts(needed)} pts</b>. You have {fmtBalance(b)}.
        <br />
        {b.amount >= needed ? (
          <span className={styles.green}>
            <b>Your points could cover the full {fmtMoney(price)}.</b>
          </span>
        ) : (
          <>
            Your points could cover <b>≈{fmtMoney(coverable)}</b> of this; the rest would be paid as usual.
          </>
        )}
      </>
    )
    assumption = `Assumes ~${cpp}¢ per point for this use. Illustrative, not live pricing. Taxes/fees may apply.`
  }

  const steps = isCash(b) ? GOALS[goal].cashback : GOALS[goal].points

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.ellipsis}>{b.cardName}</h2>
        <FreshnessTag balance={b} />
      </div>
      <div className={styles.estimate}>
        {estimate}
        <div className={styles.assumptions}>{assumption}</div>
      </div>
      <ol className={styles.steps}>
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  )
}

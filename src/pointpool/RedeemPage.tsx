import { useState } from 'react'
import { LuArrowUpRight, LuChevronDown, LuCoins, LuGift, LuHotel, LuPencil, LuPlane, LuPlus, LuWallet } from 'react-icons/lu'
import { ageDays, fmtBalance, fmtDollars, fmtPts, fmtUSD, GOALS, hasEstimates, isCash, PROGRAMS, type Balance } from './data'
import { redemptionEstimate, redemptionExamples, REDEMPTION_EXAMPLES, type RedemptionId } from './redemption'
import styles from './pointpool.module.css'

const rewardMoney = (value: number) => Number.isInteger(value) ? fmtDollars(value) : fmtUSD(value)

const ICONS = { flight: LuPlane, hotel: LuHotel, gift: LuGift, credit: LuWallet }

export function RedeemPage({ balances, onEdit }: { balances: Balance[]; onEdit: (id?: number) => void }) {
  const [selectedId, setSelectedId] = useState<number>()
  const selected = balances.find((b) => b.id === selectedId) ?? [...balances].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  return (
    <>
      <div>
        <h1 className={styles.pageTitle}>{selected && isCash(selected) ? 'Use your cashback' : 'Use your points'}</h1>
        <p className={styles.pageSub}>Put your rewards toward everyday expenses.</p>
      </div>
      {!selected ? (
        <div className={`${styles.card} ${styles.rewardsWelcome}`}>
          <div className={styles.rewardCoin}><LuCoins aria-hidden="true" /></div>
          <h2>What’s sitting in your points balance?</h2>
          <p>Add your rewards program and current balance to see what it could cover. We don’t fetch or update it automatically — you enter it from your card’s app.</p>
          <button className={styles.compareCta} onClick={() => onEdit()}>Enter your points <LuPlus aria-hidden="true" /></button>
          <span className={styles.rewardsPrivacy}>Saved in this browser. No bank connection needed.</span>
          <div className={styles.rewardsTeasers}>{REDEMPTION_EXAMPLES.map((example) => {
            const Icon = ICONS[example.id]
            return <div key={example.id}><Icon aria-hidden="true" /><span>{example.title}</span></div>
          })}</div>
        </div>
      ) : (
        <>
          <div className={styles.rewardsProgramRow}>
            <label>Rewards balance
              <select value={selected.id} onChange={(e) => setSelectedId(Number(e.target.value))}>
                {balances.map((b) => <option key={b.id} value={b.id}>{b.cardName} · {PROGRAMS[b.programId].brand}</option>)}
              </select>
            </label>
            <button className={styles.btnText} onClick={() => { setSelectedId(undefined); onEdit() }} aria-label="Add another rewards balance"><LuPlus aria-hidden="true" /> Add</button>
          </div>
          <RewardsPreview key={selected.id} balance={selected} onEdit={() => onEdit(selected.id)} />
        </>
      )}
      <details className={styles.rewardsFinePrint}>
        <summary>The fine print <LuChevronDown aria-hidden="true" /></summary>
        <p>Illustrative values and example prices, not live award availability. Actual value depends on your card and redemption. Taxes, fees, and program restrictions may apply. Each balance is shown separately; points aren’t pooled across programs.</p>
      </details>
    </>
  )
}

function RewardsPreview({ balance: b, onEdit }: { balance: Balance; onEdit: () => void }) {
  const [choice, setChoice] = useState<RedemptionId>('credit')
  const [prices, setPrices] = useState<Partial<Record<RedemptionId, string>>>({})
  const p = PROGRAMS[b.programId]
  const cash = isCash(b)
  const supported = hasEstimates(p)
  const examples = redemptionExamples(b)
  const example = examples.find((e) => e.id === choice) ?? examples[0]
  const priceFor = (item: typeof REDEMPTION_EXAMPLES[number]) => prices[item.id] === undefined ? item.price : Number(prices[item.id])
  const price = priceFor(example)
  const estimate = redemptionEstimate(b, example.goal, price)
  const days = ageDays(b.updatedAt)
  const updated = !Number.isFinite(days) ? 'Update your balance' : days === 0 ? 'Updated today' : `Updated ${days} day${days === 1 ? '' : 's'} ago`
  const steps = cash ? ["Open your card’s app and find your cashback balance", 'Check whether it applies automatically or you have to request it, and any minimum', 'Confirm when it comes off your balance'] : choice === 'hotel'
    ? ["Open your card’s rewards portal", 'Look for hotels under travel and compare the cash and points prices', 'Check availability, taxes, and fees before redeeming']
    : GOALS[example.goal].points

  return (
    <>
      <section className={styles.rewardsBalance} aria-label="Your entered rewards balance">
        <div className={styles.rewardsBalanceTop}><span>{p.name}</span><LuCoins aria-hidden="true" /></div>
        <div className={styles.rewardsAmount}>{cash ? fmtUSD(b.amount) : fmtPts(b.amount)}<span>{cash ? 'cashback' : p.unit}</span></div>
        <div className={styles.rewardsBalanceBottom}><span>{updated}<small>Saved in this browser · {b.cardName}</small></span><button onClick={onEdit}><LuPencil aria-hidden="true" /> Update balance</button></div>
      </section>
      {days >= 30 && <div className={styles.rewardsRefresh}>Your balance may have changed. Update it before planning a redemption.</div>}
      {!supported ? (
        <div className={styles.card}><h2>Keep track of this balance</h2><p className={styles.body}>We don’t have a value estimate for this program yet. Check its rewards portal for redemption options.</p><button className={styles.btnText} onClick={onEdit}>Edit rewards program</button></div>
      ) : (
        <>
          <div className={styles.rewardsSectionHead}><h2>{cash ? 'What this can do' : 'Picture the possibilities'}</h2>{examples.length > 1 && <span>Choose one to explore</span>}</div>
          {b.amount === 0 && <div className={styles.rewardsRefresh}>Your balance is 0. Update it to see your progress toward these examples.</div>}
          {/* A cash balance has exactly one option, so the chooser grid would only restate the card below it. */}
          {examples.length > 1 && <><div className={styles.redemptionGrid}>
            {examples.map((item) => {
              const Icon = ICONS[item.id]
              const cost = priceFor(item)
              const result = redemptionEstimate(b, item.goal, cost)
              return (
                <button key={item.id} className={`${styles.redemptionTile} ${example.id === item.id ? styles.redemptionSelected : ''}`}
                  data-redemption={item.id} aria-pressed={example.id === item.id} onClick={() => setChoice(item.id)}>
                  <div className={styles.redemptionArt}><Icon aria-hidden="true" /><span aria-hidden="true">✦</span></div>
                  <h3>{item.title}</h3><p>{item.subtitle}</p>
                  <span className={styles.redemptionPrice}>{result ? `${rewardMoney(cost)} ${prices[item.id] === undefined ? 'example' : 'target'}` : 'Set a price below'}</span>
                  <span className={styles.redemptionProgress} aria-hidden="true"><span style={{width: `${result?.percent ?? 0}%`}} /></span>
                  <strong>{result ? `${rewardMoney(result.covered)} covered` : 'Enter a valid price'}</strong>
                  <span className={styles.redemptionRemaining}>{result ? result.remaining === 0 ? 'Could cover the full amount' : `${rewardMoney(result.remaining)} left to cover` : 'Use a price above $0'}</span>
                </button>
              )
            })}
          </div>
          <p className={styles.rewardsAlternatives}>These are alternative ways to use the same points—not four rewards you can redeem together.</p></>}
          <section className={styles.card} aria-label={`How to use rewards for ${example.title.toLowerCase()}`}>
            <div className={styles.cardHead}><h2>{example.title} <LuArrowUpRight className={styles.inlineRewardIcon} aria-hidden="true" /></h2><span className={styles.rewardExampleTag}>Example</span></div>
            {/* Cashback redeems 1:1, so restating the balance as its own "value" says nothing. Lead with the effect instead. */}
            {estimate && (cash ? <div className={styles.rewardsEstimate}>
              <strong>{fmtUSD(estimate.value)}</strong> off what you owe on this card.
              <span>Cashback converts 1:1 — every $1 cancels $1 of your balance. Not an airline or hotel points redemption.</span>
            </div> : <div className={styles.rewardsEstimate}>
              <strong>≈{rewardMoney(estimate.value)}</strong> in {example.goal === 'travel' ? 'travel value' : example.goal === 'everyday' ? 'gift-card value' : 'statement-credit value'} from your {fmtBalance(b)}.
              <span>At an illustrative {estimate.cpp}¢ per {p.unit === 'miles' ? 'mile' : 'point'}. A {rewardMoney(price)} redemption would need about {fmtPts(estimate.needed)} {p.unit}.</span>
            </div>)}
            {estimate && cash && <div className={styles.rewardsCoverage}>
              <div><span>Against a {rewardMoney(price)} balance</span><strong>{estimate.remaining === 0 ? 'Covers all of it' : `${rewardMoney(estimate.remaining)} left to pay`}</strong></div>
              <span className={styles.redemptionProgress} aria-hidden="true"><span style={{width: `${estimate.percent}%`}} /></span>
            </div>}
            <details className={styles.rewardsCustomPrice}><summary>Try a different {cash ? 'balance' : 'price'} <LuChevronDown aria-hidden="true" /></summary><label>{cash ? 'Card balance ($)' : 'Target price ($)'}<input type="number" min="0.01" step="0.01" inputMode="decimal" value={prices[example.id] ?? example.price} onChange={(e) => setPrices((prev) => ({...prev, [example.id]: e.target.value}))} /></label>{!estimate && <p role="status">Enter an amount greater than $0.</p>}</details>
            <details className={styles.rewardsCustomPrice}><summary>How to {cash ? 'redeem it' : 'use them'} <LuChevronDown aria-hidden="true" /></summary>
              <ol className={styles.rewardsSteps}>{steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <p className={styles.rewardsAlternatives}>Confirm the final value in your issuer’s app. This preview doesn’t book or redeem anything.</p>
            </details>
            {cash && <details className={styles.rewardsCustomPrice}><summary>Other ways to take it <LuChevronDown aria-hidden="true" /></summary>
              <p className={styles.rewardsAlternatives}>We’re showing a statement credit, which lowers your card balance. Some cards also allow a bank deposit or gift cards instead — check your card’s app for what it offers and any minimum.</p>
            </details>}
          </section>
        </>
      )}
    </>
  )
}

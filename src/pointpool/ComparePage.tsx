import { useState } from 'react'
import { LuArrowUpRight, LuFuel, LuShoppingBag, LuUtensils } from 'react-icons/lu'
import type { CompareProps } from './CardCompare'
import {
  catName,
  compareCards,
  creditLabel,
  fmtDollars,
  fmtMoney,
  fmtRate,
  SPEND,
  TOP_CATEGORIES,
  type Balance,
  type CardOption,
  type CategoryId,
} from './data'
import { Disclaimer } from './shared'
import { routeParam } from './useHashRoute'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
  compare: CompareProps
}

const categoryIcons = { food: LuUtensils, shopping: LuShoppingBag, transport: LuFuel }
const c2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => (n < 0 ? `−${fmtMoney(-n)}` : fmtMoney(n))
const signed = (n: number) => (n < 0 ? `−${fmtMoney(-n)}` : `+${fmtMoney(n)}`)
// A card's month: each line is rounded to cents first, so the math adds up to the column's number.
const perMonth = (o: CardOption) => {
  const rewards = c2(o.rewards / 12)
  const fee = c2(o.fee / 12)
  return { rewards, fee, net: c2(rewards - fee) }
}
// The chart always spans at least this much a month, so a $1 gain looks small instead of filling the chart.
const MIN_SPAN = 5
const feeFilters = [
  { value: 'all', label: 'All cards' },
  { value: 'none', label: 'No annual fee' },
  { value: 'paid', label: 'Annual fee' },
] as const
type FeeFilter = typeof feeFilters[number]['value']

// The user's best card is the baseline, not a column: up to three new cards, measured against it. When the top three
// all charge a fee, the last slot goes to the best no-fee card, so the fee question answers itself.
export function ComparePage({ balances, onEdit, compare: { category, onCategory } }: Props) {
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all')
  const { best, worth, close, rest } = compareCards(balances, category)
  const market = [...worth, ...close, ...rest]
    .filter((o) => feeFilter === 'all' || (feeFilter === 'none' ? o.fee === 0 : o.fee > 0))
    .sort((a, b) => b.net - a.net)
  const top = market[0]
  const cards = market.slice(0, 3)
  const noFee = cards.every((o) => o.fee > 0) ? market.find((o) => o.fee === 0) : undefined
  if (noFee) cards.splice(2, 1, noFee)

  return <>
    <div className={styles.pageHead}>
      <div>
        <h1 className={styles.pageTitle}>Compare cards</h1>
        <p className={styles.pageSub}>New cards next to your best card, after annual fees.</p>
      </div>
    </div>
    <section className={styles.card} aria-labelledby="compare-chart-title">
      <div className={styles.compareHead}>
        <h2>Your monthly spending</h2>
        <div className={styles.catTabs} role="group" aria-label="Spending category">
          {TOP_CATEGORIES.map((c) => {
            const Icon = categoryIcons[c.id]
            return <button key={c.id} className={`${styles.catTab} ${c.id === category ? styles.active : ''}`}
              aria-pressed={c.id === category} onClick={() => onCategory(c.id)}>
              <Icon className={styles.categoryIcon} aria-hidden="true" />
              <span className={styles.catLabel}>{c.label}</span>
              <span className={styles.catSpend}>{fmtMoney(SPEND[c.id])}<small>/mo</small></span>
            </button>
          })}
        </div>
        <div className={styles.feeFilters} role="group" aria-label="New card annual fee">
          {feeFilters.map(({ value, label }) => <button key={value}
            className={`${styles.feeFilter} ${feeFilter === value ? styles.active : ''}`}
            aria-pressed={feeFilter === value} onClick={() => setFeeFilter(value)}>
            {label}
          </button>)}
        </div>
      </div>
      <h2 id="compare-chart-title">{best ? 'Next to your card' : 'What you could earn'}</h2>
      <p className={styles.cardSub}>On your {fmtMoney(SPEND[category])} of {catName(category)} a month, after fees</p>
      <div role="status">
        {top ? <Verdict category={category} best={best} top={top} worth={top.worth} /> : (
          <p className={styles.chartEmpty}>
            No new cards match this fee filter for {catName(category)}.
            {feeFilter !== 'all' && <> <button className={styles.btnText} onClick={() => setFeeFilter('all')}>Show all cards</button></>}
          </p>
        )}
      </div>
      {cards.length > 0 && <>
        <p className={`${styles.chartBase} ${best ? '' : styles.chartBaseNone}`}>
          <i aria-hidden="true" />
          {best ? `Your ${best.name}, ${money(perMonth(best).net)}/mo` : 'No card yet, $0/mo'}
        </p>
        <ColumnChart key={`${category}-${feeFilter}`} cards={cards} category={category} best={best} />
      </>}
      {!best && <p className={styles.chartEmpty}>
        {balances.length ? 'Your cards don’t have estimates for this yet.' : 'Add your cards to see them next to these.'}
        {' '}<button className={styles.btnText} onClick={() => onEdit()}>{balances.length ? 'Manage cards' : 'Add a card'}</button>
      </p>}
    </section>

    <p className={styles.chartNote}>
      <strong>A new card is a new bill.</strong> Annual fees are charged even in months you earn little. Applying is a
      credit check, and approval isn’t guaranteed. Estimates use your last 30 days of spending and sample card terms,
      without interest or welcome bonuses. Fees on cards you already have aren’t counted.
    </p>
    <Disclaimer />
  </>
}

// The answer first, in one line: a new card wins, it's a close call, or the user's card already wins.
function Verdict({ category, best, top, worth }: { category: CategoryId; best?: CardOption; top?: CardOption; worth: boolean }) {
  if (!top) return <p className={styles.verdict}><strong>Nothing to compare yet</strong> No new cards in these examples for {catName(category)}.</p>
  const fee = top.fee > 0 ? `, after its ${fmtDollars(top.fee)}/yr fee` : ', with no annual fee'
  if (!best) return <p className={`${styles.verdict} ${styles.verdictWin}`}>
    <strong>Up to {money(perMonth(top).net)}/mo</strong> with {top.name}{fee}.
  </p>
  const gain = c2(perMonth(top).net - perMonth(best).net)
  if (worth) return <p className={`${styles.verdict} ${styles.verdictWin}`}>
    <strong>{signed(gain)}/mo</strong> more with {top.name}{fee}.
  </p>
  if (gain > 0) return <p className={styles.verdict}>
    <strong>{signed(gain)}/mo</strong> with {top.name}. A small gain for a new credit account, so your {best.name} is fine here.
  </p>
  return <p className={`${styles.verdict} ${styles.verdictYours}`}>
    <strong>Your card wins</strong> Your {best.name} already earns {gain === 0 ? 'as much as' : 'more than'} the new cards matching your filters on {catName(category)}.
  </p>
}

// The line is the user's card (or $0 with no card): each column rises by what a new card adds over it, or drops by
// what it would lose.
function ColumnChart({ cards, category, best }: { cards: CardOption[]; category: CategoryId; best?: CardOption }) {
  const [open, setOpen] = useState(routeParam)
  const shown = cards.find((o) => o.key === open)
  const baseNet = best ? perMonth(best).net : 0
  const diffs = cards.map((o) => c2(perMonth(o).net - baseNet))
  let hi = Math.max(0, ...diffs)
  let lo = Math.min(0, ...diffs)
  // Pad short charts in the direction they point: up for gains, down when every card loses.
  if (hi - lo < MIN_SPAN) {
    if (hi > 0 || lo === 0) hi = lo + MIN_SPAN
    else lo = hi - MIN_SPAN
  }
  const span = hi - lo
  const at = (n: number) => `${((n - lo) / span) * 100}%`

  return <>
    <div className={styles.cols} style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}>
      {cards.map((o, i) => {
        const m = perMonth(o)
        const d = diffs[i]
        const same = Math.abs(d) < 0.01
        const label = same ? 'Same' : best ? signed(d) : money(d)
        const isOpen = open === o.key
        return <button key={o.key} className={`${styles.col} ${isOpen ? styles.colOpen : ''}`}
          aria-expanded={isOpen} aria-controls={isOpen ? 'compare-math' : undefined} onClick={() => setOpen(isOpen ? '' : o.key)}
          aria-label={`${o.name}: ${best ? `${same ? 'same as' : `${signed(d)} a month versus`} your card, ` : ''}${money(m.net)} a month after fees`}>
          <span className={`${styles.colPlot} ${lo < 0 ? styles.colPlotLoss : ''}`} aria-hidden="true">
            <span className={`${styles.colBase} ${best ? '' : styles.colBaseNone}`} style={{ bottom: at(0) }} />
            {same ? <b className={styles.colSame} style={{ bottom: at(0) }}>Same</b>
              : <span className={`${styles.colBar} ${d < 0 ? styles.colBarLoss : ''}`}
                style={{ bottom: at(Math.min(0, d)), height: `${(Math.abs(d) / span) * 100}%` }}>
                <b className={styles.colTop}>{label}</b>
              </span>}
          </span>
          <span className={styles.colName}>{o.name}</span>
          <small className={o.fee > 0 ? styles.chartFee : undefined}>{o.fee > 0 ? `${fmtDollars(o.fee)}/yr fee` : 'No annual fee'}</small>
          <span className={`${styles.chartTip} ${i === 0 ? styles.tipStart : i === cards.length - 1 ? styles.tipEnd : ''}`} aria-hidden="true">
            {o.fee === 0 ? `${fmtMoney(m.rewards)} in rewards, no annual fee`
              : `${fmtMoney(m.rewards)} rewards − ${fmtMoney(m.fee)} fee = ${money(m.net)}`}
          </span>
        </button>
      })}
    </div>
    {shown ? <CardMath option={shown} category={category} best={best} />
      : <p className={styles.chartHint}>Tap a card to see the math.</p>}
  </>
}

// The monthly math behind a column, and what to know before applying.
function CardMath({ option: o, category, best }: { option: CardOption; category: CategoryId; best?: CardOption }) {
  const m = perMonth(o)
  const vs = best ? c2(m.net - perMonth(best).net) : undefined
  return <div id="compare-math" className={styles.chartMath}>
    <h3>{o.name}<small>New card</small></h3>
    <dl>
      <div>
        <dt>Rewards<small>{fmtRate(o.type, o.rate)} {o.type === 'cashback' ? 'cash back' : 'points'} on {catName(category)}{o.steps.length > 1 ? ', with a cap' : ''}</small></dt>
        <dd>{fmtMoney(m.rewards)}</dd>
      </div>
      <div>
        <dt>Annual fee<small>{o.fee > 0 ? `${fmtDollars(o.fee)} once a year` : 'None'}</small></dt>
        <dd>{m.fee > 0 ? `−${fmtMoney(m.fee)}` : '$0'}</dd>
      </div>
      <div className={styles.chartMathTotal}><dt>You keep</dt><dd>{money(m.net)}/mo</dd></div>
    </dl>
    {vs !== undefined && <p className={styles.chartVs}>
      {Math.abs(vs) < 0.01 ? `Same as your ${best!.name}` : `${money(Math.abs(vs))}/mo ${vs > 0 ? 'more' : 'less'} than your ${best!.name}`}
    </p>}
    {o.steps.length > 1 && o.steps.map((s) => <p key={s.label}>{s.label}.</p>)}
    {o.type === 'points' && <p>Points counted at {o.cpp}¢ each.</p>}
    {!o.known && <p>Estimated at the card’s base rate.</p>}
    {o.why && <p>{o.why}.</p>}
    {o.notes.map((n) => <p key={n}>{n}</p>)}
    {o.feeNote && <p>Fee: {o.feeNote}.</p>}
    {o.credit && <p>{creditLabel(o.credit)}. Approval isn’t guaranteed.</p>}
    {o.url && <a className={styles.chartApply} href={o.url} target="_blank" rel="noreferrer">
      Review card & fees <LuArrowUpRight aria-hidden="true" />
    </a>}
  </div>
}

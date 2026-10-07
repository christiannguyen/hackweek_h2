import { useEffect, useState, type ReactNode } from 'react'
import { LuCheck, LuChevronDown, LuFuel, LuReceipt, LuShoppingBag, LuUtensils } from 'react-icons/lu'
import {
  catName,
  compareCards,
  CREDIT,
  CREDIT_SCORE,
  CREDIT_TIERS,
  creditLabel,
  fmtDollars,
  fmtMoney,
  fmtPts,
  fmtRate,
  MIN_GAIN,
  scoreGoal,
  SPEND,
  TOP_CATEGORIES,
  type Balance,
  type CardOption,
  type CategoryId,
} from './data'
import styles from './pointpool.module.css'
import { routeParam } from './useHashRoute'

export interface CompareProps {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
  variant?: 'condensed' | 'full'
}

// Maximum number of future credit-tier options shown in the score goal.
const HOME_LIMIT = 3

// Recommendations always use the strongest owned card, even when the user explores another baseline.
export function CardCompare({ balances, category, onCategory, onEdit, variant = 'condensed' }: CompareProps) {
  const full = variant === 'full'
  const noCards = balances.length === 0
  const { yours, best, worth, close, rest } = compareCards(balances, category)
  const [selection, setSelection] = useState<{ category: CategoryId; key: string }>()
  const selected = (selection?.category === category && yours.find((o) => o.key === selection.key)) || best
  const isBest = selected?.key === best?.key
  const alternatives = [...worth, ...close, ...rest].sort((a, b) => b.net - a.net)
  const suggested = worth[0] ?? alternatives[0]
  const recommends = !!worth[0]
  const gain = suggested ? Math.round((suggested.net - (selected?.net ?? 0)) * 100) / 100 : 0
  const spend = SPEND[category]
  const categoryLabel = TOP_CATEGORIES.find((c) => c.id === category)?.label ?? catName(category)
  const [focus] = useState(() => (full ? routeParam() : ''))
  useEffect(() => {
    if (focus) document.getElementById(rowId(focus))?.scrollIntoView({ block: 'center' })
  }, [focus])
  const charted = [...yours, ...alternatives]
  const max = scaleOf(charted, best)
  const icons = { food: LuUtensils, shopping: LuShoppingBag, transport: LuFuel }
  const incomplete = yours.length < balances.length || yours.some((o) => !o.known)

  return (
    <>
      <h3 className={styles.groupHead}>Your top {TOP_CATEGORIES.length} categories</h3>
      <div className={styles.catTabs} role="group" aria-label="Category">
        {TOP_CATEGORIES.map((c) => {
          const Icon = icons[c.id]
          return (
            <button key={c.id} className={`${styles.catTab} ${c.id === category ? styles.active : ''}`}
              aria-pressed={c.id === category} onClick={() => { setSelection(undefined); onCategory(c.id) }}>
              <Icon className={styles.categoryIcon} aria-hidden="true" />
              <span className={styles.catLabel}>{c.label}</span>
              <span className={styles.catSpend}>{fmtMoney(SPEND[c.id])}<small>/mo</small></span>
            </button>
          )
        })}
      </div>
      <div className={styles.compareHeading}>
        <h3>{categoryLabel} · {noCards ? 'what could you earn?' : 'which card wins?'}</h3>
        <span>{fmtDollars(spend * 12)} / yr</span>
      </div>
      {noCards ? (
        <>
          <p className={styles.firstCardIntro}>No cards added yet. Your everyday spending could earn rewards.</p>
          {suggested ? <FirstCardOpportunity option={suggested} category={category} recommended={recommends} /> : (
            <div className={styles.compareEmpty}>No cards to estimate for this category yet. Try another category.</div>
          )}
        </>
      ) : <div className={styles.compareGrid}>
        <div className={styles.compareColumn}>
          <h4>
            <span className={styles.colEyebrow}>Now</span>
            {!selected ? 'Your wallet' : isBest ? 'Best in your wallet' : 'Your selected card'}
          </h4>
          {selected ? (
            <CompareTile option={selected} category={category} winner={!recommends && isBest}>
              {yours.length > 1 && (
                <label className={styles.cardPicker}>
                  <span>Compare another card <LuChevronDown aria-hidden="true" /></span>
                  <select aria-label="Compare another card" value={selected.key}
                    onChange={(e) => setSelection({ category, key: e.target.value })}>
                    {yours.map((o) => <option key={o.key} value={o.key}>{o.name}{o.key === best?.key ? ' — Best in your wallet' : ''}</option>)}
                  </select>
                </label>
              )}
            </CompareTile>
          ) : (
            <div className={styles.compareEmpty}>
              <p>Your cards don’t have reward estimates yet.</p>
              <button className={styles.btnText} onClick={() => onEdit()}>Manage cards</button>
            </div>
          )}
        </div>
        <div className={styles.compareColumn}>
          <h4>
            <span className={styles.colEyebrow}>If you apply</span>
            {!suggested ? 'No options yet' : recommends ? 'Suggested new card' : 'Closest new card'}
          </h4>
          {suggested ? <CompareTile option={suggested} category={category} winner={recommends} /> : (
            <div className={styles.compareEmpty}>No new cards to compare for this category.</div>
          )}
        </div>
      </div>}
      <div className={styles.compareTakeaway} role="status">
        <LuCheck aria-hidden="true" />
        <div>
          {noCards ? (
            recommends && suggested ? (
              <><strong>Your spending could earn {fmtDollars(suggested.net)} a year</strong> on {catName(category)}
                {suggested.fee > 0 ? ` after the ${fmtDollars(suggested.fee)} annual fee` : ', with no annual fee'}.
                {' '}Estimate assumes you pay in full.</>
            ) : <><strong>No card to recommend on this spending yet.</strong> Try another category to explore its potential rewards.</>
          ) : recommends && suggested ? (
            <><strong>{fmtDollars(gain)} {selected ? 'more ' : ''}per year</strong>{selected
              ? ` compared with ${isBest ? 'your best existing card' : selected.name} for ${catName(category)}`
              : ` in estimated rewards on ${catName(category)}`}{suggested.fee > 0 ? `, after the ${fmtDollars(suggested.fee)} annual fee.` : ', with no annual fee.'}</>
          ) : best ? (
            <><strong>You already have a great card for {catName(category)}.</strong> {best.name} {suggested && suggested.net > best.net
              ? 'earns almost as much; the small gain from a new card doesn’t meet our recommendation threshold.'
              : 'is your best wallet option. No new card adds enough to recommend applying.'}</>
          ) : 'Add a supported card to see how a new card compares with your wallet.'}
          {!isBest && best && <button className={styles.resetCompare} onClick={() => setSelection(undefined)}>Back to best in your wallet</button>}
        </div>
      </div>
      {recommends && suggested && <NewCardCommitment option={suggested} />}
      {recommends && suggested?.url && (
        <a className={styles.compareCta} href={suggested.url} target="_blank" rel="noreferrer">Review card & fees <span aria-hidden="true">↗</span></a>
      )}
      {noCards && <div className={styles.firstCardAdd}>Already have a card? <button className={styles.btnText} onClick={() => onEdit()}>Add it to compare</button></div>}
      <p className={styles.compareFootnote}>
        Estimates assume all {fmtMoney(spend)}/mo in this category goes on each card, based on your last 30 days.
        {incomplete && ' Wallet ranking uses available estimates; some card rates are estimated or unavailable.'}
        {' '}A new card’s full annual fee is shown once in this comparison. These are separate category scenarios, not amounts to add together.
        {noCards ? ' Potential rewards aren’t savings versus your current payment method. Pay in full each month; interest and other charges are not included. Approval isn’t guaranteed.' : ' Existing card fees are excluded because you already hold those cards.'}
      </p>
      {full && (
        <>
          <div className={styles.colHead}><h3>All cards and the math</h3><span>{best ? 'Compared with your best' : 'Potential rewards'}</span></div>
          <Legend options={charted} best={best} />
          {charted.map((o) => <BarRow key={o.key} option={o} best={best} max={max} full open={o.key === focus} />)}
          <div className={styles.sample}>
            Example terms, using each card’s rate for the main part of a category (like grocery stores for food & drink).
            Points count at their cash value. A new card is recommended when it {best ? 'adds' : 'earns'} at least {fmtMoney(MIN_GAIN)} a month
            after its fee{best ? ' compared with your best existing card' : ''}. Score ranges are a guide, not a cutoff.
            Applying means a credit check, and approval isn’t guaranteed.
          </div>
        </>
      )}
    </>
  )
}

// Collapsed by default to keep the comparison compact. The costs you'd actually owe — the annual fee and any deposit —
// stay on the summary row, so the only thing behind the toggle is the explanation of them.
function NewCardCommitment({ option: o }: { option: CardOption }) {
  const cost = [o.fee > 0 ? `${fmtDollars(o.fee)}/yr fee` : 'No annual fee', !!o.deposit && `${fmtDollars(o.deposit)} deposit`]
    .filter(Boolean)
    .join(' · ')
  return (
    <details className={styles.cardCommitment}>
      <summary className={styles.commitmentSummary}>
        <LuReceipt aria-hidden="true" />
        <span className={styles.commitmentLabel}>Before you apply</span>
        <span className={styles.commitmentCost}>{cost}</span>
        <LuChevronDown className={styles.commitmentChevron} aria-hidden="true" />
      </summary>
      <div className={styles.commitmentBody}>
        {o.fee > 0 && <p>This is a yearly charge to your card, even if you earn no rewards. We subtract it in the estimate; rewards don’t automatically pay the fee.</p>}
        {o.feeNote && <p className={styles.commitmentTerms}>{o.feeNote}.</p>}
        {!!o.deposit && <p><strong>{fmtDollars(o.deposit)} refundable deposit also required.</strong> This is money you need up front.</p>}
        <p><strong>You’re applying for a new credit account</strong> with its own bill. A credit check may affect your score, and approval isn’t guaranteed.</p>
        <p>Interest and other charges can outweigh the rewards. Review the APR and full terms before applying.</p>
      </div>
    </details>
  )
}

function FirstCardOpportunity({ option: o, category, recommended }: {
  option: CardOption; category: CategoryId; recommended: boolean
}) {
  return (
    <div className={styles.firstCardOpportunity}>
      <div className={styles.firstCardEyebrow}>{recommended ? 'Your potential rewards' : 'Estimated annual value'}</div>
      <div className={styles.firstCardValue}>{fmtDollars(o.net)}<span>/ year</span></div>
      <p className={styles.firstCardMonthly}>About {fmtMoney(o.net / 12)}/mo after the annual fee</p>
      <div className={styles.firstCardProduct}>
        <div className={`${styles.cardFace} ${styles.newCardFace}`}>
          <span className={styles.cardIssuer}>{o.issuer ?? o.short}</span>
          <strong>{o.name}</strong>
          <span className={styles.cardOwnership}>New card</span>
        </div>
        <div>
          <div className={styles.compareRate}>{fmtRate(o.type, o.rate)}{o.steps.length > 1 && <small>*</small>}</div>
          <div className={styles.compareRateLabel}>{o.type === 'cashback' ? 'cash back' : 'points'} on {catName(category)}</div>
          {o.steps.length > 1 && <div className={styles.rateNote}>*Caps or bonus periods apply.</div>}
          {o.type === 'points' && <div className={styles.rateNote}>Valued at {o.cpp}¢/point.</div>}
        </div>
      </div>
      <dl className={styles.firstCardNumbers}>
        <div><dt>Estimated rewards / yr</dt><dd>{fmtDollars(o.rewards)}</dd></div>
        <div className={o.fee > 0 ? styles.paidFeeRow : undefined}><dt>Annual fee</dt><dd>{o.fee > 0 ? `−${fmtDollars(o.fee)}` : '$0'}</dd></div>
        <div><dt>Potential value / yr</dt><dd>{fmtDollars(o.net)}</dd></div>
      </dl>
      <RewardDetails option={o} />
    </div>
  )
}

function CompareTile({ option: o, category, winner, children }: {
  option: CardOption; category: CategoryId; winner: boolean; children?: ReactNode
}) {
  return (
    <div className={`${styles.compareTile} ${winner ? styles.compareWinner : ''}`}>
      {winner && <span className={styles.winnerBadge}>{o.yours ? 'Already yours' : 'Best pick'}</span>}
      <div className={`${styles.cardFace} ${!o.yours ? styles.newCardFace : ''}`}>
        <span className={styles.cardIssuer}>{o.issuer ?? o.short}</span>
        <strong>{o.name}</strong>
        <span className={styles.cardOwnership}>{o.yours ? 'In your wallet' : 'New card'}</span>
      </div>
      <div className={styles.pickerSpace}>
        {children}
        {!o.yours && <span className={o.fee > 0 ? styles.cardFeeTag : styles.cardNoFeeTag}>{o.fee > 0 ? `${fmtDollars(o.fee)}/yr fee` : 'No annual fee'}</span>}
      </div>
      <div className={styles.compareRate}>{fmtRate(o.type, o.rate)}{o.steps.length > 1 && <small>*</small>}</div>
      <div className={styles.compareRateLabel}>{o.type === 'cashback' ? 'cash back' : 'points'} on {catName(category)}</div>
      {(!o.known || o.steps.length > 1 || o.type === 'points') && <div className={styles.rateNote}>
        {!o.known ? 'Estimated base rate. ' : ''}{o.steps.length > 1 ? '*Caps or bonus periods apply. ' : ''}{o.type === 'points' ? `Valued at ${o.cpp}¢/point.` : ''}
      </div>}
      <dl className={styles.compareNumbers}>
        <div><dt>Rewards / yr</dt><dd>{fmtDollars(o.rewards)}</dd></div>
        <div className={o.fee > 0 ? styles.paidFeeRow : undefined}><dt>{o.yours ? 'Added fee / yr' : 'Annual fee'}</dt><dd>{o.fee > 0 ? `−${fmtDollars(o.fee)}` : '$0'}</dd></div>
        <div className={styles.compareNet}><dt>{o.yours ? 'Category value' : 'After new fee'}</dt><dd>{fmtDollars(o.net)}</dd></div>
      </dl>
      <RewardDetails option={o} />
    </div>
  )
}

function RewardDetails({ option: o }: { option: CardOption }) {
  return (
    <details className={styles.tileDetails}>
      <summary>Reward details</summary>
      {o.steps.map((step) => <p key={step.label}>{step.label}</p>)}
      {o.notes.map((note) => <p key={note}>{note}</p>)}
      {o.feeNote && <p>Fee: {o.feeNote}.</p>}
    </details>
  )
}

const c2 = (n: number) => Math.round(n * 100) / 100
const mo = (n: number) => `${fmtMoney(n)}/mo`
const signed = (n: number) => `${n < 0 ? '−' : '+'}${mo(Math.abs(n))}`
// "+$8.78/mo", "Same" or "−$2.10/mo" next to your cards; "$16.58/mo" when there's no card of yours to compare with.
const extraLabel = (n: number, vs: boolean) => (!vs ? (n < 0 ? signed(n) : mo(n)) : Math.abs(n) < 0.01 ? 'Same' : signed(n))
const rowId = (key: string) => `card-${key.replace(/\W+/g, '-')}`

// A card's year as monthly amounts. Each line is rounded to cents first, so the math adds up to the row's number.
function perMonth(o: CardOption, best?: CardOption) {
  const rewards = c2(o.rewards / 12)
  const fee = c2(o.fee / 12)
  const base = best && !o.yours ? c2(best.net / 12) : 0
  return { rewards, fee, base, extra: c2(rewards - fee - base) }
}

// A card's bar, left to right: the part that matches what your best card earns now, the extra on top of it, and the
// part of the rewards the annual fee takes back. Together they're the card's rewards, so a fee card's bar is as long
// as what it earns, and the fee's share of it is plain to see. A card that earns less than yours has a shorter "now".
function segments(o: CardOption, best?: CardOption) {
  const m = perMonth(o, best)
  if (o.yours) return { now: m.rewards, more: 0, fee: 0 }
  const kept = Math.max(0, c2(m.rewards - m.fee))
  return { now: Math.min(kept, m.base), more: Math.max(0, c2(kept - m.base)), fee: Math.min(m.fee, m.rewards) }
}
const scaleOf = (options: CardOption[], best?: CardOption) =>
  Math.max(0.01, ...options.map((o) => perMonth(o, best).rewards))

// Shown when the chart has more than one kind of segment; the swatches mirror the bar segments.
function Legend({ options, best }: { options: CardOption[]; best?: CardOption }) {
  const s = options.map((o) => segments(o, best))
  const items = [
    s.some((x) => x.now > 0) && (['segNow', 'Wallet baseline'] as const),
    s.some((x) => x.more > 0) && (['segMore', best ? 'Extra' : 'After fees'] as const),
    s.some((x) => x.fee > 0) && (['segFee', 'Annual fee'] as const),
  ].filter((i) => !!i)
  if (items.length < 2) return null
  return (
    <div className={styles.legend} aria-hidden="true">
      {items.map(([cls, label]) => (
        <span key={cls}>
          <i className={styles[cls]} />
          {label}
        </span>
      ))}
    </div>
  )
}

interface RowProps {
  option: CardOption
  best?: CardOption
  max: number
  full: boolean
  open?: boolean
  showWhy?: boolean
}

function BarRow({ option: o, best, max, full, open, showWhy = true }: RowProps) {
  const m = perMonth(o, best)
  const s = segments(o, best)
  const vs = !o.yours && !!best
  const value = o.yours ? mo(m.rewards) : extraLabel(m.extra, vs)
  const spoken = o.yours
    ? `earns ${fmtMoney(m.rewards)} a month`
    : !vs
      ? `${fmtMoney(m.extra)} a month after fees`
      : Math.abs(m.extra) < 0.01
        ? 'about the same as your cards'
        : `${fmtMoney(Math.abs(m.extra))} a month ${m.extra > 0 ? 'more' : 'less'} than your cards, after fees`
  const cost = o.yours
    ? !o.known && 'Estimated'
    : [o.fee > 0 && `${fmtDollars(o.fee)}/yr fee`, !!o.deposit && `${fmtDollars(o.deposit)} deposit`]
        .filter(Boolean)
        .join(', ')
  const said = [cost && `, ${cost}`, o.why && `. Not worth it: ${o.why}`].filter(Boolean).join('')

  const body = (
    <span className={styles.barMain}>
      <span className={styles.barName}>
        <span>{o.name}</span>
        {cost && <span className={styles.barCost}>{cost}</span>}
      </span>
      <span className={styles.barLine}>
        <span className={styles.bar} style={{ width: `calc((100% - 84px) * ${(s.now + s.more + s.fee) / max})` }}>
          {s.now > 0 && <span className={styles.segNow} style={{ flexGrow: s.now }} />}
          {s.more > 0 && <span className={styles.segMore} style={{ flexGrow: s.more }} />}
          {s.fee > 0 && <span className={styles.segFee} style={{ flexGrow: s.fee }} />}
        </span>
        <span className={`${styles.barValue} ${!o.yours && !o.worth ? styles.dim : ''}`}>{value}</span>
      </span>
      {o.why && showWhy && <span className={styles.why}>{o.why}</span>}
    </span>
  )

  if (!full)
    return (
      <a
        className={styles.barRow}
        href={`#coach/${encodeURIComponent(o.key)}`}
        aria-label={`${o.name}: ${spoken}${said}. See the math`}
      >
        {body}
      </a>
    )
  return (
    <details id={rowId(o.key)} className={styles.barItem} open={open}>
      <summary className={styles.barRow} aria-label={`${o.name}: ${spoken}${said}. Show the math`}>
        {body}
      </summary>
      <OptionMath option={o} best={best} />
    </details>
  )
}

// The monthly math behind a bar: rewards, minus a new card's fee, minus what your best card already earns.
function OptionMath({ option: o, best }: { option: CardOption; best?: CardOption }) {
  const m = perMonth(o, best)
  const rates = [...new Set(o.steps.map((s) => fmtRate(o.type, s.rate)))]
  return (
    <div className={styles.math}>
      <div className={styles.mathLine}>
        <span>
          Rewards at {rates.join(', then ')} {o.type === 'cashback' ? 'cash back' : 'points'}
          {o.steps.length > 1 && <span className={styles.mathSub}>{o.steps[0].label}</span>}
          {o.type === 'points' && (
            <span className={styles.mathSub}>
              {fmtPts(o.monthlyEarn)} pts a month, counted at {o.cpp}¢ each
            </span>
          )}
          {!o.known && <span className={styles.mathSub}>Estimated at the card’s base rate</span>}
        </span>
        <span>{mo(m.rewards)}</span>
      </div>
      <div className={styles.mathLine}>
        <span>
          Annual fee
          {o.yours ? (
            <span className={styles.mathSub}>Not counted on cards you already have</span>
          ) : (
            o.fee > 0 && (
              <span className={styles.mathSub}>
                {fmtDollars(o.fee)}, charged once a year{o.feeNote && ` (${o.feeNote})`}
              </span>
            )
          )}
        </span>
        <span>{m.fee > 0 ? `−${mo(m.fee)}` : '$0'}</span>
      </div>
      {!o.yours && best && (
        <div className={styles.mathLine}>
          <span>Your {best.name} earns</span>
          <span>−{mo(m.base)}</span>
        </div>
      )}
      <div className={`${styles.mathLine} ${styles.mathTotal}`}>
        <span>{o.yours ? 'Potential rewards' : best ? 'Extra for you' : 'After fees'}</span>
        <span>{o.yours ? mo(m.extra) : extraLabel(m.extra, !!best)}</span>
      </div>
      {o.notes.map((n) => (
        <div key={n} className={styles.note}>
          {n}
        </div>
      ))}
      {o.credit && (
        <div className={styles.note}>
          {creditLabel(o.credit)}. Applying means a credit check, and approval isn’t guaranteed.
        </div>
      )}
      {o.url && (
        <a className={styles.moreLink} href={o.url} target="_blank" rel="noreferrer">
          Terms from {o.issuer} ›
        </a>
      )}
    </div>
  )
}

interface GoalProps {
  balances: Balance[]
  category: CategoryId
  variant?: 'condensed' | 'full'
}

// The next credit tier as a goal: cards usually made for it that would earn more on this category than any card for
// the user's tier. Issuers don't publish score cutoffs, so the copy says "usually for", never "you'll qualify". Home
// shows the top one in a line; the full page charts them like the comparison, with the math.
export function ScoreGoal({ balances, category, variant = 'condensed' }: GoalProps) {
  const goal = scoreGoal(balances, category)
  if (!goal) return null
  const top = goal.cards[0]
  const shown = goal.cards.slice(0, HOME_LIMIT)
  const tier = CREDIT_TIERS.find((t) => t.id === CREDIT)!.label.toLowerCase()
  const meter = (
    <div
      className={styles.meter}
      role="progressbar"
      aria-label={`Credit score: ${CREDIT_SCORE} of a ${goal.score} goal`}
      aria-valuemin={goal.from}
      aria-valuemax={goal.score}
      aria-valuenow={CREDIT_SCORE}
    >
      <span className={styles.meterBar}>
        <span
          className={styles.meterFill}
          style={{ width: `${Math.round(((CREDIT_SCORE - goal.from) / (goal.score - goal.from)) * 100)}%` }}
        />
      </span>
      <span>{goal.toGo} points to go</span>
    </div>
  )

  if (variant === 'condensed') {
    if (!top) return null
    const extra = perMonth(top, goal.best).extra
    return (
      <div className={styles.goal}>
        <span className={styles.goalIcon} aria-hidden="true">
          🎯
        </span>
        <div className={styles.goalMain}>
          <div className={styles.goalText}>
            <b>{top.name}</b> is usually for scores of {goal.score}+. It could {goal.best ? 'add' : 'earn'} {mo(extra)} on{' '}
            {catName(category)}
            {top.fee === 0 && ', with no annual fee'}.
          </div>
          {meter}
        </div>
      </div>
    )
  }

  const max = scaleOf(shown, goal.best)
  return (
    <div className={styles.card}>
      <h2>Your goal: a {goal.score} score</h2>
      <div className={styles.cardSub}>
        {top
          ? `You’re at ${CREDIT_SCORE}. Cards usually for scores of ${goal.score}+ would earn more on your ${catName(category)} than cards for ${tier} credit.`
          : `You’re at ${CREDIT_SCORE}. Cards usually for scores of ${goal.score}+ wouldn’t earn more on your ${catName(category)} than cards for ${tier} credit.`}
      </div>
      {meter}
      {shown.length > 0 && (
        <>
          <div className={styles.chartHead}>
            <Legend options={shown} best={goal.best} />
          </div>
          <div className={styles.colHead}>
            <h3>Usually for {goal.score}+</h3>
          </div>
          {shown.map((o) => (
            <BarRow key={o.key} option={o} best={goal.best} max={max} full />
          ))}
        </>
      )}
      <div className={styles.goalTip}>
        Paying on time and keeping card balances low move your score the most. Each application is a credit check, so
        applying for fewer cards helps too. A higher score can improve your odds, but approval is never guaranteed.
      </div>
    </div>
  )
}

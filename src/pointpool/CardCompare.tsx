import { useState, type CSSProperties, type ReactNode } from 'react'
import { LuCheck } from 'react-icons/lu'
import {
  catName,
  compareCards,
  CREDIT_SCORE,
  fmtDollars,
  fmtMoney,
  fmtRate,
  feeFilters,
  MIN_GAIN,
  passesFee,
  scoreGoal,
  SPEND,
  TOP_CATEGORIES,
  type Balance,
  type CardOption,
  type CategoryId,
  type FeeFilter,
} from './data'
import { artFor } from './cardColors'
import { pressable } from './a11y'
import { SpendingControls } from './shared'
import styles from './pointpool.module.css'

export interface CompareProps {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
}

// One category, side by side: the user's card now vs. the card they could apply for. Recommendations always use the
// strongest owned card, even when the user explores another baseline.
export function CardCompare({ balances, category, onCategory, onEdit }: CompareProps) {
  const { yours, best, worth, close, rest } = compareCards(balances, category)
  // "No cards" means none we can estimate: an onboarding "other" card alone gets the first-card view, not an empty wallet.
  const noCards = yours.length === 0
  const [selection, setSelection] = useState<{ category: CategoryId; key: string }>()
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all')
  const selected = (selection?.category === category && yours.find((o) => o.key === selection.key)) || best
  const isBest = selected?.key === best?.key
  const selectedIndex = Math.max(0, yours.findIndex((o) => o.key === selected?.key))
  // The fee filter only narrows the new card on the right; the user's own cards are never filtered out.
  const alternatives = [...worth, ...close, ...rest].filter((o) => passesFee(o, feeFilter)).sort((a, b) => b.net - a.net)
  const suggested = alternatives.find((o) => worth.includes(o)) ?? alternatives[0]
  const recommends = !!suggested && worth.includes(suggested)
  // The border and badge go on whichever of the two tiles earns more a year after fees, so they always match the
  // numbers shown. (The $2/mo threshold still decides the wording and the "Review card" button, not the highlight.)
  const suggestedEarnsMore = !!suggested && (!selected || suggested.net > selected.net)
  const gain = suggested ? Math.round((suggested.net - (selected?.net ?? 0)) * 100) / 100 : 0
  const spend = SPEND[category]
  const categoryLabel = TOP_CATEGORIES.find((c) => c.id === category)?.label ?? catName(category)

  return (
    <>
      <div className={styles.compareHead}>
        <SpendingControls category={category} onCategory={onCategory} feeFilter={feeFilter} onFeeFilter={setFeeFilter} />
        <div className={styles.compareHeading}>
          <h3>{categoryLabel} · {noCards ? 'what could you earn?' : 'which card wins?'}</h3>
          <span>{fmtDollars(spend * 12)} / yr</span>
        </div>
      </div>
      {noCards ? (
        <>
          <p className={styles.firstCardIntro}>{balances.length ? 'Your cards don’t have reward estimates yet.' : 'No cards added yet.'} Your everyday spending could earn rewards.</p>
          {suggested ? <FirstCardOpportunity option={suggested} category={category} recommended={recommends} /> : (
            <div className={styles.compareEmpty}>No cards to estimate for this category yet.</div>
          )}
        </>
      ) : <div className={styles.compareGrid}>
        <div className={styles.compareColumn}>
          <h4>
            <span className={styles.colEyebrow}>Now</span>
            {!selected ? 'Your wallet' : yours.length > 1
              ? <>Your cards <span className={styles.cardCount}>{selectedIndex + 1}/{yours.length}</span></>
              : 'Your card'}
          </h4>
          {selected ? (
            // With more than one card, tapping the card steps through the wallet, highest estimate first, then wraps.
            <CompareTile
              key={selected.key}
              option={selected}
              category={category}
              winner={!suggestedEarnsMore}
              onTap={yours.length > 1 ? () => setSelection({ category, key: yours[(selectedIndex + 1) % yours.length].key }) : undefined}
              tapLabel={`${selected.name}, card ${selectedIndex + 1} of ${yours.length}. Tap to compare the next one.`}
            />
          ) : (
            <div className={styles.compareEmpty}>
              <p>Your cards don’t have reward estimates yet.</p>
              <button className={styles.btnText} onClick={() => onEdit()}>Add a card</button>
            </div>
          )}
        </div>
        <div className={styles.compareColumn}>
          <h4>
            <span className={styles.colEyebrow}>If you apply</span>
            {!suggested ? 'No options yet' : recommends ? 'A card that could earn more' : 'Closest new card'}
          </h4>
          {suggested ? <CompareTile option={suggested} category={category} winner={suggestedEarnsMore} /> : (
            <div className={styles.compareEmpty}>
              <p>{feeFilter === 'all'
                ? 'No new cards to compare for this category.'
                : `No new cards match the ${feeFilters.find((f) => f.value === feeFilter)!.label.toLowerCase()} filter here.`}</p>
              {feeFilter !== 'all' && <button className={styles.btnText} onClick={() => setFeeFilter('all')}>Show all cards</button>}
            </div>
          )}
        </div>
      </div>}
      {!noCards && yours.length > 1 && (
        <p className={styles.compareHint}>
          Tap your card to compare the next one · <b>{selectedIndex + 1} of {yours.length}</b>
        </p>
      )}
      {/* The tiles already carry the numbers, so the sentence explaining them opens on a tap instead of taking up
          room above the button. */}
      <details className={styles.compareTakeaway}>
        <summary>
          <LuCheck aria-hidden="true" />
          What this means
        </summary>
        <div>
          {noCards ? (
            recommends && suggested ? (
              <><strong>Your spending could earn {fmtDollars(suggested.net)} a year</strong> on {catName(category)}
                {suggested.fee > 0 ? ` after the ${fmtDollars(suggested.fee)} annual fee` : ', with no annual fee'}.
                {' '}Estimate assumes you pay in full.</>
            ) : <><strong>No card to recommend on this spending yet.</strong> Compare more cards to see what else could fit.</>
          ) : recommends && suggested ? (
            <><strong>{fmtDollars(gain)} {selected ? 'more ' : ''}per year</strong>{selected
              ? ` compared with ${isBest ? 'your highest-earning card' : selected.name} for ${catName(category)}`
              : ` in estimated rewards on ${catName(category)}`}{suggested.fee > 0 ? `, after the ${fmtDollars(suggested.fee)} annual fee.` : ', with no annual fee.'}</>
          ) : best ? (
            <><strong>{best.name} already earns well on {catName(category)}.</strong> {suggested && suggested.net > best.net
              ? `New cards we looked at would add less than ${fmtMoney(MIN_GAIN)} a month.`
              : 'New cards we looked at wouldn’t earn more here.'}</>
          ) : 'Add a card we can estimate to see how a new card compares.'}
        </div>
      </details>
      {recommends && suggested?.url && (
        <a className={styles.compareCta} href={suggested.url} target="_blank" rel="noreferrer">Review card & fees <span aria-hidden="true">↗</span></a>
      )}
      {noCards && <div className={styles.firstCardAdd}>Already have a card? <button className={styles.btnText} onClick={() => onEdit()}>Add it to compare</button></div>}
    </>
  )
}


// The rate averaged over a year of steps: a 5% rotating category featured one quarter reads as about 2%, not 5%.
const avgRate = (o: CardOption) => {
  const spend = o.steps.reduce((t, x) => t + x.spend, 0)
  return spend > 0 ? Math.round((o.steps.reduce((t, x) => t + x.spend * x.rate, 0) / spend) * 10) / 10 : o.rate
}
const rateNote = (o: CardOption) => `*Averaged over a year: ${fmtRate(o.type, o.rate)} during bonus periods or up to a cap.`

function FirstCardOpportunity({ option: o, category, recommended }: {
  option: CardOption; category: CategoryId; recommended: boolean
}) {
  return (
    <div className={styles.firstCardOpportunity}>
      <div className={styles.firstCardEyebrow}>{recommended ? 'Your potential rewards' : 'Estimated annual value'}</div>
      <div className={styles.firstCardValue}>{fmtDollars(o.net)}<span>/ year</span></div>
      <p className={styles.firstCardMonthly}>About {fmtMoney(o.net / 12)}/mo{o.fee > 0 ? ' after the annual fee' : ''}</p>
      <div className={styles.firstCardProduct}>
        <CardFace option={o} />
        <div>
          <div className={styles.compareRate}>{fmtRate(o.type, avgRate(o))}{o.steps.length > 1 && <small>*</small>}</div>
          <div className={styles.compareRateLabel}>{o.type === 'cashback' ? 'cashback' : 'points'} on {catName(category)}</div>
          {o.steps.length > 1 && <div className={styles.rateNote}>{rateNote(o)}</div>}
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

// The card's face: brand-tinted art rather than issuer photography, matching the wallet tiles.
function CardFace({ option: o }: { option: CardOption }) {
  const art = artFor(o.short)
  return (
    <div
      className={`${styles.cardFace} ${!o.yours ? styles.newCardFace : ''}`}
      style={{ '--art-from': art.from, '--art-to': art.to } as CSSProperties}
    >
      <span className={styles.faceChip} aria-hidden="true" />
      <span className={styles.cardIssuer}>{o.issuer}</span>
      <strong>{o.name}</strong>
      <span className={styles.cardOwnership}>{o.yours ? 'In your wallet' : 'New card'}</span>
    </div>
  )
}

function CompareTile({ option: o, category, winner, children, onTap, tapLabel }: {
  option: CardOption; category: CategoryId; winner: boolean; children?: ReactNode; onTap?: () => void; tapLabel?: string
}) {
  // The tap target covers the card and its numbers but not "Reward details", which opens on its own.
  const tap = onTap ? { className: styles.tileTap, ...pressable(onTap, tapLabel ?? o.name) } : { className: styles.tileBody }
  return (
    <div className={`${styles.compareTile} ${winner ? styles.compareWinner : ''} ${onTap ? styles.tappable : ''}`}>
      {winner && <span className={styles.winnerBadge}>{o.yours ? 'In your wallet' : 'Best pick'}</span>}
      <div {...tap}>
      <CardFace option={o} />
      <div className={styles.pickerSpace}>
        {children}
        {!o.yours && <span className={o.fee > 0 ? styles.cardFeeTag : styles.cardNoFeeTag}>{o.fee > 0 ? `${fmtDollars(o.fee)}/yr fee` : 'No annual fee'}</span>}
      </div>
      <div className={styles.compareRate}>{fmtRate(o.type, avgRate(o))}{o.steps.length > 1 && <small>*</small>}</div>
      <div className={styles.compareRateLabel}>{o.type === 'cashback' ? 'cashback' : 'points'} on {catName(category)}</div>
      {(!o.known || o.steps.length > 1 || o.type === 'points') && <div className={styles.rateNote}>
        {!o.known ? 'Estimated base rate. ' : ''}{o.steps.length > 1 ? `${rateNote(o)} ` : ''}{o.type === 'points' ? `Valued at ${o.cpp}¢/point.` : ''}
      </div>}
      <dl className={styles.compareNumbers}>
        <div><dt>Rewards / yr</dt><dd>{fmtDollars(o.rewards)}</dd></div>
        <div className={o.fee > 0 ? styles.paidFeeRow : undefined}><dt>{o.yours ? 'Added fee / yr' : 'Annual fee'}</dt><dd>{o.fee > 0 ? `−${fmtDollars(o.fee)}` : '$0'}</dd></div>
        <div className={styles.compareNet}><dt>{o.yours ? 'Category value' : 'After new fee'}</dt><dd>{fmtDollars(o.net)}</dd></div>
      </dl>
      </div>
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

interface GoalProps {
  balances: Balance[]
  category: CategoryId
}

// The next credit tier as a goal: the top card usually made for it that would earn more on this category than any
// card for the user's tier. Issuers don't publish score cutoffs, so the copy says "usually for", never "you'll qualify".
export function ScoreGoal({ balances, category }: GoalProps) {
  const goal = scoreGoal(balances, category)
  const top = goal?.cards[0]
  if (!goal || !top) return null
  // A month on the card, after its fee, over what the user's best card earns now. Each line is rounded to cents first.
  const extra = c2(c2(top.rewards / 12) - c2(top.fee / 12) - (goal.best ? c2(goal.best.net / 12) : 0))
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
          <span>{goal.toGo} to go to {goal.score}</span>
        </div>
      </div>
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import { LuCheck, LuChevronDown, LuReceipt } from 'react-icons/lu'
import {
  catName,
  compareCards,
  CREDIT_SCORE,
  fmtDollars,
  fmtMoney,
  fmtRate,
  scoreGoal,
  SPEND,
  TOP_CATEGORIES,
  type Balance,
  type CardOption,
  type CategoryId,
} from './data'
import styles from './pointpool.module.css'

export interface CompareProps {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
}

// One category, side by side: the user's card now vs. the card they could apply for. Recommendations always use the
// strongest owned card, even when the user explores another baseline.
export function CardCompare({ balances, category, onEdit }: CompareProps) {
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
  const incomplete = yours.length < balances.length || yours.some((o) => !o.known)

  return (
    <>
      <div className={styles.compareHeading}>
        <h3>{categoryLabel} · {noCards ? 'what could you earn?' : 'which card wins?'}</h3>
        <span>{fmtDollars(spend * 12)} / yr</span>
      </div>
      {noCards ? (
        <>
          <p className={styles.firstCardIntro}>No cards added yet. Your everyday spending could earn rewards.</p>
          {suggested ? <FirstCardOpportunity option={suggested} category={category} recommended={recommends} /> : (
            <div className={styles.compareEmpty}>No cards to estimate for this category yet.</div>
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
            ) : <><strong>No card to recommend on this spending yet.</strong> Compare more cards to see what else could fit.</>
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
    </>
  )
}

// Collapsed by default to keep the comparison compact. The fee isn't repeated on the summary row — the tile above
// already carries it twice, as a tag and as a line in the math — so it leads the panel instead.
function NewCardCommitment({ option: o }: { option: CardOption }) {
  return (
    <details className={styles.cardCommitment}>
      <summary className={styles.commitmentSummary}>
        <LuReceipt aria-hidden="true" />
        <span className={styles.commitmentLabel}>Before you apply</span>
        <LuChevronDown className={styles.commitmentChevron} aria-hidden="true" />
      </summary>
      <div className={styles.commitmentBody}>
        <div className={styles.commitmentFee}>{fmtDollars(o.fee)}<span>annual fee</span></div>
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
          <span>{goal.toGo} points to go</span>
        </div>
      </div>
    </div>
  )
}

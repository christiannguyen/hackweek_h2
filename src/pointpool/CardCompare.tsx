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

export interface CompareProps {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
  variant?: 'condensed' | 'full'
}

// Cards worth getting shown on home; the full page lists them all.
const HOME_LIMIT = 3

// What the last 30 days of spending in one of the user's top categories earns a month: on each of your cards now,
// and what cards for your credit score would add after their annual fees, on the same spending. The full variant
// opens each row into the math and adds the cards that aren't worth it: close calls with their reason, the rest
// folded under one line.
export function CardCompare({ balances, category, onCategory, onEdit, variant = 'condensed' }: CompareProps) {
  const full = variant === 'full'
  const { yours, best, worth, close, rest } = compareCards(balances, category)
  const shownWorth = full ? worth : worth.slice(0, HOME_LIMIT)
  // When every folded card loses to your best one, the summary says so once instead of on each row.
  const beatsNone = !!best && rest.every((o) => o.gain <= 0)
  const one = rest.length === 1
  const restLabel = beatsNone
    ? `${one ? 'doesn’t' : 'don’t'} beat your ${best.name}`
    : one
      ? 'isn’t worth it'
      : 'aren’t worth it'
  const row = (o: CardOption, open?: boolean) => <OptionRow key={o.key} option={o} best={best} full={full} open={open} />
  const tier = CREDIT_TIERS.find((t) => t.id === CREDIT)!

  return (
    <>
      {/* The two things the comparison is based on: the score (which cards are made for you) and the spending */}
      <div className={styles.scoreLine}>
        <h3>Your credit score</h3>
        <span className={styles.scoreValue}>
          {CREDIT_SCORE}
          <span className={`${styles.tag} ${styles.sm} ${styles.gray}`}>{tier.label}</span>
        </span>
      </div>
      <h3 className={styles.groupHead}>Your top spending in the last 30 days</h3>
      <div className={styles.catTabs} role="group" aria-label="Category">
        {TOP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`${styles.catTab} ${c.id === category ? styles.active : ''}`}
            aria-pressed={c.id === category}
            onClick={() => onCategory(c.id)}
          >
            <span className={styles.catLabel}>{c.label}</span>
            <span className={styles.catSpend}>{fmtMoney(SPEND[c.id])}</span>
          </button>
        ))}
      </div>

      <div className={styles.colHead}>
        <h3>Your cards</h3>
        {yours.length > 0 && <span>Earns now</span>}
      </div>
      {yours.length === 0 ? (
        <div className={styles.empty}>
          Add a card to compare it.
          <div>
            <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
              + Add a card
            </button>
          </div>
        </div>
      ) : (
        yours.map((o) => row(o))
      )}

      <div className={styles.colHead}>
        <h3>Cards for {tier.label.toLowerCase()} credit</h3>
        {worth.length > 0 && <span>{best ? 'Extra, after fees' : 'After fees'}</span>}
      </div>
      {worth.length === 0 ? (
        // Saying "keep what you have" is the answer here, not an empty state.
        <div className={styles.fitBox}>
          <span className={styles.fitIcon} aria-hidden="true">
            ✓
          </span>
          <span>
            {best && (
              <>
                Keep using your <b>{best.name}</b> for {catName(category)}.{' '}
              </>
            )}
            No card for {tier.label.toLowerCase()} credit adds enough to be worth applying.
          </span>
        </div>
      ) : (
        // On the full page the top pick starts open, so its math shows without a tap.
        shownWorth.map((o, i) => row(o, full && i === 0))
      )}

      {full && close.length + rest.length > 0 && (
        <>
          <div className={styles.colHead}>
            <h3>Not worth it for you</h3>
          </div>
          {close.map((o) => row(o))}
          {rest.length > 0 && (
            <details className={styles.skip}>
              <summary>
                {rest.length} {close.length > 0 && 'more '}
                {one ? 'card' : 'cards'} {restLabel}
              </summary>
              {rest.map((o) => (
                <OptionRow
                  key={o.key}
                  option={o}
                  best={best}
                  full
                  showWhy={!(beatsNone && o.whyKind === 'less')}
                />
              ))}
            </details>
          )}
        </>
      )}

      {full && (
        <div className={styles.sample}>
          Based on your last 30 days, counted as if you only switch cards: same stores, same spending, no extra steps
          like paying a certain way. A card is worth it when it adds at least {fmtMoney(MIN_GAIN)} a month after its
          fee. Food & drink shows cards offered in Kikoff; other categories show popular cards. Example terms, at each
          card’s rate for the main part of a category (like grocery stores for food & drink). Points count at their cash
          value, and a new card’s annual fee is spread over 12 months. Score ranges are a guide, not a cutoff: issuers also
          look at income, debt and recent applications. Applying means a credit check, and approval isn’t guaranteed.
        </div>
      )}
    </>
  )
}

const c2 = (n: number) => Math.round(n * 100) / 100
const mo = (n: number) => `${fmtMoney(n)}/mo`
const signed = (n: number) => `${n < 0 ? '−' : '+'}${mo(Math.abs(n))}`
// "+$8.78/mo", "Same" or "−$2.10/mo" next to your cards; "$16.58/mo" when there's no card of yours to compare with.
const extraLabel = (n: number, vs: boolean) => (!vs ? (n < 0 ? signed(n) : mo(n)) : Math.abs(n) < 0.01 ? 'Same' : signed(n))
const kind = (o: CardOption) => `${fmtRate(o.type, o.rate)} ${o.type === 'cashback' ? 'cash back' : 'points'}`

// A card's year as monthly amounts. Each line is rounded to cents first, so the math adds up to the row's number.
function perMonth(o: CardOption, best?: CardOption) {
  const rewards = c2(o.rewards / 12)
  const fee = c2(o.fee / 12)
  const base = best && !o.yours ? c2(best.net / 12) : 0
  return { rewards, fee, base, extra: c2(rewards - fee - base) }
}

interface RowProps {
  option: CardOption
  best?: CardOption
  full: boolean
  open?: boolean
  showWhy?: boolean
}

function OptionRow({ option: o, best, full, open, showWhy = true }: RowProps) {
  const m = perMonth(o, best)
  const vs = !o.yours && !!best
  const value = o.yours ? mo(m.rewards) : extraLabel(m.extra, vs)
  const spoken = o.yours
    ? `earns ${fmtMoney(m.rewards)} a month`
    : !vs
      ? `${fmtMoney(m.extra)} a month after fees`
      : Math.abs(m.extra) < 0.01
        ? 'about the same as your cards'
        : `${fmtMoney(Math.abs(m.extra))} a month ${m.extra > 0 ? 'more' : 'less'} than your cards, after fees`
  const verdict = o.why ? `. Not worth it: ${o.why}` : ''

  const body = (
    <span className={styles.cmpTop}>
      <span className={`${styles.rowIcon} ${o.yours ? '' : styles.gray}`}>{o.short}</span>
      <span className={styles.rowMain}>
        <span className={styles.cmpName}>{o.name}</span>
        <span className={styles.cmpSub}>
          <span>
            {kind(o)}
            {!o.known && ' (est.)'}
          </span>
          {!o.yours &&
            (o.fee > 0 ? (
              <span className={`${styles.tag} ${styles.sm} ${styles.warn}`}>{fmtDollars(o.fee)} annual fee</span>
            ) : (
              <span className={`${styles.tag} ${styles.sm}`}>No annual fee</span>
            ))}
          {!!o.deposit && <span className={`${styles.tag} ${styles.sm} ${styles.gray}`}>{fmtDollars(o.deposit)} deposit</span>}
        </span>
        {o.why && showWhy && <span className={styles.why}>{o.why}</span>}
      </span>
      <span className={`${styles.rowAmount} ${o.worth ? styles.green : ''} ${!o.yours && !o.worth ? styles.dim : ''}`}>
        {value}
      </span>
    </span>
  )

  if (!full) return <div className={styles.cmpRow}>{body}</div>
  return (
    <details className={styles.cmpRow} open={open}>
      <summary className={styles.cmpSummary} aria-label={`${o.name}: ${spoken}${verdict}. Show the math`}>
        {body}
      </summary>
      <OptionMath option={o} best={best} />
    </details>
  )
}

// The monthly math behind a row: rewards, minus a new card's fee, minus what your best card already earns.
function OptionMath({ option: o, best }: { option: CardOption; best?: CardOption }) {
  const m = perMonth(o, best)
  const rates = [...new Set(o.steps.map((s) => fmtRate(o.type, s.rate)))]
  return (
    <div className={styles.math}>
      <div className={styles.mathLine}>
        <span>
          Rewards at {rates.join(', then ')}
          {o.steps.length > 1 && <span className={styles.mathSub}>{o.steps[0].label}</span>}
          {o.type === 'points' && (
            <span className={styles.mathSub}>{fmtPts(o.monthlyEarn)} pts a month, counted at their cash value</span>
          )}
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
        <span>{o.yours ? 'Earns now' : best ? 'Extra for you' : 'After fees'}</span>
        <span className={o.worth ? styles.green : ''}>
          {o.yours ? mo(m.extra) : extraLabel(m.extra, !!best)}
        </span>
      </div>
      {o.notes.map((n) => (
        <div key={n} className={styles.note}>
          {n}
        </div>
      ))}
      {o.credit && <div className={styles.note}>{creditLabel(o.credit)}</div>}
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
// shows the top one in a line; the full page lists them with the math.
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
            {catName(category)}.
          </div>
          {meter}
        </div>
      </div>
    )
  }

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
          <div className={styles.colHead}>
            <h3>Usually for {goal.score}+</h3>
            <span>{goal.best ? 'Extra, after fees' : 'After fees'}</span>
          </div>
          {shown.map((o) => (
            <OptionRow key={o.key} option={o} best={goal.best} full />
          ))}
        </>
      )}
      <div className={styles.goalTip}>
        Paying on time and keeping card balances low move your score the most. A higher score can improve your odds, but
        approval is never guaranteed.
      </div>
    </div>
  )
}

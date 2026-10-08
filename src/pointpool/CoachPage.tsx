import {
  cardEarnings,
  CATEGORIES,
  catName,
  coachTips,
  fmtRate,
  fmtMoney,
  hasEstimates,
  PROGRAMS,
  ruleFor,
  SPEND,
  SPEND_TXN_COUNT,
  type Balance,
  type CardEarning,
  type CategoryId,
  type Spend,
} from './data'
import { Disclaimer } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
}

// --- Analysis helpers ---

interface CategoryInsight {
  id: CategoryId
  label: string
  emoji: string
  spend: number
  bestCard: CardEarning | null
  bestRate: string
  monthlyReward: number
}

function analyzeSpending(balances: Balance[], spend: Spend): CategoryInsight[] {
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))
  return CATEGORIES
    .filter((c) => spend[c.id] > 0)
    .sort((a, b) => spend[b.id] - spend[a.id])
    .map((c) => {
      const earnings = cardEarnings(cards, c.id, spend)
      const best = earnings.length > 0
        ? earnings.reduce((a, b) => (a.value.cashback >= b.value.cashback ? a : b))
        : null
      return {
        id: c.id,
        label: c.label,
        emoji: c.emoji,
        spend: spend[c.id],
        bestCard: best,
        // The year-average rate, so a rotating 5% category reads as what it earns over a year.
        bestRate: best ? fmtRate(best.program.type, best.avgRate) : '1×',
        monthlyReward: best?.value.cashback ?? 0,
      }
    })
}

interface SpendingAction {
  id: string
  icon: string
  title: string
  detail: string
}

function generateActions(balances: Balance[], insights: CategoryInsight[]): SpendingAction[] {
  const actions: SpendingAction[] = []
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))

  for (const i of insights) {
    if (i.bestCard && i.bestCard.rate > 1) {
      actions.push({
        id: `use-${i.id}`,
        icon: i.emoji,
        title: `${i.bestCard.balance.cardName} could earn ${i.bestRate} on ${catName(i.id)}`,
        detail: i.bestCard.avgRate !== i.bestCard.rate
          ? `Earns ${fmtRate(i.bestCard.program.type, i.bestCard.rate)} in bonus periods, about ${i.bestRate} over a year — about ${fmtMoney(i.monthlyReward)}/mo on your ${fmtMoney(i.spend)}/mo spend.`
          : `Earns ${i.bestRate} — about ${fmtMoney(i.monthlyReward)}/mo on your ${fmtMoney(i.spend)}/mo spend.`,
      })
    }
  }

  for (const i of insights) {
    if (!i.bestCard || i.bestCard.rate <= 1) {
      actions.push({
        id: `gap-${i.id}`,
        icon: '🔍',
        title: `${i.label}: earning the base rate`,
        detail: `You spend ${fmtMoney(i.spend)}/mo here. A card with a bonus on ${catName(i.id)} could earn more; the comparison on Home shows options.`,
      })
    }
  }

  for (const b of cards) {
    const rule = ruleFor(b.cardName)
    const bonus = rule ? CATEGORIES.filter((c) => rule.rates[c.id]?.quarters) : []
    if (bonus.length > 0) {
      actions.push({
        id: `rotate-${b.id}`,
        icon: '🔁',
        title: `${b.cardName} has a quarterly bonus to activate`,
        detail: `Its rotating categories include ${bonus.map((c) => catName(c.id)).join(', ')}. The bonus rate applies once it’s activated each quarter.`,
      })
    }
  }

  for (const b of balances) {
    if (b.creditLimit && b.cardBalance && b.cardBalance / b.creditLimit > 0.3) {
      actions.push({
        id: `util-${b.id}`,
        icon: '💳',
        title: `${b.cardName}: ${Math.round((b.cardBalance / b.creditLimit) * 100)}% of your limit in use`,
        detail: 'Using less than 30% of your limit can help your credit score, and paying in full keeps interest from eating into rewards.',
      })
    }
  }

  return actions
}

// --- Component ---

export function CoachPage({ balances, onEdit }: Props) {
  const insights = analyzeSpending(balances, SPEND)
  const actions = generateActions(balances, insights)
  // Bonus and rotating-category tips repeat the actions above, so this page shows the rest.
  const tips = coachTips(balances).filter((t) => t.kind !== 'bonus' && t.kind !== 'rotating')

  const hasCards = balances.some((b) => hasEstimates(PROGRAMS[b.programId]))

  return (
    <>
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Card Coach</div>
      </div>

      {!hasCards && (
        <div className={styles.card}>
          <div className={styles.empty}>
            Add your cards to get personalized coaching.
            <div>
              <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
                + Add a card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spending breakdown */}
      {insights.length > 0 && (
        <div className={styles.card}>
          <h2>Your spending breakdown</h2>
          <div className={styles.cardSub}>Based on {SPEND_TXN_COUNT} transactions from the last 30 days. Here’s where your money goes and how each card earns.</div>
          {insights.map((i) => (
            <div key={i.id} className={styles.coachCatRow}>
              <div className={styles.coachCatHead}>
                <span>{i.emoji} {i.label}</span>
                <span className={styles.coachCatSpend}>{fmtMoney(i.spend)}/mo</span>
              </div>
              {i.bestCard ? (
                <div className={styles.coachCatDetail}>
                  <span className={styles.coachCatCard}>
                    Highest in your wallet: <b>{i.bestCard.balance.cardName}</b> at {i.bestRate}
                  </span>
                  <span className={styles.coachCatEarn}>
                    ≈{fmtMoney(i.monthlyReward)}/mo
                  </span>
                </div>
              ) : (
                <div className={styles.coachCatDetail}>
                  <span className={styles.rowSub}>No cards earn a bonus here</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className={styles.card}>
          <h2>Ideas for your spending</h2>
          {actions.map((a) => (
            <div key={a.id} className={styles.row}>
              <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>{a.icon}</div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>{a.title}</div>
                <div className={styles.rowSub}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick tips */}
      {tips.length > 0 && (
        <>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>More tips</span>
          </div>
          {tips.map((t) =>
            t.href === '#coach' && !t.balanceId ? (
              <div key={t.id} className={styles.tip}>
                <div className={styles.tipIcon}>{t.icon}</div>
                <div className={`${styles.tipText} ${styles.tipMain}`}>{t.text}</div>
              </div>
            ) : (
              <a
                key={t.id}
                className={styles.tip}
                href={t.href}
                onClick={
                  t.balanceId
                    ? (e) => { e.preventDefault(); onEdit(t.balanceId) }
                    : undefined
                }
              >
                <div className={styles.tipIcon}>{t.icon}</div>
                <div className={`${styles.tipText} ${styles.tipMain}`}>{t.text}</div>
                <span className={styles.chev}>›</span>
              </a>
            ),
          )}
        </>
      )}


      <Disclaimer />
    </>
  )
}

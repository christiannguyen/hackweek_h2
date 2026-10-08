import {
  cardEarnings,
  cardStacking,
  CATEGORIES,
  catName,
  coachTips,
  CREDIT_SCORE,
  expirationWarnings,
  fmtMoney,
  fmtRate,
  fmtUSD,
  graduationMilestones,
  hasEstimates,
  leftOnTable,
  PROGRAMS,
  redemptionMath,
  ruleFor,
  seasonalTips,
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
        bestRate: best ? fmtRate(best.program.type, best.avgRate) : '1x',
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
        detail: `Its rotating categories include ${bonus.map((c) => catName(c.id)).join(', ')}. The bonus rate applies once it's activated each quarter.`,
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
  const tips = coachTips(balances).filter((t) => t.kind !== 'bonus' && t.kind !== 'rotating')

  const hasCards = balances.some((b) => hasEstimates(PROGRAMS[b.programId]))

  const stacking = cardStacking(balances)
  const missed = leftOnTable(balances)
  const seasonal = seasonalTips()
  const expirations = expirationWarnings(balances)
  const milestones = graduationMilestones(balances, CREDIT_SCORE)
  const redemptions = redemptionMath(balances)

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

      {/* What you left on the table */}
      {missed && (
        <div className={styles.card}>
          <h2>What you left on the table</h2>
          <div className={styles.cardSub}>
            Last month you could have earned <strong style={{ color: 'var(--orange)', fontWeight: 600 }}>{fmtMoney(missed.total)} more</strong> by using the right card for each purchase.
          </div>
          {missed.byCategory.map((c) => (
            <div key={c.id} className={styles.coachCatRow}>
              <div className={styles.coachCatHead}>
                <span>{c.emoji} {c.label}</span>
                <span style={{ color: 'var(--orange)', fontWeight: 600 }}>+{fmtMoney(c.missed)}</span>
              </div>
              <div className={styles.coachCatDetail}>
                <span className={styles.rowSub}>Base rate: {fmtMoney(c.actual)} vs optimal: {fmtMoney(c.optimal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card stacking guide */}
      {stacking.length > 0 && (
        <div className={styles.card}>
          <h2>Your wallet cheat sheet</h2>
          <div className={styles.cardSub}>Which card to use for what — based on your spending.</div>
          {stacking.map((s) => (
            <div key={s.category.id} className={styles.row} onClick={() => onEdit(s.card.id)}>
              <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>{s.category.emoji}</div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitleLine}>
                  <span className={styles.rowTitle}>{s.category.label}</span>
                  <span className={styles.tag + ' ' + styles.sm}>{s.rateLabel}</span>
                </div>
                <div className={styles.rowSub}>
                  Use <b>{s.card.cardName}</b> — earns ~{fmtMoney(s.monthly)}/mo
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seasonal tips */}
      {seasonal.length > 0 && (
        <div className={styles.card}>
          <h2>Timely tips</h2>
          {seasonal.map((t) => (
            <div key={t.id} className={styles.row}>
              <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>{t.icon}</div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>{t.title}</div>
                <div className={styles.rowSub}>{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points expiration warnings */}
      {expirations.length > 0 && (
        <div className={styles.card} style={{ borderLeft: '4px solid var(--orange)' }}>
          <h2>Expiration alerts</h2>
          {expirations.map((w) => (
            <div key={w.balance.id} className={styles.row} onClick={() => onEdit(w.balance.id)}>
              <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>
                {w.severity === 'warning' ? '🚨' : '⏳'}
              </div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>{w.balance.cardName}</div>
                <div className={styles.rowSub}>{w.message}</div>
              </div>
              <span className={styles.chev}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* Redemption math */}
      {redemptions.length > 0 && (
        <div className={styles.card}>
          <h2>The real math on redemption</h2>
          <div className={styles.cardSub}>Not all redemption methods are equal. Here is what your points are actually worth.</div>
          {redemptions.map((r) => (
            <div key={r.balance.id} style={{ marginTop: 14 }}>
              <div className={styles.rowTitle}>{r.balance.cardName}</div>
              <div className={styles.rowSub} style={{ marginBottom: 8 }}>
                {Math.round(r.balance.amount).toLocaleString()} {r.program.unit}
              </div>
              {r.methods.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px', marginTop: 4,
                    borderRadius: 10,
                    background: m.best ? 'var(--green-tint)' : '#f7f7f8',
                  }}
                >
                  <span style={{ fontSize: 13 }}>
                    {m.emoji} {m.label}
                    <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 6 }}>
                      {m.cpp}c per point
                    </span>
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: m.best ? 'var(--green)' : 'var(--ink)' }}>
                    {fmtUSD(m.value)}
                    {m.best && <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 500 }}>Best</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Kikoff graduation milestones */}
      {milestones.length > 0 && (
        <div className={styles.card}>
          <h2>Your credit journey</h2>
          <div className={styles.cardSub}>
            Building credit unlocks better cards with higher rewards. Here is where you stand.
          </div>
          {milestones.map((m) => (
            <div key={m.id} className={styles.row}>
              <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>
                {m.achieved ? '✅' : m.icon}
              </div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitleLine}>
                  <span className={styles.rowTitle}>{m.title}</span>
                  {m.achieved && <span className={styles.tag + ' ' + styles.sm}>Done</span>}
                </div>
                <div className={styles.rowSub}>{m.detail}</div>
                {!m.achieved && (
                  <div className={styles.meter} style={{ marginTop: 6 }}>
                    <div className={styles.meterBar} style={{ height: 6 }}>
                      <span className={styles.meterFill} style={{ width: `${Math.round(m.progress * 100)}%` }} />
                    </div>
                    <span>{Math.round(m.progress * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spending breakdown */}
      {insights.length > 0 && (
        <div className={styles.card}>
          <h2>Your spending breakdown</h2>
          <div className={styles.cardSub}>Based on {SPEND_TXN_COUNT} transactions from the last 30 days. Here's where your money goes and how each card earns.</div>
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

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
import c from './coach.module.css'

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
    if (i.bestCard && i.bestCard.terms && i.bestCard.rate > i.bestCard.base) {
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
    // Only for wallets with cards we can estimate; with none, every category would read "base rate".
    if (cards.length > 0 && (!i.bestCard || !i.bestCard.terms || i.bestCard.rate <= i.bestCard.base)) {
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

// Share of spending matched to a strong rate: each category's best card, in cash value per dollar over a year (caps,
// rotating quarters and points value included), against a 5%-back card. A rotating 5% reads as its ~2% average.
function walletScore(insights: CategoryInsight[]): number {
  let totalSpend = 0
  let weighted = 0
  for (const i of insights) {
    totalSpend += i.spend
    const pct = i.spend > 0 ? (i.monthlyReward / i.spend) * 100 : 0
    weighted += i.spend * Math.min(1, pct / 5)
  }
  return totalSpend > 0 ? Math.round((weighted / totalSpend) * 100) : 0
}

// --- Component ---

export function CoachPage({ balances, onEdit }: Props) {
  const insights = analyzeSpending(balances, SPEND)
  const score = walletScore(insights)
  const actions = generateActions(balances, insights)
  const tips = coachTips(balances).filter((t) => t.kind !== 'bonus' && t.kind !== 'rotating')

  const hasCards = balances.some((b) => hasEstimates(PROGRAMS[b.programId]))

  const stacking = cardStacking(balances)
  const missed = leftOnTable(balances)
  const seasonal = seasonalTips(undefined, balances)
  const expirations = expirationWarnings(balances)
  const milestones = graduationMilestones(balances, CREDIT_SCORE)
  const redemptions = redemptionMath(balances)

  const topMissed = missed?.byCategory.reduce((a, b) => (a.missed >= b.missed ? a : b))
  const maxStackMonthly = Math.max(...stacking.map((s) => s.monthly), 0)

  const quickActions = [
    { id: 'coach-cheat', icon: '🃏', label: 'Cheat sheet', color: c.blue, show: stacking.length > 0 },
    { id: 'coach-redeem', icon: '💎', label: 'Redeem', color: c.purple, show: redemptions.length > 0 },
    { id: 'coach-credit', icon: '📈', label: 'Credit', color: c.orange, show: milestones.length > 0 },
    { id: 'coach-ideas', icon: '💡', label: 'Ideas', color: c.pink, show: actions.length > 0 || tips.length > 0 },
  ].filter((q) => q.show)

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const tint = (i: number) => c[`tint${i % 5}`]

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Card Coach</h1>
      </div>

      {/* Rewards score hero. No combined rewards total: each program's rewards stay in that program. */}
      {hasCards && (
        <div className={c.hero}>
          <div className={c.heroTop}>
            <div>
              <div className={c.heroLabel}>Your rewards score</div>
              <div className={c.heroLine}>Your cards match</div>
              <div className={c.heroScore}>{score}% 🎯</div>
            </div>
            <div className={c.heroBadge} aria-hidden>✨</div>
          </div>
          <div className={c.heroNote}>
            {score >= 70 ? 'of your spending with a strong rate. Your cards fit how you spend.'
              : score >= 40 ? 'of your spending with a strong rate. The ideas below show where it could go higher.'
              : 'of your spending with a strong rate. Most of it earns about 1–2% today.'}
          </div>
          <div className={c.heroMeterHead}>
            <span>Compared with a 5%-back card in every category</span>
          </div>
          <div className={c.heroMeter}><span style={{ width: `${score}%` }} /></div>
        </div>
      )}

      {!hasCards && (
        <div className={c.panel}>
          <div className={c.panelTitle}>Get personalized coaching</div>
          <div className={c.panelSub}>Add your cards and we'll show which one to use for every purchase.</div>
          <button className={c.cta} onClick={() => onEdit()}>+ Add a card</button>
        </div>
      )}

      {/* What you left on the table */}
      {missed && topMissed && (
        <button className={c.promo} onClick={() => jump(stacking.length > 0 ? 'coach-cheat' : 'coach-breakdown')}>
          <div className={c.promoMain}>
            <div className={c.promoIcon} aria-hidden>💸</div>
            <div className={c.promoTitle}>Your best card for each category</div>
            <div className={c.promoSub}>Compared with a flat 1% card, using your best card in {topMissed.label.toLowerCase()} could add about {fmtMoney(topMissed.missed)} a month. Illustrative.</div>
            <div className={c.promoFoot}>
              <span className={c.pill}>{topMissed.emoji} {topMissed.label} +{fmtMoney(topMissed.missed)}/mo</span>
            </div>
          </div>
          <span className={c.promoChev} aria-hidden>›</span>
        </button>
      )}

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className={c.quick}>
          {quickActions.map((q) => (
            <button key={q.id} className={c.quickBtn} onClick={() => jump(q.id)}>
              <span className={`${c.quickIcon} ${q.color}`} aria-hidden>{q.icon}</span>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Card stacking guide */}
      {stacking.length > 0 && (
        <>
          <div id="coach-cheat" className={c.sectionHead}>
            <span className={c.sectionTitle}>Your wallet cheat sheet</span>
            <span className={c.sectionMeta}>{stacking.length} categories</span>
          </div>
          <div className={c.carousel}>
            {stacking.map((s, i) => (
              <button key={s.category.id} className={c.slide} onClick={() => onEdit(s.card.id)}>
                <div className={`${c.slideArt} ${c[`art${i % 5}`]}`}>
                  <span aria-hidden>{s.category.emoji}</span>
                  <span className={c.slideRate}>{s.rateLabel}</span>
                </div>
                <div className={c.slideTitle}>{s.category.label}</div>
                <div className={c.slideSub}>Use {s.card.cardName}</div>
                <div className={c.slideFoot}>
                  <span>~{fmtMoney(s.monthly)}/mo</span>
                  <span className={c.slideBar}>
                    <span style={{ width: `${maxStackMonthly > 0 ? Math.round((s.monthly / maxStackMonthly) * 100) : 0}%` }} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Expiration alerts + seasonal tips */}
      {(expirations.length > 0 || seasonal.length > 0) && (
        <>
          <div className={c.sectionHead}>
            <span className={c.sectionTitle}>Coming up</span>
          </div>
          <div className={c.list}>
            {expirations.map((w) => (
              <button key={w.balance.id} className={c.item} onClick={() => onEdit(w.balance.id)}>
                <div className={`${c.itemIcon} ${c.tint3}`} aria-hidden>⏳</div>
                <div className={c.itemMain}>
                  <div className={c.itemTitle}>Check when your {w.balance.cardName} {PROGRAMS[w.balance.programId].unit} expire</div>
                  <div className={c.itemSub}>{w.message}</div>
                </div>
                <span className={c.itemAction} aria-hidden>›</span>
              </button>
            ))}
            {seasonal.map((t, i) => (
              <div key={t.id} className={c.item}>
                <div className={`${c.itemIcon} ${tint(i + 1)}`} aria-hidden>{t.icon}</div>
                <div className={c.itemMain}>
                  <div className={c.itemTitle}>{t.title}</div>
                  <div className={c.itemSub}>{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Redemption math */}
      {redemptions.length > 0 && (
        <>
          <div id="coach-redeem" className={c.sectionHead}>
            <span className={c.sectionTitle}>The real math on redemption</span>
          </div>
          {redemptions.map((r) => {
            const best = r.methods.find((m) => m.best)
            const worst = r.methods.reduce((a, b) => (a.value <= b.value ? a : b))
            return (
              <div key={r.balance.id} className={c.panel}>
                <div className={c.panelHead}>
                  <span className={c.panelTitle}><span className={c.dot} />{r.balance.cardName}</span>
                  {best && best.value > worst.value && (
                    <span className={c.saveTag}>+{fmtUSD(best.value - worst.value)}</span>
                  )}
                </div>
                <div className={c.panelSub}>
                  {Math.round(r.balance.amount).toLocaleString()} {r.program.unit} · what they're worth
                </div>
                {r.methods.map((m) => (
                  <div key={m.id} className={c.check}>
                    <span className={`${c.checkMark} ${m.best ? '' : c.off}`} aria-hidden>{m.best ? '✓' : ''}</span>
                    <span>{m.emoji} {m.label} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{m.cpp}c/pt</span></span>
                    <span className={`${c.checkValue} ${m.best ? c.best : ''}`}>{fmtUSD(m.value)}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </>
      )}

      {/* Kikoff graduation milestones */}
      {milestones.length > 0 && (
        <>
          <div id="coach-credit" className={c.sectionHead}>
            <span className={c.sectionTitle}>Your credit journey</span>
            <span className={c.sectionMeta}>
              {milestones.filter((m) => m.achieved).length} / {milestones.length} done
            </span>
          </div>
          <div className={c.panel}>
            <div className={c.panelSub}>Building credit unlocks better cards with higher rewards.</div>
            {milestones.map((m) => (
              <div key={m.id} className={c.check} style={{ alignItems: 'flex-start' }}>
                <span className={`${c.checkMark} ${m.achieved ? '' : c.off}`} aria-hidden>{m.achieved ? '✓' : ''}</span>
                <div className={c.itemMain}>
                  <div className={c.itemTitle} style={{ fontSize: 13 }}>{m.icon} {m.title}</div>
                  <div className={c.itemSub}>{m.detail}</div>
                  {!m.achieved && (
                    <div className={c.progress}><span style={{ width: `${Math.round(m.progress * 100)}%` }} /></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Spending breakdown */}
      {insights.length > 0 && (
        <>
          <div id="coach-breakdown" className={c.sectionHead}>
            <span className={c.sectionTitle}>Your spending breakdown</span>
            <span className={c.sectionMeta}>{SPEND_TXN_COUNT} txns · 30d</span>
          </div>
          <div className={c.list}>
            {insights.map((i, idx) => (
              <div key={i.id} className={c.item}>
                <div className={`${c.itemIcon} ${tint(idx)}`} aria-hidden>{i.emoji}</div>
                <div className={c.itemMain}>
                  <div className={c.itemTitle}>{i.label} · {fmtMoney(i.spend)}/mo</div>
                  <div className={c.itemSub}>
                    {i.bestCard
                      ? <>Best: <b>{i.bestCard.balance.cardName}</b> at {i.bestRate}</>
                      : 'No cards earn a bonus here'}
                  </div>
                </div>
                {i.bestCard && <span className={c.saveTag}>≈{fmtMoney(i.monthlyReward)}</span>}
              </div>
            ))}
          </div>
          {missed && (
            <div className={c.chipBox}>
              <div className={c.chipLabel}>Your best card in each category, compared with a 1% card</div>
              <div className={c.chips}>
                {missed.byCategory.map((m) => (
                  <span key={m.id} className={c.chip}>{m.emoji} {m.label} +{fmtMoney(m.missed)}/mo</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions + quick tips */}
      {(actions.length > 0 || tips.length > 0) && (
        <>
          <div id="coach-ideas" className={c.sectionHead}>
            <span className={c.sectionTitle}>Ideas for your spending</span>
          </div>
          <div className={c.list}>
            {actions.map((a, i) => (
              <div key={a.id} className={c.item}>
                <div className={`${c.itemIcon} ${tint(i)}`} aria-hidden>{a.icon}</div>
                <div className={c.itemMain}>
                  <div className={c.itemTitle}>{a.title}</div>
                  <div className={c.itemSub}>{a.detail}</div>
                </div>
              </div>
            ))}
            {tips.map((t, i) =>
              t.href === '#coach' && !t.balanceId ? (
                <div key={t.id} className={c.item}>
                  <div className={`${c.itemIcon} ${tint(i + 2)}`} aria-hidden>{t.icon}</div>
                  <div className={`${c.itemMain} ${c.itemSub}`} style={{ color: 'var(--text)' }}>{t.text}</div>
                </div>
              ) : (
                <a
                  key={t.id}
                  className={c.item}
                  href={t.href}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  onClick={
                    t.balanceId
                      ? (e) => { e.preventDefault(); onEdit(t.balanceId) }
                      : undefined
                  }
                >
                  <div className={`${c.itemIcon} ${tint(i + 2)}`} aria-hidden>{t.icon}</div>
                  <div className={`${c.itemMain} ${c.itemSub}`} style={{ color: 'var(--text)' }}>{t.text}</div>
                  <span className={c.itemAction} aria-hidden>›</span>
                </a>
              ),
            )}
          </div>
        </>
      )}

      <Disclaimer />
    </>
  )
}

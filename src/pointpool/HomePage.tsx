import {
  balanceUses,
  catName,
  fmtMoney,
  fmtPts,
  fmtUSD,
  isCash,
  marketplaceCategory,
  PROGRAMS,
  SPEND,
  type Balance,
} from './data'
import { CardCompare, ScoreGoal, type CompareProps } from './CardCompare'
import { Disclaimer, FreshnessTag } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
  compare: CompareProps
}

export function HomePage({ balances, onEdit, compare }: Props) {
  const market = marketplaceCategory(balances)

  return (
    <>
      <div className={styles.pageTitle}>Pointpool</div>

      {/* Leads the page: what the user's (sample) spend in their top categories earns now vs. on cards they could get */}
      <div className={`${styles.card} ${styles.coachHero}`}>
        <h2>Earn more on your spending</h2>
        <CardCompare {...compare} />
        <ScoreGoal balances={compare.balances} category={compare.category} />
        <a className={styles.moreLink} href="#coach">
          See all cards and the math ›
        </a>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Your cards</h2>
          <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
            + Add
          </button>
        </div>
        <div className={styles.mt}>
          {balances.length === 0 && <div className={styles.empty}>Add a card to get started.</div>}
          {balances.map((b) => (
            <CardRow key={b.id} balance={b} onEdit={onEdit} />
          ))}
        </div>
      </div>

      <div className={styles.card} style={{ paddingTop: 4, paddingBottom: 4 }}>
        <a className={styles.row} href="#redeem">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>🎯</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Ways to use your points</div>
            <div className={styles.rowSub}>What they could cover on a trip, everyday buys or as cash</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
        <a className={styles.row} href="#learn">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>📘</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Rewards 101</div>
            <div className={styles.rowSub}>How points and cashback work, in 2 minutes</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
      </div>

      <a className={styles.promo} href="#" onClick={(e) => e.preventDefault()}>
        <div className={styles.rowMain}>
          <div className={styles.promoTitle}>Kikoff Marketplace</div>
          <div className={styles.promoSub}>
            {market
              ? `Cards with bonus rewards on ${catName(market)} — a fit for your ${fmtMoney(SPEND[market])} a month.`
              : 'Explore cards with bonus rewards.'}
          </div>
        </div>
        <span className={styles.chev}>›</span>
      </a>

      <Disclaimer />
    </>
  )
}

// One line per card: the balance, plus where it could go — side by side, no ranking.
function CardRow({ balance: b, onEdit }: { balance: Balance; onEdit: (id?: number) => void }) {
  const p = PROGRAMS[b.programId]
  const uses = balanceUses(b)
  const travel = uses.find((u) => u.id === 'travel')
  const credit = uses.find((u) => u.id === 'cashback')

  let sub: string
  if (uses.length === 0) sub = 'Estimates coming soon'
  else if (!(b.amount > 0)) sub = 'Update this balance to see where it could go'
  else if (isCash(b)) sub = 'Same value as a credit, deposit or at checkout'
  else sub = `Could be ≈${fmtMoney(travel!.value)} in travel or ≈${fmtMoney(credit!.value)} as a statement credit`

  return (
    <div className={styles.row} onClick={() => onEdit(b.id)}>
      <div className={styles.rowIcon}>{p.short}</div>
      <div className={styles.rowMain}>
        <div className={styles.rowTitleLine}>
          <span className={`${styles.rowTitle} ${styles.ellipsis}`}>{b.cardName}</span>
          <span className={styles.rowAmount}>
            {isCash(b) ? fmtUSD(b.amount) : `${fmtPts(b.amount)} ${p.unit === 'points' ? 'pts' : p.unit}`}
          </span>
        </div>
        <div className={styles.rowSub}>{sub}</div>
        <FreshnessTag balance={b} />
      </div>
    </div>
  )
}

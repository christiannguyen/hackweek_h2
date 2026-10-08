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
import { CardArt } from './CardArt'
import { CardCompare, ScoreGoal, type CompareProps } from './CardCompare'
import { Disclaimer, FreshnessTag } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  compare: CompareProps
}

export function HomePage({ balances, compare }: Props) {
  const market = marketplaceCategory(balances)

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Earn more on your spending</h1>
      </div>

      {/* Leads the page: the spending strip, then one example on whichever category is picked. The category is
          shared state, so it carries into the full Compare page. */}
      <div className={`${styles.card} ${styles.coachHero}`}>
        <CardCompare {...compare} />
        <ScoreGoal balances={compare.balances} category={compare.category} />
        <a className={styles.moreLink} href="#compare">Compare more cards ›</a>
      </div>

      {/* The wallet in miniature, on the dark surface the deck uses: the same card faces, one per row.
          The whole tile opens the Wallet tab, so adding and editing happen there rather than twice. */}
      <a className={`${styles.card} ${styles.darkCard} ${styles.walletLink}`} href="#wallet">
        <div className={styles.cardHead}>
          <div>
            <h2>Wallet</h2>
            <span className={styles.walletLinkSub}>Your cards</span>
          </div>
          <span className={styles.chev}>›</span>
        </div>
        <div className={styles.mt}>
          {balances.length === 0 && <div className={styles.empty}>Add a card to get started.</div>}
          {balances.map((b) => (
            <CardRow key={b.id} balance={b} />
          ))}
        </div>
      </a>

      {/* "Ways to use your points" and "Rewards 101" live on the wallet page; Home linked to the same
          two places a tab away. */}

      <a className={styles.promo} href="https://kikoff.com/login" target="_blank" rel="noopener noreferrer">
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


// One line per card: the card's face, its balance, and where it could go — side by side, no ranking.
function CardRow({ balance: b }: { balance: Balance }) {
  const p = PROGRAMS[b.programId]
  const uses = balanceUses(b)
  const travel = uses.find((u) => u.id === 'travel')
  const credit = uses.find((u) => u.id === 'cashback')

  let sub: string
  if (uses.length === 0) sub = 'Estimates coming soon'
  else if (!(b.amount > 0)) sub = 'Add your balance to see where it could go'
  else if (isCash(b)) sub = 'Comes off what you owe; options vary by card'
  else sub = `Could be ≈${fmtMoney(travel!.value)} in travel or ≈${fmtMoney(credit!.value)} as a statement credit`

  return (
    <div className={styles.row}>
      <CardArt balance={b} />
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

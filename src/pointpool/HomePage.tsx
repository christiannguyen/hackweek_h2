import { LuArrowRight, LuFuel, LuShoppingBag, LuSparkles, LuUtensils } from 'react-icons/lu'
import {
  cardStacking,
  catName,
  fmtMoney,
  homeOpportunity,
  SPEND,
  TOP_CATEGORIES,
  type Balance,
} from './data'
import type { CompareProps } from './CardCompare'
import { HomeRewards } from './HomeRewards'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  compare: CompareProps
  onRewards: (id: number) => void
}

export function HomePage({ balances, compare, onRewards }: Props) {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Your everyday, rewarded</h1>
          <p className={styles.pageSub}>A little more from what you already spend.</p>
        </div>
      </div>

      <SpendingSnapshot balances={balances} />
      <HomeInsight balances={balances} onCategory={compare.onCategory} onEdit={compare.onEdit} />
      <HomeRewards balances={balances} onRewards={onRewards} />

      <p className={styles.disclaimer}>
        Sample spending and illustrative rates. Reward balances are entered by you; check the issuer for your current balance and redemption options.
      </p>
    </>
  )
}

const CATEGORY_ICONS = { food: LuUtensils, shopping: LuShoppingBag, transport: LuFuel }

function SpendingSnapshot({ balances }: { balances: Balance[] }) {
  const suggestions = cardStacking(balances)
  return <section className={`${styles.card} ${styles.homeSpending}`} aria-labelledby="home-spending-title">
    <div className={styles.cardHead}>
      <h2 id="home-spending-title">Your spending</h2>
      <span className={styles.homePeriod}>Last 30 days</span>
    </div>
    <p className={styles.homeSpendingSub}>
      {suggestions.length ? 'Top categories · best cards in your wallet' : 'Your top spending categories'}
    </p>
    <ul className={styles.homeSpendList}>
      {TOP_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category.id]
        const suggestion = suggestions.find((s) => s.category.id === category.id)
        return <li key={category.id} className={styles.homeSpendRow}>
          <span className={styles.homeCategoryIcon}><Icon aria-hidden="true" /></span>
          <div className={styles.rowMain}>
            <div className={styles.homeCategoryName}>{category.label}</div>
            {suggestion && <div className={styles.homeCardSuggestion}>Use {suggestion.card.cardName}</div>}
          </div>
          <span className={styles.homeSpendAmount}>{fmtMoney(SPEND[category.id])}</span>
        </li>
      })}
    </ul>
    {suggestions.length > 0 && <a className={styles.homeTextLink} href="#coach">
      See your card strategy <LuArrowRight aria-hidden="true" />
    </a>}
  </section>
}

function HomeInsight({ balances, onCategory, onEdit }: Omit<CompareProps, 'category'>) {
  const opportunity = homeOpportunity(balances)
  const best = opportunity?.best
  const canCompare = !!best
  const hasGain = canCompare && opportunity.top?.worth

  return (
    <section className={`${styles.card} ${styles.homeInsight}`} aria-labelledby="home-insight-title">
      <div className={styles.insightEyebrow}><LuSparkles aria-hidden="true" /> {hasGain ? 'A new-card opportunity' : 'Your next move'}</div>
      {hasGain ? <>
        <h2 id="home-insight-title" className={styles.insightGainTitle}>
          You could earn{' '}
          <span className={styles.insightAmount}>{fmtMoney(opportunity.gain)}<small> more / mo</small></span>
        </h2>
        <p className={styles.insightBody}>
          On {catName(opportunity.category)}, compared with your best card.<br />Estimated after annual fees.
        </p>
      </> : best ? <>
        <h2 id="home-insight-title">Your card is a good fit</h2>
        <p className={styles.insightBody}>
          Your {best.name} already earns well on {catName(opportunity.category)}.
          {' '}{opportunity.top ? 'A new card wouldn’t add much here.' : 'Explore how it compares.'}
        </p>
      </> : <>
        <h2 id="home-insight-title">Find out if you could earn more</h2>
        <p className={styles.insightBody}>
          {balances.length
            ? 'Your cards don’t have reward estimates yet. Add a supported card to compare your options.'
            : 'Add your cards to see whether your everyday spending could earn more rewards.'}
        </p>
      </>}
      {canCompare ? (
        <a className={styles.compareCta} href="#compare" onClick={() => onCategory(opportunity.category)}>
          Compare cards <LuArrowRight aria-hidden="true" />
        </a>
      ) : (
        <button className={styles.compareCta} onClick={() => onEdit()}>
          Add a card <LuArrowRight aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

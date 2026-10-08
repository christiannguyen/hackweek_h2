import type { Balance } from './data'
import { CardCompare, type CompareProps } from './CardCompare'
import { Disclaimer } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
  compare: CompareProps
}

export function HomePage({ balances, compare }: Props) {
  // Names only, never a combined total: each program's rewards stay in that program.
  const names = balances.map((b) => b.cardName)
  const walletLine = names.length === 0 ? 'Add a card to get started' : names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Earn more on your spending</h1>
      </div>

      {/* Your card next to the new card that earns the most, for the picked category. Tap your card to switch cards.
          The category is shared state, so it carries into Compare cards, which has the fee filter and more cards. */}
      <div className={`${styles.card} ${styles.coachHero}`}>
        <CardCompare {...compare} showFeeFilter={false} />
        <a className={styles.moreLink} href="#coach">See the full comparison ›</a>
      </div>

      <a className={`${styles.card} ${styles.walletLink}`} href="#wallet">
        <span className={styles.rowMain}>
          <span className={styles.rowTitle}>Your Wallet</span>
          <span className={styles.rowSub}>{names.length ? `${names.length} card${names.length === 1 ? '' : 's'} · ${walletLine}` : walletLine}</span>
        </span>
        <span className={styles.chev}>›</span>
      </a>

      <Disclaimer />
    </>
  )
}

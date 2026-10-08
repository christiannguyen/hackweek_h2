import { LuFuel, LuShoppingBag, LuUtensils } from 'react-icons/lu'
import { feeFilters, fmtMoney, isStale, SPEND, TOP_CATEGORIES, type Balance, type CategoryId, type FeeFilter } from './data'
import styles from './pointpool.module.css'

// Only shown when a balance is due for an update — fresh balances stay quiet.
export function FreshnessTag({ balance }: { balance: Balance }) {
  if (!isStale(balance)) return null
  return <span className={`${styles.tag} ${styles.sm} ${styles.warn}`}>Update balance</span>
}

// Goes back to wherever the user came from (Home or Wallet both link to Learn); Home when there's nowhere to go back to.
export function BackLink() {
  return (
    <a
      className={styles.back}
      href="#home"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault()
          window.history.back()
        }
      }}
    >
      ‹ Back
    </a>
  )
}

// The controls both comparison views open on: every category with its last-30-days spend, then the annual-fee
// filter for the new cards being suggested. Home and Card Coach share the component so the two stay in step —
// the category carries between the pages, and the strip reads the same on both.
const categoryIcons = { food: LuUtensils, shopping: LuShoppingBag, transport: LuFuel }

interface SpendingControlsProps {
  category: CategoryId
  onCategory: (c: CategoryId) => void
  // Leave both out to show just the category tabs (Home keeps the fee filter on Compare cards).
  feeFilter?: FeeFilter
  onFeeFilter?: (f: FeeFilter) => void
}

export function SpendingControls({ category, onCategory, feeFilter, onFeeFilter }: SpendingControlsProps) {
  return (
    <>
      <h2>Your monthly spending</h2>
      <div className={styles.catTabs} role="group" aria-label="Spending category">
        {TOP_CATEGORIES.map((c) => {
          const Icon = categoryIcons[c.id]
          return (
            <button
              key={c.id}
              className={`${styles.catTab} ${c.id === category ? styles.active : ''}`}
              aria-pressed={c.id === category}
              onClick={() => onCategory(c.id)}
            >
              <Icon className={styles.categoryIcon} aria-hidden="true" />
              <span className={styles.catLabel}>{c.label}</span>
              <span className={styles.catSpend}>{fmtMoney(SPEND[c.id])}<small>/mo</small></span>
            </button>
          )
        })}
      </div>
      {feeFilter && onFeeFilter && <div className={styles.feeFilters} role="group" aria-label="New card annual fee">
        {feeFilters.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.feeFilter} ${feeFilter === value ? styles.active : ''}`}
            aria-pressed={feeFilter === value}
            onClick={() => onFeeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>}
    </>
  )
}

export function Disclaimer() {
  return (
    <div className={styles.disclaimer}>
      Estimates only, based on sample spending and illustrative rates. Each program’s points are used within that
      program.
    </div>
  )
}

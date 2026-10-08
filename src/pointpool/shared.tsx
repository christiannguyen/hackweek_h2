import { isStale, type Balance } from './data'
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

export function Disclaimer() {
  return (
    <div className={styles.disclaimer}>
      Estimates only, based on sample spending and illustrative rates. Each program’s points are used within that
      program.
    </div>
  )
}

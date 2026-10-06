import { ageDays, STALE_DAYS, type Balance } from './data'
import styles from './pointpool.module.css'

export function FreshnessTag({ balance }: { balance: Balance }) {
  const d = ageDays(balance.updatedAt)
  if (d > STALE_DAYS) return <span className={`${styles.tag} ${styles.sm} ${styles.warn}`}>Ready to refresh</span>
  return <span className={`${styles.tag} ${styles.sm}`}>{d === 0 ? 'Updated today' : `Updated ${d}d ago`}</span>
}

export function BackLink() {
  return (
    <a className={styles.back} href="#home">
      ‹ Pointpool
    </a>
  )
}

export function Disclaimer() {
  return <div className={styles.disclaimer}>ⓘ ESTIMATES ONLY — SAMPLE SPENDING, ILLUSTRATIVE RATES. EACH PROGRAM'S POINTS ARE USED WITHIN THAT PROGRAM.</div>
}

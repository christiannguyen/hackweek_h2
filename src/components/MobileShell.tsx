import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuCreditCard, LuGauge, LuGift, LuHouse, LuShieldCheck, LuStar, LuUser, LuWallet } from 'react-icons/lu'
import styles from './MobileShell.module.css'

// Mirrors the Kikoff app tab bar. Only Pointpool is wired up; the rest are placeholders.
const TABS: { label: string; icon: IconType; href?: string }[] = [
  { label: 'Home', icon: LuHouse },
  { label: 'Debt', icon: LuWallet },
  { label: 'Credit', icon: LuGauge },
  { label: 'Pointpool', icon: LuStar, href: '#home' },
  { label: 'Disputes', icon: LuShieldCheck },
  { label: 'Offers', icon: LuCreditCard },
]

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.phone}>
        <header className={styles.topbar}>
          <div className={styles.avatar}>
            <LuUser />
          </div>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillGreen}`}>
              <LuGift style={{ display: 'inline', verticalAlign: '-2px' }} /> Get $30
            </span>
            <span className={`${styles.pill} ${styles.pillBlue}`}>★ Ultimate perks</span>
          </div>
        </header>

        {children}

        <nav className={styles.tabbar}>
          {TABS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href ?? '#home'}
              onClick={href ? undefined : (e) => e.preventDefault()}
              className={`${styles.tab} ${href ? styles.active : ''}`}
            >
              <Icon />
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

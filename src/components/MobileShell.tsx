import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuCircleUserRound, LuCreditCard, LuGraduationCap, LuChartNoAxesColumnIncreasing, LuHouse, LuWallet } from 'react-icons/lu'
import styles from './MobileShell.module.css'

const TABS: { label: string; icon: IconType; hash: string }[] = [
  { label: 'Home', icon: LuHouse, hash: '#home' },
  { label: 'Compare', icon: LuChartNoAxesColumnIncreasing, hash: '#compare' },
  { label: 'Card Coach', icon: LuGraduationCap, hash: '#coach' },
  { label: 'Wallet', icon: LuWallet, hash: '#wallet' },
  { label: 'Offers', icon: LuCreditCard, hash: '#offers' },
]

// Both old names for the wallet, so a "#redeem" or "#pointpool" link still lights up its tab.
const TAB_ALIAS: Record<string, string> = { '#pointpool': '#wallet', '#redeem': '#wallet' }

export function MobileShell({ children, onAccount }: { children: ReactNode; onAccount: () => void }) {
  const [hash, setHash] = useState(window.location.hash || '#home')
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [baseHash, card] = hash.split('/')
  // "#coach/<card>" is a Compare deep link, so it lights up Compare rather than Card Coach.
  const routeHash = baseHash === '#coach' && card ? '#compare' : (TAB_ALIAS[baseHash] ?? baseHash)
  // Pages that aren't tabs light up the tab they're opened from (Rewards 101 lives under Wallet).
  const PARENT: Record<string, string> = { '#learn': '#wallet' }
  const activeHash = PARENT[routeHash] ?? routeHash
  const isTab = TABS.some((t) => t.hash === activeHash)

  return (
    <div className={styles.backdrop}>
      <div className={styles.phone}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="#home" aria-label="Pointpool home">
            <img src="/favicon.svg" alt="" width="38" height="38" />
            <span>pointpool</span>
          </a>
          <button type="button" className={styles.account} onClick={onAccount} aria-label="Account">
            <LuCircleUserRound />
          </button>
        </header>

        {children}

        <nav className={styles.tabbar}>
          {TABS.map(({ label, icon: Icon, hash: h }) => (
            <a
              key={label}
              href={h}
              className={`${styles.tab} ${(isTab ? activeHash === h : h === '#home') ? styles.active : ''}`}
              aria-current={routeHash === h ? 'page' : undefined}
            >
              <Icon aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuCircleUserRound, LuCreditCard, LuGift, LuGraduationCap, LuHouse, LuWallet } from 'react-icons/lu'
import styles from './MobileShell.module.css'

const TABS: { label: string; icon: IconType; hash: string }[] = [
  { label: 'Home', icon: LuHouse, hash: '#home' },
  { label: 'Card Coach', icon: LuGraduationCap, hash: '#coach' },
  { label: 'Use rewards', icon: LuGift, hash: '#redeem' },
  { label: 'Wallet', icon: LuWallet, hash: '#wallet' },
  { label: 'Offers', icon: LuCreditCard, hash: '#offers' },
]

export function MobileShell({ children, onAccount }: { children: ReactNode; onAccount: () => void }) {
  const [hash, setHash] = useState(window.location.hash || '#home')
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const routeHash = hash.split('/')[0] === '#pointpool' ? '#wallet' : hash.split('/')[0]
  const isTab = TABS.some((t) => t.hash === routeHash)

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
              className={`${styles.tab} ${(isTab ? routeHash === h : h === '#home') ? styles.active : ''}`}
              aria-current={routeHash === h ? 'page' : undefined}
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

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuCreditCard, LuGraduationCap, LuHouse, LuStar, LuWallet } from 'react-icons/lu'
import styles from './MobileShell.module.css'

const TABS: { label: string; icon: IconType; hash: string }[] = [
  { label: 'Home', icon: LuHouse, hash: '#home' },
  { label: 'Card Coach', icon: LuGraduationCap, hash: '#coach' },
  { label: 'Pointpool', icon: LuWallet, hash: '#pointpool' },
  { label: 'Offers', icon: LuCreditCard, hash: '#offers' },
]

export function MobileShell({ children }: { children: ReactNode }) {
  const [hash, setHash] = useState(window.location.hash || '#home')
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const isTab = TABS.some((t) => t.hash === hash)

  return (
    <div className={styles.backdrop}>
      <div className={styles.phone}>
        <header className={styles.topbar}>
          <div className={styles.avatar}>
            <LuStar />
          </div>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillBlue}`}>★ Pointpool</span>
          </div>
        </header>

        {children}

        <nav className={styles.tabbar}>
          {TABS.map(({ label, icon: Icon, hash: h }) => (
            <a
              key={label}
              href={h}
              className={`${styles.tab} ${(isTab ? hash === h : h === '#home') ? styles.active : ''}`}
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

import { useState } from 'react'
import { MobileShell } from '@/components/MobileShell'
import { PointPoolDemo } from '@/demo/PointPoolDemo'
import { AccountSheet } from '@/pointpool/AccountSheet'
import { BalanceSheet } from '@/pointpool/BalanceSheet'
import { CoachPage } from '@/pointpool/CoachPage'
import type { CompareProps } from '@/pointpool/CardCompare'
import { TOP_CATEGORY, type CategoryId } from '@/pointpool/data'
import { HomePage } from '@/pointpool/HomePage'
import { LearnPage } from '@/pointpool/LearnPage'
import { Onboarding } from '@/pointpool/Onboarding'
import { OffersPage } from '@/pointpool/OffersPage'
import { PointpoolPage } from '@/pointpool/PointpoolPage'
import { RedeemPage } from '@/pointpool/RedeemPage'
import { isOnboarded, markLoggedOut, useBalances } from '@/pointpool/useBalances'
import { useHashRoute } from '@/pointpool/useHashRoute'
import styles from '@/pointpool/pointpool.module.css'

function App() {
  const route = useHashRoute()
  const { balances, upsert, remove, replaceAll } = useBalances()
  // First visit (or "#welcome" to replay it) shows the simulated sign-up and card setup.
  const [onboarding, setOnboarding] = useState(() => !isOnboarded() || window.location.hash === '#welcome')
  // A first run swaps the sample wallet for the user's picks; a replay adds new picks to the cards already saved.
  // Read each render: finishing marks onboarding done, so a later replay in the same visit counts as a replay.
  const firstRun = !isOnboarded()
  // Shared so the category picked on the home hero carries into the full Coach page. Starts on the user's
  // highest-spend category.
  const [category, setCategory] = useState<CategoryId>(TOP_CATEGORY)
  const [accountOpen, setAccountOpen] = useState(0) // 0 = closed; a new number remounts the sheet fresh
  const [sheet, setSheet] = useState<{ open: boolean; id?: number; key: number; purpose?: 'rewards' }>({ open: false, key: 0 })

  const openSheet = (id?: number) => setSheet((s) => ({ open: true, id, key: s.key + 1 }))
  const openRewardsSheet = (id?: number) => setSheet((s) => ({ open: true, id, key: s.key + 1, purpose: 'rewards' }))
  const compare: CompareProps = {
    balances,
    category,
    onCategory: setCategory,
    onEdit: openSheet,
  }

  // The scripted presentation demo stands on its own: no sign-up, no tab bar.
  if (route === 'demo') return <PointPoolDemo />

  if (onboarding || route === 'welcome') {
    return (
      <Onboarding
        onFinish={(cards) => {
          if (firstRun) replaceAll(cards)
          else
            for (const c of cards)
              if (!balances.some((b) => b.cardName.trim().toLowerCase() === c.cardName.trim().toLowerCase())) upsert(c)
          setOnboarding(false)
          window.location.hash = '#home'
        }}
        onLogin={() => {
          setOnboarding(false)
          window.location.hash = '#home'
        }}
      />
    )
  }

  return (
    <MobileShell onAccount={() => setAccountOpen(Date.now())}>
      <main className={`${styles.root} ${styles.view}`}>
        {route === 'home' && <HomePage balances={balances} onEdit={openSheet} compare={compare} />}
        {route === 'coach' && <CoachPage balances={balances} onEdit={openSheet} compare={compare} />}
        {route === 'pointpool' && <PointpoolPage balances={balances} onEdit={openSheet} />}
        {route === 'offers' && <OffersPage balances={balances} onEdit={openSheet} />}
        {route === 'redeem' && <RedeemPage balances={balances} onEdit={openRewardsSheet} />}
        {route === 'learn' && <LearnPage />}
      </main>
      <AccountSheet
        key={`account-${accountOpen}`}
        open={accountOpen > 0}
        onClose={() => setAccountOpen(0)}
        onLogout={(removeCards) => {
          markLoggedOut()
          if (removeCards) replaceAll([])
          setAccountOpen(0)
          setOnboarding(true)
          window.location.hash = '#welcome'
        }}
      />
      <BalanceSheet
        key={`balance-${sheet.key}`}
        open={sheet.open}
        purpose={sheet.purpose}
        balance={balances.find((b) => b.id === sheet.id)}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onSave={upsert}
        onRemove={remove}
      />
    </MobileShell>
  )
}

export default App

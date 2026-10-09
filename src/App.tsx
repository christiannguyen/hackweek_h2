import { useState } from 'react'
import { MobileShell } from '@/components/MobileShell'
import { PointPoolDemo } from '@/demo/PointPoolDemo'
import { BalanceSheet } from '@/pointpool/BalanceSheet'
import { CoachPage } from '@/pointpool/CoachPage'
import { ComparePage } from '@/pointpool/ComparePage'
import type { CompareProps } from '@/pointpool/CardCompare'
import { TOP_CATEGORY, type CategoryId } from '@/pointpool/data'
import { HomePage } from '@/pointpool/HomePage'
import { LearnPage } from '@/pointpool/LearnPage'
import { OffersPage } from '@/pointpool/OffersPage'
import { PointpoolPage } from '@/pointpool/PointpoolPage'
import { useBalances } from '@/pointpool/useBalances'
import { useHashRoute } from '@/pointpool/useHashRoute'
import styles from '@/pointpool/pointpool.module.css'

function App() {
  const route = useHashRoute()
  const { balances, upsert, remove } = useBalances()
  // Home sets this to its featured opportunity when opening Compare; direct visits start on highest spend.
  const [category, setCategory] = useState<CategoryId>(TOP_CATEGORY)
  const [sheet, setSheet] = useState<{ open: boolean; id?: number; key: number; purpose?: 'rewards' }>({ open: false, key: 0 })

  const openSheet = (id?: number) => setSheet((s) => ({ open: true, id, key: s.key + 1 }))
  const openRewardsSheet = (id?: number) => setSheet((s) => ({ open: true, id, key: s.key + 1, purpose: 'rewards' }))
  const compare: CompareProps = {
    balances,
    category,
    onCategory: setCategory,
    onEdit: openSheet,
  }

  // The scripted presentation demo stands on its own: no tab bar.
  if (route === 'demo') return <PointPoolDemo />

  return (
    <MobileShell>
      <main className={`${styles.root} ${styles.view}`}>
        {route === 'home' && <HomePage balances={balances} compare={compare} onRewards={openRewardsSheet} />}
        {route === 'compare' && <ComparePage balances={balances} onEdit={openSheet} compare={compare} />}
        {route === 'coach' && <CoachPage balances={balances} onEdit={openSheet} />}
        {route === 'pointpool' && <PointpoolPage balances={balances} onEdit={openSheet} onRewards={openRewardsSheet} />}
        {route === 'offers' && <OffersPage balances={balances} onEdit={openSheet} />}
        {route === 'learn' && <LearnPage />}
      </main>
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

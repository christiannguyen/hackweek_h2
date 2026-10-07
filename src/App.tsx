import { useState } from 'react'
import { MobileShell } from '@/components/MobileShell'
import { BalanceSheet } from '@/pointpool/BalanceSheet'
import { CoachPage } from '@/pointpool/CoachPage'
import type { CompareProps } from '@/pointpool/CardCompare'
import { TOP_CATEGORY, type CategoryId } from '@/pointpool/data'
import { HomePage } from '@/pointpool/HomePage'
import { LearnPage } from '@/pointpool/LearnPage'
import { OffersPage } from '@/pointpool/OffersPage'
import { PointpoolPage } from '@/pointpool/PointpoolPage'
import { RedeemPage } from '@/pointpool/RedeemPage'
import { useBalances } from '@/pointpool/useBalances'
import { useHashRoute } from '@/pointpool/useHashRoute'
import styles from '@/pointpool/pointpool.module.css'

function App() {
  const route = useHashRoute()
  const { balances, upsert, remove } = useBalances()
  // Shared so the category picked on the home hero carries into the full Coach page. Starts on the user's
  // highest-spend category.
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

  return (
    <MobileShell>
      <main className={`${styles.root} ${styles.view}`}>
        {route === 'home' && <HomePage balances={balances} onEdit={openSheet} compare={compare} />}
        {route === 'coach' && <CoachPage balances={balances} onEdit={openSheet} compare={compare} />}
        {route === 'pointpool' && <PointpoolPage balances={balances} onEdit={openSheet} />}
        {route === 'offers' && <OffersPage balances={balances} onEdit={openSheet} />}
        {route === 'redeem' && <RedeemPage balances={balances} onEdit={openRewardsSheet} />}
        {route === 'learn' && <LearnPage />}
      </main>
      <BalanceSheet
        key={sheet.key}
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

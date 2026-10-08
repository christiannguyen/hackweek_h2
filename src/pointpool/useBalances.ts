import { useEffect, useState } from 'react'
import { SEED, type Balance } from './data'

// Balances live only in this browser's localStorage — nothing is sent anywhere.
const STORE_KEY = 'pointpool.balances.v4'
const ONBOARDED_KEY = 'pointpool.onboarded.v1'

export const isOnboarded = () => localStorage.getItem(ONBOARDED_KEY) === '1'

// Whether the saved cards are the user's own rather than the sample wallet. Set when they finish onboarding or
// change a card. Logging out keeps it, so signing up again adds to their cards instead of replacing them.
const OWN_KEY = 'pointpool.ownWallet.v1'
export const hasOwnWallet = () => localStorage.getItem(OWN_KEY) === '1'
const markOwnWallet = () => localStorage.setItem(OWN_KEY, '1')
// Anyone who onboarded before this flag existed already has their own cards saved.
if (isOnboarded()) markOwnWallet()
export const markOnboarded = () => localStorage.setItem(ONBOARDED_KEY, '1')
// Logging out (simulated) sends the user back to Welcome; cards are only cleared if they ask.
export const markLoggedOut = () => localStorage.removeItem(ONBOARDED_KEY)

// Where the user said they'd like rewards to go in onboarding (GOAL_OPTIONS ids), so Use rewards can open there.
const GOALS_KEY = 'pointpool.goals.v1'
export const saveGoals = (goals: string[]) => localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
export const savedGoals = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useBalances() {
  const [balances, setBalances] = useState<Balance[]>(() => {
    const saved = localStorage.getItem(STORE_KEY)
    return saved ? (JSON.parse(saved) as Balance[]) : SEED
  })

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(balances))
  }, [balances])

  const upsert = (entry: Omit<Balance, 'id' | 'updatedAt'>, id?: number) => {
    markOwnWallet()
    const updatedAt = new Date().toISOString()
    setBalances((prev) =>
      id
        ? prev.map((b) => (b.id === id ? { ...b, ...entry, updatedAt } : b))
        : [...prev, { id: Math.max(Date.now(), ...prev.map((b) => b.id + 1)), ...entry, updatedAt }],
    )
  }

  const remove = (id: number) => {
    markOwnWallet()
    setBalances((prev) => prev.filter((b) => b.id !== id))
  }

  // Onboarding swaps the sample wallet for the cards the user picked.
  const replaceAll = (entries: Omit<Balance, 'id' | 'updatedAt'>[]) => {
    markOwnWallet()
    const updatedAt = new Date().toISOString()
    setBalances(entries.map((e, i) => ({ id: Date.now() + i, ...e, updatedAt })))
  }

  return { balances, upsert, remove, replaceAll }
}

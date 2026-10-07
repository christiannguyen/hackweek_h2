import { useEffect, useState } from 'react'
import { SEED, type Balance } from './data'

// Balances live only in this browser's localStorage — nothing is sent anywhere.
const STORE_KEY = 'pointpool.balances.v4'
const ONBOARDED_KEY = 'pointpool.onboarded.v1'

export const isOnboarded = () => localStorage.getItem(ONBOARDED_KEY) === '1'
export const markOnboarded = () => localStorage.setItem(ONBOARDED_KEY, '1')

export function useBalances() {
  const [balances, setBalances] = useState<Balance[]>(() => {
    const saved = localStorage.getItem(STORE_KEY)
    return saved ? (JSON.parse(saved) as Balance[]) : SEED
  })

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(balances))
  }, [balances])

  const upsert = (entry: Omit<Balance, 'id' | 'updatedAt'>, id?: number) => {
    const updatedAt = new Date().toISOString()
    setBalances((prev) =>
      id
        ? prev.map((b) => (b.id === id ? { ...b, ...entry, updatedAt } : b))
        : [...prev, { id: Date.now(), ...entry, updatedAt }],
    )
  }

  const remove = (id: number) => setBalances((prev) => prev.filter((b) => b.id !== id))

  // Onboarding swaps the sample wallet for the cards the user picked.
  const replaceAll = (entries: Omit<Balance, 'id' | 'updatedAt'>[]) => {
    const updatedAt = new Date().toISOString()
    setBalances(entries.map((e, i) => ({ id: Date.now() + i, ...e, updatedAt })))
  }

  return { balances, upsert, remove, replaceAll }
}

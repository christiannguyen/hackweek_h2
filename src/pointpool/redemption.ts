import { PROGRAMS, hasEstimates, type Balance, type GoalId } from './data'

// Illustrative purchase prices, not live fares, hotel availability, or award quotes.
export const REDEMPTION_EXAMPLES = [
  { id: 'credit', title: 'Pay down your card', subtitle: 'Lowers the amount you owe', price: 100, goal: 'cashback', emoji: '💸' },
  { id: 'gift', title: 'A gift card', subtitle: 'Help with everyday essentials', price: 50, goal: 'everyday', emoji: '🎁' },
  { id: 'flight', title: 'A flight', subtitle: 'A little closer to takeoff', price: 300, goal: 'travel', emoji: '✈️' },
  { id: 'hotel', title: 'A hotel night', subtitle: 'Make room for a getaway', price: 180, goal: 'travel', emoji: '🏨' },
] as const satisfies readonly { id: string; title: string; subtitle: string; price: number; goal: GoalId; emoji: string }[]

export type RedemptionId = typeof REDEMPTION_EXAMPLES[number]['id']

// Every balance gets all four of them. Cashback can't be redeemed straight into a flight the way points
// can, but it is money: taken as a credit or deposit it covers any of these at face value, so showing a
// cashback card only "pay down your card" undersold it.

export function redemptionEstimate(balance: Balance, goal: GoalId, price: number) {
  const program = PROGRAMS[balance.programId]
  if (!hasEstimates(program) || !Number.isFinite(price) || price <= 0 || !Number.isFinite(balance.amount) || balance.amount < 0) return null
  // Cashback is worth its face value whatever you put it toward, so every goal is 100¢ on the dollar.
  const cash = program.type === 'cashback'
  const cpp = cash ? 100 : program.cpp?.[goal]
  if (!cpp || cpp <= 0) return null
  const cents = (n: number) => Math.round(n * 100) / 100
  const value = cents(balance.amount * cpp / 100)
  const covered = Math.min(value, price)
  return {
    value, covered, remaining: cents(price - covered),
    percent: Math.min(100, covered / price * 100),
    needed: cash ? price : Math.ceil(price * 100 / cpp),
    cpp,
  }
}

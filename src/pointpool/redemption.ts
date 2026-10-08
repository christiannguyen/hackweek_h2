import { PROGRAMS, hasEstimates, type Balance, type GoalId } from './data'

// Illustrative purchase prices, not live fares, hotel availability, or award quotes.
export const REDEMPTION_EXAMPLES = [
  { id: 'credit', title: 'Pay down your card', subtitle: 'Lowers the amount you owe', price: 100, goal: 'cashback', emoji: '💸' },
  { id: 'gift', title: 'A gift card', subtitle: 'Help with everyday essentials', price: 50, goal: 'everyday', emoji: '🎁' },
  { id: 'flight', title: 'A flight', subtitle: 'A little closer to takeoff', price: 300, goal: 'travel', emoji: '✈️' },
  { id: 'hotel', title: 'A hotel night', subtitle: 'Make room for a getaway', price: 180, goal: 'travel', emoji: '🏨' },
] as const satisfies readonly { id: string; title: string; subtitle: string; price: number; goal: GoalId; emoji: string }[]

export type RedemptionId = typeof REDEMPTION_EXAMPLES[number]['id']

// Cash balances get a money-back preview; additional redemption methods require card-specific eligibility.
export function redemptionExamples(balance: Balance) {
  return PROGRAMS[balance.programId].type === 'cashback'
    ? REDEMPTION_EXAMPLES.filter((example) => example.id === 'credit')
    : REDEMPTION_EXAMPLES
}

export function redemptionEstimate(balance: Balance, goal: GoalId, price: number) {
  const program = PROGRAMS[balance.programId]
  if (!hasEstimates(program) || !Number.isFinite(price) || price <= 0 || !Number.isFinite(balance.amount) || balance.amount < 0) return null
  const cash = program.type === 'cashback'
  if (cash && goal !== 'cashback') return null
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

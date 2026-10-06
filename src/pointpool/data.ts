// Point values and earn rates below are ILLUSTRATIVE placeholders, not confirmed program valuations.
import transactions from './transactions.json'

export type GoalId = 'travel' | 'everyday' | 'cashback'
export type ProgramId = 'amex_mr' | 'chase_ur' | 'citi_typ' | 'capone' | 'discover' | 'other'

export interface Program {
  name: string
  short: string
  brand: string // how the program reads in copy, e.g. "Chase" in "50,000 Chase points"
  unit: string
  type: 'points' | 'cashback'
  supported: boolean
  cpp?: Record<GoalId, number>
}

export interface Balance {
  id: number
  programId: ProgramId
  cardName: string
  amount: number
  updatedAt: string
}

export const PROGRAMS: Record<ProgramId, Program> = {
  amex_mr: { name: 'Amex Membership Rewards', short: 'AX', brand: 'Amex', unit: 'points', type: 'points', supported: true, cpp: { travel: 1.0, everyday: 0.6, cashback: 0.6 } },
  chase_ur: { name: 'Chase Ultimate Rewards', short: 'CH', brand: 'Chase', unit: 'points', type: 'points', supported: true, cpp: { travel: 1.25, everyday: 1.0, cashback: 1.0 } },
  citi_typ: { name: 'Citi ThankYou Points', short: 'CI', brand: 'Citi', unit: 'points', type: 'points', supported: true, cpp: { travel: 1.0, everyday: 1.0, cashback: 1.0 } },
  capone: { name: 'Capital One Miles', short: 'C1', brand: 'Capital One', unit: 'miles', type: 'points', supported: true, cpp: { travel: 1.0, everyday: 0.5, cashback: 0.5 } },
  discover: { name: 'Discover Cashback Bonus', short: '$', brand: 'Discover', unit: 'cashback', type: 'cashback', supported: true },
  other: { name: 'Other program', short: '?', brand: 'program', unit: 'points', type: 'points', supported: false },
}

const GOAL_IDS: GoalId[] = ['travel', 'everyday', 'cashback']

export const GOALS: Record<GoalId, { label: string; points: string[]; cashback: string[] }> = {
  travel: {
    label: '✈️ Flight',
    points: ["Sign in to your card's rewards portal", 'Search flights in the travel section', 'Choose "pay with points" at checkout'],
    cashback: ['Book the flight with any card', 'Redeem cashback as a statement credit to offset it'],
  },
  everyday: {
    label: '🛒 Everyday',
    points: ["Open your card's rewards page", 'Pick gift cards or "shop with points" (e.g. Amazon)', 'Apply points at checkout'],
    cashback: ['Use cashback at checkout with supported merchants (e.g. Amazon, PayPal)'],
  },
  cashback: {
    label: '💵 Cash',
    points: ["Open your card's rewards page", 'Choose "statement credit" or "deposit to bank"', 'Enter the amount to redeem'],
    cashback: ['Choose statement credit or direct deposit', 'Funds usually post in 1–3 business days'],
  },
}

export const STALE_DAYS = 30

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString()

export const SEED: Balance[] = [
  { id: 1, programId: 'chase_ur', cardName: 'Sapphire Preferred', amount: 50000, updatedAt: daysAgo(12) },
  { id: 2, programId: 'discover', cardName: 'Discover it', amount: 42.18, updatedAt: daysAgo(1) },
]

const cents = (n: number) => Math.round(n * 100) / 100

export const fmtPts = (n: number) => Math.round(n).toLocaleString()
export const fmtUSD = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
// Compact money: whole dollars at $100+ ("$625"), otherwise cents ("$5.00", "$10.50").
export const fmtMoney = (n: number) => {
  const c = cents(n)
  const digits = c >= 100 ? 0 : 2
  return c.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })
}
export const ageDays = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
export const isCash = (b: Balance) => PROGRAMS[b.programId].type === 'cashback'
export const isStale = (b: Balance) => ageDays(b.updatedAt) > STALE_DAYS
// A program has estimates when it's supported and has a value per point (cashback is always $1 = $1).
export const hasEstimates = (p: Program) => p.supported && (p.type === 'cashback' || !!p.cpp)
// "50,000 Chase points" / "$42.18 cashback" / "10,000 points" (unsupported program, no brand)
export const fmtBalance = (b: Balance) => {
  const p = PROGRAMS[b.programId]
  return p.type === 'cashback' ? `${fmtUSD(b.amount)} cashback` : `${fmtPts(b.amount)} ${p.supported ? `${p.brand} ` : ''}${p.unit}`
}

// ---- Spending ----

export type CategoryId = 'dining' | 'groceries' | 'gas' | 'travel' | 'online' | 'other'
export type Spend = Record<CategoryId, number>

// label = chip text; noun = how the category reads in running copy ("on online shopping").
export const CATEGORIES: { id: CategoryId; label: string; noun: string; emoji: string }[] = [
  { id: 'dining', label: 'Dining', noun: 'dining', emoji: '🍽️' },
  { id: 'groceries', label: 'Groceries', noun: 'groceries', emoji: '🛒' },
  { id: 'gas', label: 'Gas', noun: 'gas', emoji: '⛽' },
  { id: 'travel', label: 'Travel', noun: 'travel', emoji: '✈️' },
  { id: 'online', label: 'Online', noun: 'online shopping', emoji: '📦' },
  { id: 'other', label: 'Everything else', noun: 'everything else', emoji: '💳' },
]

export const catName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.noun ?? id

export interface Transaction {
  id: string
  date: string // yyyy-mm-dd
  merchant: string
  amount: number
  category: CategoryId
}

// SAMPLE data: made-up transactions with fake merchants, standing in for the spend data Kikoff already has.
export const TRANSACTIONS = transactions as Transaction[]

const monthsIn = (txns: Transaction[]) => [...new Set(txns.map((t) => t.date.slice(0, 7)))].sort()

// Average monthly spend per category: total per category ÷ number of distinct months, rounded to cents.
export function monthlySpend(txns: Transaction[]): Spend {
  const months = monthsIn(txns).length || 1
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Spend
  for (const t of txns) if (t.category in totals) totals[t.category] += t.amount
  for (const c of CATEGORIES) totals[c.id] = cents(totals[c.id] / months)
  return totals
}

export const SPEND = monthlySpend(TRANSACTIONS)

export const categoriesBySpend = (spend: Spend = SPEND) => [...CATEGORIES].sort((a, b) => spend[b.id] - spend[a.id])

export const TOP_CATEGORY: CategoryId = categoriesBySpend(SPEND)[0].id

const monthName = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString(undefined, { month: 'short' })
const sampleMonths = monthsIn(TRANSACTIONS)
// e.g. "Jul–Sep"
export const SAMPLE_PERIOD =
  sampleMonths.length > 1
    ? `${monthName(sampleMonths[0])}–${monthName(sampleMonths[sampleMonths.length - 1])}`
    : sampleMonths.map(monthName).join('')

// ---- Card Coach ----
// Earn rates are ILLUSTRATIVE for the demo — real rates, caps and categories change; the issuer has the latest.

interface CardRule {
  rates: Partial<Record<CategoryId, number>>
  notes?: Partial<Record<CategoryId, string>>
}

export const CARD_RULES: Record<string, CardRule> = {
  'Amex Gold': {
    rates: { dining: 4, groceries: 4, travel: 3 },
    notes: { groceries: 'At US supermarkets, up to a yearly cap', travel: 'Flights booked direct or through Amex Travel' },
  },
  'Sapphire Preferred': {
    rates: { dining: 3, online: 3, travel: 2 },
    notes: { online: 'Online grocery orders count here' },
  },
  'Citi Premier': { rates: { dining: 3, groceries: 3, gas: 3, travel: 3 } },
  'Discover it': {
    rates: { gas: 5, online: 5 },
    notes: {
      gas: 'Rotating 5% category — earns 5% in quarters when it is featured, once activated; a quarterly cap applies',
      online: 'Rotating 5% category — earns 5% in quarters when it is featured, once activated; a quarterly cap applies',
    },
  },
}

export interface CardEarning {
  balance: Balance
  program: Program
  rate: number
  known: boolean // false = card not in the sample rules, estimated at the base 1× / 1%
  note?: string
  monthly: number // points a month, or dollars a month for cashback cards
  yearly: number
  value: Record<GoalId, number> // estimated $ a month for each way to use it
}

export const earnRateLabel = (e: Pick<CardEarning, 'program' | 'rate'>) => (e.program.type === 'cashback' ? `${e.rate}%` : `${e.rate}×`)

// What a month of spending in one category could earn on each card. Wallet order, no sorting.
export function cardEarnings(balances: Balance[], cat: CategoryId, spend: Spend = SPEND): CardEarning[] {
  const amount = spend[cat] ?? 0
  const out: CardEarning[] = []
  for (const balance of balances) {
    const program = PROGRAMS[balance.programId]
    if (!hasEstimates(program)) continue
    const rule = CARD_RULES[balance.cardName]
    const rate = rule?.rates[cat] ?? 1
    const cash = program.type === 'cashback'
    const monthly = cash ? cents((amount * rate) / 100) : Math.round(amount * rate)
    const yearly = cash ? cents((amount * rate * 12) / 100) : Math.round(amount * rate * 12)
    const value = Object.fromEntries(
      GOAL_IDS.map((g) => [g, cash ? monthly : cents((monthly * (program.cpp?.[g] ?? 0)) / 100)]),
    ) as Record<GoalId, number>
    out.push({ balance, program, rate, known: !!rule, note: rule?.notes?.[cat], monthly, yearly, value })
  }
  return out
}

export interface BalanceUse {
  id: GoalId | 'deposit' | 'checkout' // 'cashback' = statement credit, for points and cashback alike
  emoji: string
  label: string
  detail: string
  value: number
}

const POINT_USES: Omit<BalanceUse, 'value'>[] = [
  { id: 'travel', emoji: '✈️', label: 'toward travel', detail: 'Flights or hotels booked through the card’s travel site' },
  { id: 'everyday', emoji: '🛒', label: 'in gift cards', detail: 'Gift cards, or shop with points at stores like Amazon' },
  { id: 'cashback', emoji: '💵', label: 'as a statement credit', detail: 'Credit on your card bill, or a deposit to your bank' },
]

const CASH_USES: Omit<BalanceUse, 'value'>[] = [
  { id: 'cashback', emoji: '💵', label: 'as a statement credit', detail: 'Credit on your card bill' },
  { id: 'deposit', emoji: '🏦', label: 'as a bank deposit', detail: 'Sent to your bank, usually in 1–3 business days' },
  { id: 'checkout', emoji: '🛍️', label: 'at checkout', detail: 'Pay with cashback at Amazon or PayPal' },
]

// Where a balance could go, with an estimated $ value for each use. Empty for programs without estimates.
export function balanceUses(b: Balance): BalanceUse[] {
  const p = PROGRAMS[b.programId]
  if (!hasEstimates(p)) return []
  if (p.type === 'cashback') return CASH_USES.map((u) => ({ ...u, value: cents(b.amount) }))
  const cpp = p.cpp
  if (!cpp) return []
  return POINT_USES.map((u) => ({ ...u, value: cents((b.amount * cpp[u.id as GoalId]) / 100) }))
}

// ---- Lifestyle ties: put a dollar amount in terms of the user's own spending ----

const WEEKS_PER_MONTH = 52 / 12
const DAYS_PER_MONTH = 365 / 12
const toHalf = (n: number) => Math.round(n * 2) / 2
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
// Categories that read naturally as "N weeks of your ___"
const TIE_NOUN: Partial<Record<CategoryId, string>> = {
  groceries: 'groceries',
  dining: 'dining out',
  gas: 'gas',
  online: 'online shopping',
}

// e.g. "about 4.5 weeks of your groceries", "about 1.5 weeks of your gas". Null when there's no meaningful tie.
export function lifestyleTie(dollars: number, spend: Spend = SPEND): string | null {
  if (!(dollars > 0)) return null
  const cats = categoriesBySpend(spend).filter((c) => TIE_NOUN[c.id] && spend[c.id] > 0)
  const top = cats[0]
  if (!top) return null
  const months = dollars / spend[top.id]
  if (months >= 1.5) return `about ${count(toHalf(months), 'month')} of your ${TIE_NOUN[top.id]}`
  const weeks = months * WEEKS_PER_MONTH
  if (weeks >= 1) return `about ${count(toHalf(weeks), 'week')} of your ${TIE_NOUN[top.id]}`
  // Smaller amounts: the highest-spend category this covers about a week or more of
  for (const c of cats.slice(1)) {
    const w = (dollars / spend[c.id]) * WEEKS_PER_MONTH
    if (w >= 1) return `about ${count(toHalf(w), 'week')} of your ${TIE_NOUN[c.id]}`
  }
  const days = Math.round(months * DAYS_PER_MONTH)
  return days >= 1 ? `about ${count(days, 'day')} of your ${TIE_NOUN[top.id]}` : null
}

// ---- Coach tips ----

export interface CoachTip {
  id: string // unique per tip, safe as a React key
  kind: 'bonus' | 'uses' | 'rotating' | 'stale'
  icon: string
  text: string
  href: string
  balanceId?: number
}

const joinAnd = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

// Personal ideas built from the user's spending and balances. Each tip appears only when it applies.
export function coachTips(balances: Balance[], spend: Spend = SPEND): CoachTip[] {
  const tips: CoachTip[] = []
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))

  // 1. A bonus earn rate on the highest-spend category that has one
  for (const c of categoriesBySpend(spend)) {
    if (!(spend[c.id] > 0)) continue
    const bonus = cardEarnings(cards, c.id, spend).filter((e) => e.known && e.rate > 1)
    if (bonus.length === 0) continue
    for (const e of bonus) {
      const earned =
        e.program.type === 'cashback'
          ? `about ${fmtMoney(e.monthly)} cashback`
          : `about ${fmtPts(e.monthly)} ${e.program.unit}, ≈${fmtMoney(e.value.travel)} toward travel or ≈${fmtMoney(e.value.cashback)} as a statement credit`
      // Rotating categories earn the bonus only in featured quarters, so phrase it as an upper bound.
      const rotating = e.note?.startsWith('Rotating')
      tips.push({
        id: `bonus-${e.balance.id}`,
        kind: 'bonus',
        icon: '✨',
        text: rotating
          ? `${e.balance.cardName} can earn up to ${earnRateLabel(e)} on ${catName(c.id)} in quarters it’s featured — on your ${fmtMoney(spend[c.id])} a month that’s up to ${fmtMoney(e.monthly)} cashback.`
          : `${e.balance.cardName} earns ${earnRateLabel(e)} on ${catName(c.id)} — on your ${fmtMoney(spend[c.id])} a month that’s ${earned}.`,
        href: '#coach',
      })
    }
    break
  }

  // 2. What each points balance could cover
  for (const b of cards) {
    const p = PROGRAMS[b.programId]
    if (p.type !== 'points' || !(b.amount > 0)) continue
    const uses = balanceUses(b)
    const travel = uses.find((u) => u.id === 'travel')
    const credit = uses.find((u) => u.id === 'cashback')
    if (!travel || !credit) continue
    tips.push({
      id: `uses-${b.id}`,
      kind: 'uses',
      icon: '✈️',
      text: `Your ${fmtBalance(b)} could cover ≈${fmtMoney(travel.value)} of travel or ≈${fmtMoney(credit.value)} as a statement credit.`,
      href: '#redeem',
    })
  }

  // 3. Discover's quarterly bonus categories
  const discover = cards.find((b) => b.programId === 'discover')
  if (discover) {
    const rule = CARD_RULES[discover.cardName]
    const bonus = rule ? CATEGORIES.filter((c) => (rule.rates[c.id] ?? 0) > 1) : []
    if (rule && bonus.length > 0) {
      const rate = Math.max(...bonus.map((c) => rule.rates[c.id] ?? 0))
      tips.push({
        id: `rotating-${discover.id}`,
        kind: 'rotating',
        icon: '🔁',
        text: `Discover’s ${rate}% categories rotate each quarter — in quarters that feature ${joinAnd(bonus.map((c) => catName(c.id)))}, that spending can earn ${rate}% once activated.`,
        href: '#coach',
      })
    } else {
      tips.push({
        id: `rotating-${discover.id}`,
        kind: 'rotating',
        icon: '🔁',
        text: 'Discover’s bonus categories rotate each quarter — once activated, spending in that quarter’s categories can earn extra cashback.',
        href: '#coach',
      })
    }
  }

  // 4. Balances due for a refresh
  for (const b of balances.filter(isStale)) {
    tips.push({
      id: `stale-${b.id}`,
      kind: 'stale',
      icon: '⏰',
      text: `Your ${b.cardName} balance was last updated ${ageDays(b.updatedAt)} days ago — a quick update keeps these estimates current.`,
      href: '#',
      balanceId: b.id,
    })
  }

  return tips
}

// Highest-spend category where every card earns the base rate — a spot Marketplace cards could add to.
// "Everything else" counts only when it's the sole match.
export function marketplaceCategory(balances: Balance[], spend: Spend = SPEND): CategoryId | null {
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))
  if (cards.length === 0) return null
  const gaps = categoriesBySpend(spend).filter(
    (c) => spend[c.id] > 0 && cardEarnings(cards, c.id, spend).every((e) => e.rate <= 1),
  )
  return (gaps.find((c) => c.id !== 'other') ?? gaps[0])?.id ?? null
}

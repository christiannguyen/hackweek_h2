// Point values and earn rates below are ILLUSTRATIVE placeholders, not confirmed program valuations.
import transactions from './transactions.json'

export type GoalId = 'travel' | 'everyday' | 'cashback'
export type ProgramId = 'amex_mr' | 'chase_ur' | 'citi_typ' | 'capone' | 'discover' | 'creditone' | 'other'

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
  creditLimit?: number
  cardBalance?: number
  updatedAt: string
}

export const PROGRAMS: Record<ProgramId, Program> = {
  amex_mr: { name: 'Amex Membership Rewards', short: 'AX', brand: 'Amex', unit: 'points', type: 'points', supported: true, cpp: { travel: 1.0, everyday: 0.6, cashback: 0.6 } },
  chase_ur: { name: 'Chase Ultimate Rewards', short: 'CH', brand: 'Chase', unit: 'points', type: 'points', supported: true, cpp: { travel: 1.25, everyday: 1.0, cashback: 1.0 } },
  citi_typ: { name: 'Citi ThankYou Points', short: 'CI', brand: 'Citi', unit: 'points', type: 'points', supported: true, cpp: { travel: 1.0, everyday: 1.0, cashback: 1.0 } },
  capone: { name: 'Capital One Miles', short: 'C1', brand: 'Capital One', unit: 'miles', type: 'points', supported: true, cpp: { travel: 1.0, everyday: 0.5, cashback: 0.5 } },
  discover: { name: 'Discover Cashback Bonus', short: 'DI', brand: 'Discover', unit: 'cashback', type: 'cashback', supported: true },
  creditone: { name: 'Credit One Cash Back Rewards', short: 'CO', brand: 'Credit One', unit: 'cashback', type: 'cashback', supported: true },
  other: { name: 'Other program', short: '?', brand: 'program', unit: 'points', type: 'points', supported: false },
}

const GOAL_IDS: GoalId[] = ['travel', 'everyday', 'cashback']

export const GOALS: Record<GoalId, { label: string; points: string[]; cashback: string[] }> = {
  travel: {
    label: '✈️ Flight',
    points: ['Sign in to your card’s rewards portal', 'Search flights in the travel section', 'Choose "pay with points" at checkout'],
    cashback: ['Book the flight with any card', 'Redeem cashback as a statement credit to offset it'],
  },
  everyday: {
    label: '🛒 Everyday',
    points: ['Open your card’s rewards page', 'Pick gift cards or "shop with points" (e.g. Amazon)', 'Apply points at checkout'],
    cashback: ['Use cashback at checkout with supported merchants (e.g. Amazon, PayPal)'],
  },
  cashback: {
    label: '💵 Cash',
    points: ['Open your card’s rewards page', 'Choose "statement credit" or "deposit to bank"', 'Enter the amount to redeem'],
    cashback: ['Choose statement credit or direct deposit', 'Funds usually post in 1–3 business days'],
  },
}

export const STALE_DAYS = 30

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString()

// SAMPLE wallet: cards a Kikoff user building credit is likely to have, a secured card and a fair-credit card.
export const SEED: Balance[] = [
  { id: 1, programId: 'discover', cardName: 'Discover it Secured', amount: 18.4, creditLimit: 500, cardBalance: 142.5, updatedAt: daysAgo(3) },
  { id: 2, programId: 'creditone', cardName: 'Credit One Platinum Visa', amount: 9.15, creditLimit: 300, cardBalance: 87.23, updatedAt: daysAgo(12) },
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
// Never negative: a balance saved with a clock slightly ahead still reads as today.
export const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5))
export const isCash = (b: Balance) => PROGRAMS[b.programId].type === 'cashback'
// Null until both the limit and the amount owed are entered, so a blank balance never reads as 0%.
export const utilization = (b: Balance) =>
  b.creditLimit && b.creditLimit > 0 && b.cardBalance != null ? b.cardBalance / b.creditLimit : null
export const isStale = (b: Balance) => ageDays(b.updatedAt) > STALE_DAYS
// A program has estimates when it's supported and has a value per point (cashback is always $1 = $1).
export const hasEstimates = (p: Program) => p.supported && (p.type === 'cashback' || !!p.cpp)
// "50,000 Chase points" / "$42.18 cashback" / "10,000 points" (unsupported program, no brand)
export const fmtBalance = (b: Balance) => {
  const p = PROGRAMS[b.programId]
  return p.type === 'cashback' ? `${fmtUSD(b.amount)} cashback` : `${fmtPts(b.amount)} ${p.supported ? `${p.brand} ` : ''}${p.unit}`
}

// ---- Spending ----

// The categories most Kikoff users spend in that cards actually reward. Loan payments, bank fees, transfers and
// rent are left out: cards don't earn there.
export type CategoryId = 'food' | 'shopping' | 'transport'
export type Spend = Record<CategoryId, number>

// label = tab text; noun = how the category reads in running copy ("on gas & transit").
export const CATEGORIES: { id: CategoryId; label: string; noun: string; emoji: string }[] = [
  { id: 'food', label: 'Food & drink', noun: 'food & drink', emoji: '🍔' },
  { id: 'shopping', label: 'Shopping', noun: 'shopping', emoji: '🛍️' },
  { id: 'transport', label: 'Gas & transit', noun: 'gas & transit', emoji: '⛽' },
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

// Spend per category in the 30 days up to and including `asOf` (yyyy-mm-dd), rounded to cents. A rolling 30 days, like
// most spending-insight views, rather than the calendar month, which is nearly empty in its first week.
export function last30DaysSpend(txns: Transaction[], asOf: string): Spend {
  const from = new Date(new Date(`${asOf}T12:00:00Z`).getTime() - 29 * 864e5).toISOString().slice(0, 10)
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Spend
  for (const t of txns) if (t.date >= from && t.date <= asOf && t.category in totals) totals[t.category] += t.amount
  for (const c of CATEGORIES) totals[c.id] = cents(totals[c.id])
  return totals
}

// SAMPLE: counted back from the newest sample transaction rather than today, so the demo doesn't run empty.
const SAMPLE_AS_OF = TRANSACTIONS.reduce((d, t) => (t.date > d ? t.date : d), '')
export const SPEND = last30DaysSpend(TRANSACTIONS, SAMPLE_AS_OF)
// How many sample transactions the 30 days cover, for "based on N transactions".
const WINDOW_FROM = new Date(new Date(`${SAMPLE_AS_OF}T12:00:00Z`).getTime() - 29 * 864e5).toISOString().slice(0, 10)
export const SPEND_TXN_COUNT = TRANSACTIONS.filter((t) => t.date >= WINDOW_FROM && t.date <= SAMPLE_AS_OF).length

export const categoriesBySpend = (spend: Spend = SPEND) => [...CATEGORIES].sort((a, b) => spend[b.id] - spend[a.id])

// The user's top 3 categories by spend, the ones we compare cards for.
export const TOP_CATEGORIES = categoriesBySpend(SPEND)
  .filter((c) => SPEND[c.id] > 0)
  .slice(0, 3)

export const TOP_CATEGORY: CategoryId = TOP_CATEGORIES[0]?.id ?? 'food'

// ---- Earn more on your spending: rewards per card ----
// Earn rates are ILLUSTRATIVE for the demo — real rates, caps and categories change; the issuer has the latest.
// Each card gets one rate per category, for the main part of it: grocery stores for food & drink, gas stations for
// gas & transit, general and online stores for shopping. Notes cover the rest (like a higher rate at restaurants).

interface CategoryRate {
  rate: number
  cap?: { amount: number; per: 'month' | 'quarter' | 'year' } // spend that earns `rate`; after it, the base rate
  quarters?: number // rotating categories: quarters a year it's featured (the rest of the year earns the base rate)
  needs?: string // an extra step the rate depends on ("pay with Apple Pay"). Market cards are counted without it.
  note?: string
}

interface CardRule {
  base?: number // the rate everywhere else, 1 when not set
  rates: Partial<Record<CategoryId, CategoryRate>>
}

const ROTATING = 'Rotating 5% category: featured one quarter a year, up to $1,500, once you activate it. 1% the rest of the year.'

export const CARD_RULES: Record<string, CardRule> = {
  'Amex Gold': {
    rates: { food: { rate: 4, note: 'Restaurants, plus US supermarkets up to $25,000 a year.' } },
  },
  'Sapphire Preferred': {
    rates: {
      food: { rate: 1, note: '3× at restaurants and on online grocery orders.' },
      transport: { rate: 1, note: '2× on transit, rideshare, parking and tolls.' },
    },
  },
  'Citi Premier': {
    rates: {
      food: { rate: 3, note: 'Supermarkets and restaurants.' },
      transport: { rate: 3, note: 'Gas stations and EV charging.' },
    },
  },
  Venture: { base: 2, rates: {} },
  'Discover it': {
    rates: {
      shopping: { rate: 5, cap: { amount: 1500, per: 'quarter' }, quarters: 1, note: ROTATING },
      transport: { rate: 5, cap: { amount: 1500, per: 'quarter' }, quarters: 1, note: ROTATING },
    },
  },
}

// A card's terms by name: the sample rules first, then the market list ("Platinum Visa" or "Credit One Platinum Visa").
export function ruleFor(cardName: string): CardRule | undefined {
  const rule = Object.entries(CARD_RULES).find(([name]) => sameName(name, cardName))?.[1]
  if (rule) return rule
  const c = ALL_CARDS.find((m) => isCard(cardName, m))
  return c && { base: c.base, rates: c.rates }
}

export interface CardEarning {
  balance: Balance
  program: Program
  base: number
  rate: number
  terms?: CategoryRate // the card's terms in this category, as counted (a rate that needs an extra step isn't)
  known: boolean // false = card not in the sample rules, estimated at the base 1× / 1%
  note?: string
  avgRate: number // the rate averaged over a year, after caps and rotating quarters (equals `rate` without them)
  monthly: number // points a month, or dollars a month for cashback cards, averaged over a year
  yearly: number
  value: Record<GoalId, number> // estimated $ a month for each way to use it
}

export const earnRateLabel = (e: Pick<CardEarning, 'program' | 'rate'>) => fmtRate(e.program.type, e.rate)

// What a month of spending in one category could earn on each card. Wallet order, no sorting.
export function cardEarnings(balances: Balance[], cat: CategoryId, spend: Spend = SPEND): CardEarning[] {
  const amount = spend[cat] ?? 0
  const out: CardEarning[] = []
  for (const balance of balances) {
    const program = PROGRAMS[balance.programId]
    if (!hasEstimates(program)) continue
    const rule = ruleFor(balance.cardName)
    const base = rule?.base ?? 1
    const listed = rule?.rates[cat]
    // Like market cards, a rate that needs an extra step (a way to pay, a category to pick) counts at the base rate.
    const terms = listed?.needs ? undefined : listed
    const rate = terms?.rate ?? base
    const note = listed?.needs ? `${fmtRate(program.type, listed.rate)} if you ${listed.needs}. Counted at ${fmtRate(program.type, base)}.` : listed?.note
    const cash = program.type === 'cashback'
    // A year of spend, with the bonus rate only on the part a cap or rotating quarter allows (same as compareCards).
    const yearSpend = amount * 12
    const bonus = terms ? bonusSpend(yearSpend, terms) : 0
    const yearUnits = bonus * rate + (yearSpend - bonus) * base // points, or cents for cashback
    const avgRate = yearSpend > 0 ? Math.round((yearUnits / yearSpend) * 10) / 10 : rate
    const yearly = cash ? cents(yearUnits / 100) : Math.round(yearUnits)
    const monthly = cash ? cents(yearUnits / 1200) : Math.round(yearUnits / 12)
    const value = Object.fromEntries(
      GOAL_IDS.map((g) => [g, cash ? monthly : cents((yearUnits / 12) * (program.cpp?.[g] ?? 0) / 100)]),
    ) as Record<GoalId, number>
    out.push({ balance, program, base, rate, terms, known: !!rule, note, avgRate, monthly, yearly, value })
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
  { id: 'cashback', emoji: '💵', label: 'as a statement credit', detail: 'Comes off what you owe, or lands in your bank' },
]

const CASH_USES: Omit<BalanceUse, 'value'>[] = [
  { id: 'cashback', emoji: '💵', label: 'as a statement credit', detail: 'Comes off what you owe on the card' },
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
  food: 'food & drink',
  shopping: 'shopping',
  transport: 'gas & transit',
}

// e.g. "about 4.5 weeks of your food & drink", "about 1.5 weeks of your gas & transit". Null when there's no meaningful tie.
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
  kind: 'payoff' | 'bonus' | 'uses' | 'rotating' | 'stale'
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

  // Always first: every rewards number on this page assumes the balance is paid in full
  tips.push({
    id: 'payoff',
    kind: 'payoff',
    icon: '✅',
    text: 'Paying the full balance each month keeps interest away. Card interest is often 25% a year or more, more than any card earns back.',
    href: '#coach',
  })

  // 1. A bonus earn rate on the highest-spend category that has one
  for (const c of categoriesBySpend(spend)) {
    if (!(spend[c.id] > 0)) continue
    const bonus = cardEarnings(cards, c.id, spend).filter((e) => e.known && e.rate > 1)
    if (bonus.length === 0) continue
    for (const e of bonus) {
      const rotating = !!e.terms?.quarters
      const earned = e.program.type === 'cashback' ? fmtMoney(e.monthly) : `≈${fmtMoney(e.value.cashback)}`
      // Featured months still stop at the cap (e.g. $1,500 a quarter is $500 a month)
      const cap = e.terms?.cap
      const featured = cap ? Math.min(spend[c.id], cap.amount / { month: 1, quarter: 3, year: 12 }[cap.per]) : spend[c.id]
      tips.push({
        id: `bonus-${e.balance.id}`,
        kind: 'bonus',
        icon: '✨',
        text: rotating
          ? `${e.balance.cardName}: up to ${earnRateLabel(e)} on ${catName(c.id)} — ${fmtMoney(cents((featured * e.rate) / 100))}/mo in featured quarters.`
          : `${e.balance.cardName}: ${earnRateLabel(e)} on ${catName(c.id)} — ${earned}/mo.`,
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
      text: `${fmtBalance(b)} could be ≈${fmtMoney(travel.value)} toward travel or ≈${fmtMoney(credit.value)} as a statement credit.`,
      href: `#wallet/${b.id}`,
    })
  }

  // 3. Quarterly bonus categories, on cards that rotate them (Discover cards we don't know might)
  for (const b of cards) {
    const rule = ruleFor(b.cardName)
    const bonus = rule ? CATEGORIES.filter((c) => rule.rates[c.id]?.quarters) : []
    if (bonus.length > 0) {
      const rate = Math.max(...bonus.map((c) => rule!.rates[c.id]?.rate ?? 0))
      tips.push({
        id: `rotating-${b.id}`,
        kind: 'rotating',
        icon: '🔁',
        text: `${b.cardName} rotates ${rate}% categories each quarter, including ${joinAnd(bonus.map((c) => catName(c.id)))}. The bonus rate applies once it’s activated each quarter.`,
        href: '#coach',
      })
    } else if (!rule && b.programId === 'discover') {
      tips.push({
        id: `rotating-${b.id}`,
        kind: 'rotating',
        icon: '🔁',
        text: 'Some Discover cards rotate bonus categories each quarter. The bonus applies once it’s activated.',
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
      text: `${b.cardName} balance is ${ageDays(b.updatedAt)} days old. Updating it refreshes these estimates.`,
      href: '#',
      balanceId: b.id,
    })
  }

  return tips
}

// ---- Card stacking: which card to use for each spending category ----

export interface StackingRule {
  category: { id: CategoryId; label: string; noun: string; emoji: string }
  card: Balance
  rate: number
  rateLabel: string
  monthly: number
}

export function cardStacking(balances: Balance[], spend: Spend = SPEND): StackingRule[] {
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))
  if (cards.length === 0) return []
  return CATEGORIES
    .filter((c) => spend[c.id] > 0)
    .map((c) => {
      const earnings = cardEarnings(cards, c.id, spend)
      const best = earnings.length > 0
        ? earnings.reduce((a, b) => (a.value.cashback >= b.value.cashback ? a : b))
        : null
      if (!best) return null
      return {
        category: c,
        card: best.balance,
        rate: best.rate,
        rateLabel: fmtRate(best.program.type, best.avgRate),
        monthly: best.value.cashback,
      }
    })
    .filter((r): r is StackingRule => r !== null)
}

// ---- "What you left on the table" ----

export interface LeftOnTable {
  total: number
  byCategory: { id: CategoryId; label: string; emoji: string; actual: number; optimal: number; missed: number }[]
}

export function leftOnTable(balances: Balance[], spend: Spend = SPEND): LeftOnTable | null {
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))
  if (cards.length === 0) return null
  const byCategory = CATEGORIES
    .filter((c) => spend[c.id] > 0)
    .map((c) => {
      const earnings = cardEarnings(cards, c.id, spend)
      const best = earnings.length > 0
        ? earnings.reduce((a, b) => (a.value.cashback >= b.value.cashback ? a : b))
        : null
      const optimal = best?.value.cashback ?? 0
      const base = spend[c.id] * 0.01
      return { id: c.id, label: c.label, emoji: c.emoji, actual: base, optimal, missed: cents(optimal - base) }
    })
    .filter((c) => c.missed > 0)
  const total = cents(byCategory.reduce((s, c) => s + c.missed, 0))
  if (total <= 0) return null
  return { total, byCategory }
}

// ---- Seasonal / calendar-aware tips ----

export interface SeasonalTip {
  id: string
  icon: string
  title: string
  detail: string
  months: number[]
}

const SEASONAL_TIPS: SeasonalTip[] = [
  { id: 'holiday', icon: '🎄', title: 'Holiday spending ahead', detail: 'Use your highest-earning shopping card for gifts. Many cards offer extra rewards on department stores in Q4.', months: [10, 11] },
  { id: 'back-to-school', icon: '📚', title: 'Back-to-school season', detail: 'School supplies, electronics, and clothing — use your best shopping card for these purchases.', months: [7, 8] },
  { id: 'summer-travel', icon: '🏖️', title: 'Summer travel season', detail: 'Book travel through your card portal for bonus rates. Gas spending goes up — use your best transport card.', months: [5, 6] },
  { id: 'tax-season', icon: '📋', title: 'Tax season reminder', detail: 'Some cards earn bonus rewards on tax prep services. Check if your cashback or points can offset your tax prep costs.', months: [1, 2, 3] },
  { id: 'q1-rotate', icon: '🔄', title: 'Q1 rotating categories are live', detail: 'If you have a Discover it or Chase Freedom, activate your Q1 bonus categories now to earn 5%.', months: [0] },
  { id: 'q2-rotate', icon: '🔄', title: 'Q2 rotating categories are live', detail: 'Activate your Q2 bonus categories on Discover it or Chase Freedom to keep earning 5%.', months: [3] },
  { id: 'q3-rotate', icon: '🔄', title: 'Q3 rotating categories are live', detail: 'Activate your Q3 bonus categories. Rotating category cards need manual opt-in each quarter.', months: [6] },
  { id: 'q4-rotate', icon: '🔄', title: 'Q4 rotating categories are live', detail: 'Last quarter of the year — activate your Q4 bonus categories for holiday shopping rewards.', months: [9] },
  { id: 'new-year', icon: '🎯', title: 'New year, new rewards strategy', detail: 'Annual caps reset in January. Review your card lineup and make sure you are using the right card for each category.', months: [0] },
]

export function seasonalTips(month?: number): SeasonalTip[] {
  const m = month ?? new Date().getMonth()
  return SEASONAL_TIPS.filter((t) => t.months.includes(m))
}

// ---- Points expiration warnings ----

export interface ExpirationWarning {
  balance: Balance
  message: string
  severity: 'info' | 'warning'
}

const EXPIRATION_RULES: Partial<Record<ProgramId, { months: number; note: string }>> = {
  capone: { months: 24, note: 'Capital One miles expire after 24 months of account inactivity.' },
  citi_typ: { months: 12, note: 'Citi ThankYou Points expire 12 months after your last account activity.' },
  discover: { months: 0, note: 'Discover cashback does not expire while your account is open.' },
}

export function expirationWarnings(balances: Balance[]): ExpirationWarning[] {
  const warnings: ExpirationWarning[] = []
  for (const b of balances) {
    if (!(b.amount > 0)) continue
    const rule = EXPIRATION_RULES[b.programId]
    if (!rule) continue
    if (rule.months === 0) continue
    const daysSinceUpdate = ageDays(b.updatedAt)
    const monthsSinceUpdate = daysSinceUpdate / 30
    if (monthsSinceUpdate > rule.months * 0.75) {
      warnings.push({
        balance: b,
        message: `${rule.note} Make a purchase or redeem soon to keep them active.`,
        severity: monthsSinceUpdate > rule.months * 0.9 ? 'warning' : 'info',
      })
    }
  }
  return warnings
}

// ---- Kikoff graduation milestones ----

export interface GraduationMilestone {
  id: string
  icon: string
  title: string
  detail: string
  progress: number
  achieved: boolean
}

export function graduationMilestones(balances: Balance[], score: number = CREDIT_SCORE): GraduationMilestone[] {
  const milestones: GraduationMilestone[] = []
  const tier = tierFor(score)

  const allUnder30 = balances.every((b) => {
    const u = utilization(b)
    return u === null || u < 0.3
  })
  const allUnder10 = balances.every((b) => {
    const u = utilization(b)
    return u === null || u < 0.1
  })

  milestones.push({
    id: 'util-30',
    icon: '📊',
    title: 'Keep utilization under 30%',
    detail: allUnder30
      ? 'You are under 30% on all cards. Keep it up — this is a key factor in your credit score.'
      : 'Pay down balances to get all cards under 30% utilization. This is the biggest quick win for your score.',
    progress: allUnder30 ? 1 : Math.max(0, 1 - (balances.reduce((max, b) => Math.max(max, utilization(b) ?? 0), 0) - 0.3) / 0.7),
    achieved: allUnder30,
  })

  milestones.push({
    id: 'util-10',
    icon: '🏆',
    title: 'Get to single-digit utilization',
    detail: allUnder10
      ? 'Excellent — under 10% utilization is ideal for the highest credit scores.'
      : 'Below 10% utilization is where credit scores really improve. Pay down a bit more to reach this level.',
    progress: allUnder10 ? 1 : allUnder30 ? 0.5 : 0,
    achieved: allUnder10,
  })

  if (tier === 'building' || tier === 'fair') {
    const target = tier === 'building' ? 580 : 670
    const from = tier === 'building' ? 300 : 580
    milestones.push({
      id: 'score-up',
      icon: '📈',
      title: tier === 'building' ? 'Reach fair credit (580+)' : 'Reach good credit (670+)',
      detail: tier === 'building'
        ? `At ${score}, you are ${target - score} points from fair credit. Fair credit opens unsecured cards with real rewards.`
        : `At ${score}, you are ${target - score} points from good credit. Good credit unlocks the best no-fee rewards cards.`,
      progress: Math.min(1, (score - from) / (target - from)),
      achieved: false,
    })
  }

  const nextTier = CREDIT_TIERS[tierRank(tier) + 1]
  if (nextTier) {
    const cardsAtNextTier = MARKET_CARDS.filter((c) => c.credit === nextTier.id && c.annualFee === 0)
    if (cardsAtNextTier.length > 0) {
      const best = cardsAtNextTier.sort((a, b) => b.base - a.base)[0]
      milestones.push({
        id: 'next-card',
        icon: '💳',
        title: `Unlock: ${best.issuer} ${best.name}`,
        detail: `At ${nextTier.range} credit, you could qualify for cards like the ${best.issuer} ${best.name} (${fmtRate(best.type, best.base)} on everything, no annual fee).`,
        progress: Math.min(1, (score - CREDIT_TIERS[tierRank(tier)].min) / (nextTier.min - CREDIT_TIERS[tierRank(tier)].min)),
        achieved: false,
      })
    }
  }

  return milestones
}

// ---- Redemption math: real value of points across methods ----

export interface RedemptionComparison {
  balance: Balance
  program: Program
  methods: { id: string; label: string; emoji: string; cpp: number; value: number; best: boolean }[]
}

export function redemptionMath(balances: Balance[]): RedemptionComparison[] {
  return balances
    .filter((b) => {
      const p = PROGRAMS[b.programId]
      return p.type === 'points' && p.cpp && b.amount > 0
    })
    .map((b) => {
      const p = PROGRAMS[b.programId]
      const cpp = p.cpp!
      const methods = [
        { id: 'travel', label: 'Travel portal', emoji: '✈️', cpp: cpp.travel, value: cents((b.amount * cpp.travel) / 100) },
        { id: 'everyday', label: 'Gift cards / shopping', emoji: '🛒', cpp: cpp.everyday, value: cents((b.amount * cpp.everyday) / 100) },
        { id: 'cashback', label: 'Statement credit', emoji: '💵', cpp: cpp.cashback, value: cents((b.amount * cpp.cashback) / 100) },
      ]
      const maxVal = Math.max(...methods.map((m) => m.value))
      return {
        balance: b,
        program: p,
        methods: methods.map((m) => ({ ...m, best: m.value === maxVal })),
      }
    })
}

// Highest-spend category where every card earns the base rate — a spot Marketplace cards could add to.
export function marketplaceCategory(balances: Balance[], spend: Spend = SPEND): CategoryId | null {
  const cards = balances.filter((b) => hasEstimates(PROGRAMS[b.programId]))
  if (cards.length === 0) return null
  const gaps = categoriesBySpend(spend).filter(
    (c) => spend[c.id] > 0 && cardEarnings(cards, c.id, spend).every((e) => e.rate <= 1),
  )
  return gaps[0]?.id ?? null
}

// ---- Card comparison: your cards vs cards on the market, for one category ----
// A year of rewards from the user's spend in the category, minus the annual fee for cards they don't have yet.
// EXAMPLE cards for the demo. Terms are typical of each card but weren't checked against the issuers, and they
// change, so the issuer's page has the latest. The list leans toward cards made for fair credit or while
// building credit, since that's who uses Kikoff.

export type CreditTier = 'building' | 'fair' | 'good'

// SAMPLE: the user's score, which Kikoff already has from their credit report. Fixed for the demo, in the fair range
// where most Kikoff users are.
export const CREDIT_SCORE = 640
// Ordered loosest → strictest. A card shows for its tier and every stricter one; secured cards only for building.
export const CREDIT_TIERS: { id: CreditTier; label: string; range: string; min: number }[] = [
  { id: 'building', label: 'Building', range: 'New or under 580', min: 300 },
  { id: 'fair', label: 'Fair', range: '580–669', min: 580 },
  { id: 'good', label: 'Good', range: '670+', min: 670 },
]
export const tierFor = (score: number): CreditTier => [...CREDIT_TIERS].reverse().find((t) => score >= t.min)?.id ?? 'building'
export const CREDIT = tierFor(CREDIT_SCORE)
const tierRank = (t: CreditTier) => CREDIT_TIERS.findIndex((c) => c.id === t)
export const creditLabel = (t: CreditTier) => {
  const c = CREDIT_TIERS.find((x) => x.id === t)!
  return t === 'building' ? 'For building credit' : `Usually for ${c.label.toLowerCase()} credit (${c.range})`
}

export interface MarketCard {
  name: string
  issuer: string
  short: string
  type: 'points' | 'cashback'
  cpp?: number // cash value of a point, in cents (points cards only)
  base: number
  rates: Partial<Record<CategoryId, CategoryRate>>
  annualFee: number
  feeNote?: string
  deposit?: number // secured cards: the smallest refundable deposit
  credit: CreditTier
  note?: string
  inApp?: boolean // offered in the Kikoff app
  url: string
}

const SUPERMARKETS = 'At US supermarkets. Superstores and warehouse clubs don’t count.'
const CUSTOM_CASH = 'Only on your top eligible category each month.'
// Some cards share terms across versions (secured and not), so their rates are written once.
const BOFA: MarketCard['rates'] = {
  food: { rate: 2, cap: { amount: 2500, per: 'quarter' }, note: 'At grocery stores and warehouse clubs. The $2,500 a quarter is shared with your 3% category.' },
  shopping: { rate: 3, cap: { amount: 2500, per: 'quarter' }, needs: 'pick online shopping as your 3% category' },
  transport: { rate: 3, cap: { amount: 2500, per: 'quarter' }, needs: 'pick gas as your 3% category' },
}
const ALTITUDE_GO: MarketCard['rates'] = {
  food: { rate: 2, note: '4× at restaurants. Superstores and warehouse clubs don’t count.' },
  transport: { rate: 2, note: 'At gas stations and EV charging.' },
}
const CASH_PLUS: MarketCard['rates'] = {
  food: { rate: 2, needs: 'pick grocery stores as your 2% category each quarter' },
  shopping: { rate: 5, cap: { amount: 2000, per: 'quarter' }, needs: 'pick department and electronics stores each quarter' },
  transport: { rate: 2, needs: 'pick gas as your 2% category each quarter', note: 'Transit and rideshare can earn 5%.' },
}
const APPLE_PAY: CategoryRate = { rate: 2, needs: 'pay with Apple Pay' }

export const MARKET_CARDS: MarketCard[] = [
  // Building credit
  { name: 'Quicksilver Secured', issuer: 'Capital One', short: 'C1', type: 'cashback', base: 1.5, rates: {}, annualFee: 0, deposit: 200, credit: 'building', inApp: true, url: 'https://www.capitalone.com/credit-cards/quicksilver-secured/' },
  { name: 'Discover it Secured', issuer: 'Discover', short: 'DI', type: 'cashback', base: 1, rates: { food: { rate: 1, note: '2% at restaurants.' }, transport: { rate: 2, cap: { amount: 1000, per: 'quarter' }, note: 'At gas stations. The $1,000 a quarter is shared with restaurants.' } }, annualFee: 0, deposit: 200, credit: 'building', url: 'https://www.discover.com/credit-cards/secured/' },
  { name: 'Customized Cash Rewards Secured', issuer: 'Bank of America', short: 'BA', type: 'cashback', base: 1, rates: BOFA, annualFee: 0, deposit: 200, credit: 'building', url: 'https://www.bankofamerica.com/credit-cards/products/secured-cash-back-credit-card/' },
  { name: 'Unlimited Cash Rewards Secured', issuer: 'Bank of America', short: 'BA', type: 'cashback', base: 1.5, rates: {}, annualFee: 0, deposit: 200, credit: 'building', url: 'https://www.bankofamerica.com/credit-cards/products/unlimited-cash-back-secured-credit-card/' },
  { name: 'Altitude Go Secured', issuer: 'U.S. Bank', short: 'US', type: 'points', cpp: 1, base: 1, rates: ALTITUDE_GO, annualFee: 0, deposit: 300, credit: 'building', url: 'https://www.usbank.com/credit-cards/altitude-go-secured-visa-credit-card.html' },
  { name: 'Cash+ Secured', issuer: 'U.S. Bank', short: 'US', type: 'cashback', base: 1, rates: CASH_PLUS, annualFee: 0, deposit: 300, credit: 'building', url: 'https://www.usbank.com/credit-cards/cash-plus-secured-visa-credit-card.html' },
  { name: 'Freedom Rise', issuer: 'Chase', short: 'CH', type: 'cashback', base: 1.5, rates: {}, annualFee: 0, credit: 'building', note: 'Made for people new to credit. Having a Chase checking account may help.', url: 'https://creditcards.chase.com/cash-back-credit-cards/freedom/rise' },

  // Fair credit
  { name: 'Platinum X5', issuer: 'Credit One', short: 'CO', type: 'points', cpp: 1, base: 1, rates: { food: { rate: 5, cap: { amount: 5000, per: 'year' }, note: 'At grocery stores. Restaurants earn 1×. The $5,000 a year is shared with gas, phone, internet and streaming.' }, transport: { rate: 5, cap: { amount: 5000, per: 'year' }, note: 'At gas stations. The $5,000 a year is shared with groceries, phone, internet and streaming.' } }, annualFee: 95, credit: 'fair', inApp: true, url: 'https://www.creditonebank.com/credit-cards/platinum-x5-visa' },
  { name: 'Platinum Visa', issuer: 'Credit One', short: 'CO', type: 'cashback', base: 0, rates: { food: { rate: 1, note: 'At grocery stores.' }, transport: { rate: 1, note: 'At gas stations.' } }, annualFee: 75, feeNote: 'then $99 a year', credit: 'fair', note: 'Earns only on groceries, gas, phone and internet. Fees vary by offer.', url: 'https://www.creditonebank.com/credit-cards/platinum-visa' },
  { name: 'QuicksilverOne', issuer: 'Capital One', short: 'C1', type: 'cashback', base: 1.5, rates: {}, annualFee: 39, credit: 'fair', inApp: true, url: 'https://www.capitalone.com/credit-cards/quicksilverone/' },
  { name: 'Apple Card', issuer: 'Apple', short: 'AP', type: 'cashback', base: 1, rates: { food: APPLE_PAY, shopping: APPLE_PAY, transport: APPLE_PAY }, annualFee: 0, credit: 'fair', url: 'https://www.apple.com/apple-card/' },
  { name: 'Cash Rewards Visa', issuer: 'Upgrade', short: 'UP', type: 'cashback', base: 1.5, rates: {}, annualFee: 0, credit: 'fair', note: 'Cash back posts as you pay your bill.', url: 'https://www.upgrade.com/card/' },
  { name: 'Petal 2 Visa', issuer: 'Petal', short: 'PE', type: 'cashback', base: 1, rates: {}, annualFee: 0, credit: 'fair', note: 'Rises to 1.5% after 12 on-time payments.', url: 'https://www.petalcard.com/' },
  { name: 'Cash Back Visa', issuer: 'Mission Lane', short: 'ML', type: 'cashback', base: 1, rates: {}, annualFee: 59, feeNote: 'some offers are $0', credit: 'fair', note: 'Some offers earn 1.5%.', url: 'https://www.missionlane.com/credit-cards' },

  // Good credit
  { name: 'Blue Cash Preferred', issuer: 'American Express', short: 'AX', type: 'cashback', base: 1, rates: { food: { rate: 6, cap: { amount: 6000, per: 'year' }, note: `${SUPERMARKETS} Restaurants earn 1%.` }, transport: { rate: 3, note: 'Gas stations and transit.' } }, annualFee: 95, feeNote: '$0 the first year', credit: 'good', url: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/' },
  { name: 'Blue Cash Everyday', issuer: 'American Express', short: 'AX', type: 'cashback', base: 1, rates: { food: { rate: 3, cap: { amount: 6000, per: 'year' }, note: SUPERMARKETS }, shopping: { rate: 3, cap: { amount: 6000, per: 'year' }, note: 'US online retail.' }, transport: { rate: 3, cap: { amount: 6000, per: 'year' }, note: 'US gas stations.' } }, annualFee: 0, credit: 'good', url: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/' },
  { name: 'Custom Cash', issuer: 'Citi', short: 'CI', type: 'cashback', base: 1, rates: { food: { rate: 5, cap: { amount: 500, per: 'month' }, note: CUSTOM_CASH }, transport: { rate: 5, cap: { amount: 500, per: 'month' }, needs: 'spend more on gas than on anything else each month' } }, annualFee: 0, credit: 'good', url: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card' },
  { name: 'Savor', issuer: 'Capital One', short: 'C1', type: 'cashback', base: 1, rates: { food: { rate: 3, note: 'Grocery stores and restaurants. Superstores like Walmart and Target don’t count.' } }, annualFee: 0, credit: 'good', inApp: true, url: 'https://www.capitalone.com/credit-cards/savor/' },
  { name: 'Customized Cash Rewards', issuer: 'Bank of America', short: 'BA', type: 'cashback', base: 1, rates: BOFA, annualFee: 0, credit: 'good', url: 'https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/' },
  { name: 'Altitude Go', issuer: 'U.S. Bank', short: 'US', type: 'points', cpp: 1, base: 1, rates: ALTITUDE_GO, annualFee: 0, credit: 'good', url: 'https://www.usbank.com/credit-cards/altitude-go-visa-signature-credit-card.html' },
  { name: 'Cash+', issuer: 'U.S. Bank', short: 'US', type: 'cashback', base: 1, rates: CASH_PLUS, annualFee: 0, credit: 'good', url: 'https://www.usbank.com/credit-cards/cash-plus-visa-signature-credit-card.html' },
  { name: 'Active Cash', issuer: 'Wells Fargo', short: 'WF', type: 'cashback', base: 2, rates: {}, annualFee: 0, credit: 'good', url: 'https://creditcards.wellsfargo.com/active-cash-credit-card/' },
  { name: 'Double Cash', issuer: 'Citi', short: 'CI', type: 'cashback', base: 2, rates: {}, annualFee: 0, credit: 'good', note: '1% when you buy and 1% when you pay.', url: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card' },
  { name: 'Quicksilver', issuer: 'Capital One', short: 'C1', type: 'cashback', base: 1.5, rates: {}, annualFee: 0, credit: 'good', inApp: true, url: 'https://www.capitalone.com/credit-cards/quicksilver/' },
  { name: 'Freedom Unlimited', issuer: 'Chase', short: 'CH', type: 'cashback', base: 1.5, rates: { food: { rate: 1.5, note: '3% at restaurants.' } }, annualFee: 0, credit: 'good', url: 'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited' },
  { name: 'Unlimited Cash Rewards', issuer: 'Bank of America', short: 'BA', type: 'cashback', base: 1.5, rates: {}, annualFee: 0, credit: 'good', url: 'https://www.bankofamerica.com/credit-cards/products/unlimited-cash-back-credit-card/' },
  { name: 'PayPal Cashback Mastercard', issuer: 'PayPal', short: 'PP', type: 'cashback', base: 1.5, rates: { shopping: { rate: 3, needs: 'check out with PayPal' } }, annualFee: 0, credit: 'good', url: 'https://www.paypal.com/us/digital-wallet/manage-money/paypal-cashback-mastercard' },
  { name: 'Freedom Flex', issuer: 'Chase', short: 'CH', type: 'cashback', base: 1, rates: { food: { rate: 1, note: '3% at restaurants. Groceries is sometimes a 5% category for a quarter.' } }, annualFee: 0, credit: 'good', url: 'https://creditcards.chase.com/cash-back-credit-cards/freedom/flex' },
]

// More cards the Kikoff app offers, on top of the popular ones marked inApp above. Its student cards are left out,
// since they're only for students.
const MORE_APP_CARDS: MarketCard[] = [
  { name: 'Platinum Rewards Visa', issuer: 'Credit One', short: 'CO', type: 'cashback', base: 1, rates: { food: { rate: 2, note: 'At grocery stores. Restaurants earn 1%.' }, transport: { rate: 2, note: 'At gas stations.' } }, annualFee: 0, credit: 'fair', inApp: true, url: 'https://www.creditonebank.com/credit-cards/platinum-rewards-visa-no-annual-fee' },
  { name: 'Wander Amex', issuer: 'Credit One', short: 'CO', type: 'points', cpp: 1, base: 1, rates: { food: { rate: 1, note: '5× at restaurants.' }, transport: { rate: 5, note: 'At gas stations.' } }, annualFee: 95, credit: 'fair', inApp: true, url: 'https://www.creditonebank.com/credit-cards/wander-card' },
  { name: 'Aspire Cash Back Rewards', issuer: 'Aspire', short: 'AS', type: 'cashback', base: 1, rates: { food: { rate: 3, note: 'At grocery stores.' }, transport: { rate: 3, note: 'At gas stations.' } }, annualFee: 99, feeNote: 'varies by offer, and a monthly fee starts in year two', credit: 'building', inApp: true, url: 'https://www.aspirecreditcard.com/' },
  { name: 'Fortiva Cash Back Rewards', issuer: 'Fortiva', short: 'FO', type: 'cashback', base: 1, rates: { food: { rate: 3, note: 'At grocery stores.' }, transport: { rate: 3, note: 'At gas stations.' } }, annualFee: 99, feeNote: 'varies by offer, and a monthly fee starts in year two', credit: 'building', inApp: true, url: 'https://www.fortivacreditcard.com/' },
  { name: 'Bilt Mastercard', issuer: 'Bilt', short: 'BI', type: 'points', cpp: 0.55, base: 1, rates: { food: { rate: 1, note: '3× at restaurants, in months with 5 or more purchases.' } }, annualFee: 0, credit: 'good', note: 'Also earns on rent, with no fee.', inApp: true, url: 'https://www.biltrewards.com/card' },
]

const ALL_CARDS = [...MARKET_CARDS, ...MORE_APP_CARDS]
// Food & drink compares only cards in the Kikoff app; shopping and gas compare the popular cards.
const cardsFor = (cat: CategoryId) => (cat === 'food' ? ALL_CARDS.filter((c) => c.inApp) : MARKET_CARDS)

export const fmtRate = (type: Program['type'], rate: number) => (type === 'cashback' ? `${rate}%` : `${rate}×`)
// Whole dollars, for yearly estimates: "$180", "−$12".
export const fmtDollars = (n: number) =>
  `${n < -0.5 ? '−' : ''}${Math.abs(Math.round(n)).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`

// A year of spend at one rate, e.g. "First $6,000 a year at 6%" → $360.
export interface EarnStep {
  label: string
  spend: number
  rate: number
  earned: number // points, or dollars for cashback cards
  value: number // $ (points at their cash value)
}

export interface CardOption {
  key: string
  name: string
  issuer?: string
  short: string
  type: Program['type']
  unit: string
  yours: boolean
  known: boolean // false = your card isn't in the sample rules, estimated at the base rate
  rate: number // the category rate, before any cap
  cpp: number // cash value of a point, in cents (1 for cashback)
  monthlyEarn: number // points a month, or dollars a month for cashback cards (averaged over the year)
  steps: EarnStep[]
  rewards: number // $ a year
  fee: number // annual fee counted against it — 0 for cards you already have
  feeNote?: string
  net: number // rewards − fee
  gain: number // net − your best card's net (or net, when you have no cards)
  deposit?: number
  credit?: CreditTier
  worth: boolean // market cards: adds at least MIN_GAIN a month on today's spending, with nothing else changed
  why?: string // market cards that aren't worth it: the short reason
  whyKind?: WhyKind
  notes: string[]
  url?: string
}

// Why a card isn't worth it. The first three are close calls, worth a line each: it would pay off with an extra step
// or more spending, or it adds a little. 'fee' and 'less' don't come close.
export type WhyKind = 'step' | 'spend' | 'small' | 'fee' | 'less'
const CLOSE_KINDS: WhyKind[] = ['step', 'spend', 'small']
const CLOSE_LIMIT = 3

export interface CardComparison {
  yours: CardOption[] // highest-earning first
  best?: CardOption // the baseline the market cards are measured against
  worth: CardOption[] // market cards for the user's credit that are worth getting, most extra first
  close: CardOption[] // not worth it, but close: up to CLOSE_LIMIT, most extra first
  rest: CardOption[] // every other card that isn't worth it, most extra first
}

// A new card is worth it only when it adds at least this much a month on what the user spends now. Less isn't worth a
// hard credit check, a new bill to track and a new card to carry.
export const MIN_GAIN = 2

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
// A card name as a user might type it, with or without the issuer.
const isCard = (cardName: string, c: MarketCard) => sameName(cardName, c.name) || sameName(cardName, `${c.issuer} ${c.name}`)
// The name people know a card by, issuer first ("Credit One Platinum X5"), unless the name already starts with it.
const BRAND: Record<string, string> = { 'American Express': 'Amex' }
const fullName = (c: MarketCard) => {
  const brand = BRAND[c.issuer] ?? c.issuer
  return c.name.startsWith(brand.split(' ')[0]) ? c.name : `${brand} ${c.name}`
}

// The part of a year of spend that earns a rate's bonus: rotating categories only in their featured months, and only
// up to the cap.
function bonusSpend(yearSpend: number, r: CategoryRate) {
  const months = (r.quarters ?? 4) * 3
  const capYear = r.cap ? r.cap.amount * { month: months, quarter: months / 3, year: 1 }[r.cap.per] : Infinity
  return Math.min((yearSpend * months) / 12, capYear)
}

// $ a year, unrounded, for trying other spend levels. cpp is the cash value per point in cents (1 for cashback).
function yearValue(yearSpend: number, base: number, cpp: number, r?: CategoryRate) {
  if (!r) return (yearSpend * base * cpp) / 100
  const bonus = bonusSpend(yearSpend, r)
  return ((bonus * r.rate + (yearSpend - bonus) * base) * cpp) / 100
}

function earnSteps(yearSpend: number, base: number, type: Program['type'], cpp: number, r?: CategoryRate): EarnStep[] {
  const step = (label: string, spend: number, rate: number): EarnStep => {
    const earned = type === 'cashback' ? cents((spend * rate) / 100) : Math.round(spend * rate)
    return { label, spend, rate, earned, value: type === 'cashback' ? earned : cents((earned * cpp) / 100) }
  }
  const at = (rate: number) => fmtRate(type, rate)
  if (!r) return [step(`${fmtDollars(yearSpend)} at ${at(base)}`, yearSpend, base)]
  if (!r.cap && !r.quarters) return [step(`${fmtDollars(yearSpend)} at ${at(r.rate)}`, yearSpend, r.rate)]
  const bonus = bonusSpend(yearSpend, r)
  const label = r.quarters
    ? `${fmtDollars(bonus)} in its featured ${r.quarters === 1 ? 'quarter' : 'quarters'} at ${at(r.rate)}`
    : bonus < yearSpend
      ? `First ${fmtDollars(r.cap!.amount)} a ${r.cap!.per} at ${at(r.rate)}`
      : `${fmtDollars(yearSpend)} at ${at(r.rate)} (up to ${fmtDollars(r.cap!.amount)} a ${r.cap!.per})`
  const steps = [step(label, bonus, r.rate)]
  if (yearSpend > bonus) steps.push(step(`Then ${fmtDollars(yearSpend - bonus)} at ${at(base)}`, yearSpend - bonus, base))
  return steps
}

// What a year of the user's spend in one category earns on each of their cards, and on market cards for their credit.
// New cards pay their annual fee out of these rewards; fees on cards you have are already paid. Market cards count as
// if the user changed nothing but the card: same stores, same spending, no extra steps like a special way to pay.
export function compareCards(balances: Balance[], cat: CategoryId, credit: CreditTier = CREDIT, spend: Spend = SPEND): CardComparison {
  const monthSpend = spend[cat] ?? 0
  const yearSpend = monthSpend * 12
  const total = (steps: EarnStep[]) => cents(steps.reduce((s, x) => s + x.value, 0))
  const perMonth = (type: Program['type'], steps: EarnStep[]) => {
    const earned = steps.reduce((s, x) => s + x.earned, 0) / 12
    return type === 'cashback' ? cents(earned) : Math.round(earned)
  }

  const earnings = cardEarnings(balances, cat, spend)
  const yours: CardOption[] = earnings
    .map((e) => {
      const cpp = e.program.cpp?.cashback ?? 1
      const steps = earnSteps(yearSpend, e.base, e.program.type, cpp, e.terms)
      const rewards = total(steps)
      return {
        key: `yours-${e.balance.id}`,
        name: e.balance.cardName,
        // Named issuer where the program identifies one, so the card face reads "Discover", not "DI".
        issuer: e.program.supported ? e.program.brand : undefined,
        short: e.program.short,
        type: e.program.type,
        unit: e.program.unit,
        yours: true,
        known: e.known,
        rate: e.rate,
        cpp,
        monthlyEarn: perMonth(e.program.type, steps),
        steps,
        rewards,
        fee: 0,
        net: rewards,
        gain: 0,
        worth: false,
        notes: e.note ? [e.note] : [],
      }
    })
    .sort((a, b) => b.net - a.net)

  const best = yours[0]
  const baseline = best?.net ?? 0
  for (const o of yours) o.gain = cents(o.net - baseline)

  // What the user's best card would earn on another month of spend, for finding where a card starts to be worth it.
  const bestAt = (y: number) =>
    Math.max(0, ...earnings.map((e) => yearValue(y, e.base, e.program.cpp?.cashback ?? 1, e.terms)))
  const worthAt = (m: number, c: MarketCard, r?: CategoryRate) =>
    (yearValue(m * 12, c.base, c.cpp ?? 1, r) - c.annualFee - bestAt(m * 12)) / 12 >= MIN_GAIN
  // The lowest monthly spend, in $5 steps, where a card would be worth it. Undefined past $3,000 a month.
  const breakEven = (c: MarketCard, r?: CategoryRate) => {
    for (let m = 5; m <= 3000; m += 5) if (worthAt(m, c, r)) return m
  }

  const options: CardOption[] = cardsFor(cat).filter(
    (c) =>
      tierRank(c.credit) <= tierRank(credit) &&
      (!c.deposit || credit === 'building') &&
      !balances.some((b) => isCard(b.cardName, c)),
  )
    .map((c) => {
      const r = c.rates[cat]
      // A rate that needs an extra step is counted at the base rate.
      const asIs = r?.needs ? undefined : r
      const steps = earnSteps(yearSpend, c.base, c.type, c.cpp ?? 1, asIs)
      const rewards = total(steps)
      const net = cents(rewards - c.annualFee)
      const gain = cents(net - baseline)
      const worth = gain / 12 >= MIN_GAIN
      const fee = fmtDollars(c.annualFee)
      const at = (rate: number) => fmtRate(c.type, rate)
      const even = c.annualFee > 0 ? breakEven(c, asIs) : undefined

      const whyNot = (): [WhyKind, string] => {
        if (r?.needs && worthAt(monthSpend, c, r)) return ['step', `${at(r.rate)} only if you ${r.needs}`]
        const beatsBefore = rewards > baseline // earns more than your card, until the fee
        if (c.annualFee > 0 && beatsBefore && even && even > monthSpend)
          return ['spend', `Covers the ${fee} fee from ${fmtMoney(even)}+/mo`]
        if (gain > 0) return ['small', `Adds less than ${fmtMoney(MIN_GAIN)}/mo here`]
        if (c.annualFee > 0 && (beatsBefore || !best)) return ['fee', `The ${fee} fee is more than it adds`]
        if (best) return ['less', `Your ${best.name} already earns ${Math.abs(gain) < 0.12 ? 'as much' : 'more'}`]
        return ['less', `Adds less than ${fmtMoney(MIN_GAIN)}/mo here`]
      }
      const [whyKind, why] = worth ? [undefined, undefined] : whyNot()

      const notes = [
        r?.needs && `${at(r.rate)} if you ${r.needs}. Counted at ${at(c.base)}, without the extra step.`,
        r?.note,
        c.note,
        c.deposit && `Needs a refundable deposit of at least ${fmtDollars(c.deposit)}.`,
        worth && even && `Covers the ${fee} fee from ${fmtMoney(even)} a month in ${catName(cat)}. You spend ${fmtMoney(monthSpend)}.`,
      ].filter((n): n is string => !!n)

      return {
        key: `market-${c.name}`,
        name: fullName(c),
        issuer: c.issuer,
        short: c.short,
        type: c.type,
        unit: c.type === 'cashback' ? 'cashback' : 'points',
        yours: false,
        known: true,
        rate: asIs?.rate ?? c.base,
        cpp: c.cpp ?? 1,
        monthlyEarn: perMonth(c.type, steps),
        steps,
        rewards,
        fee: c.annualFee,
        feeNote: c.feeNote,
        net,
        gain,
        deposit: c.deposit,
        credit: c.credit,
        worth,
        why,
        whyKind,
        notes,
        url: c.url,
      }
    })
    .sort((a, b) => b.net - a.net)

  // Two cards from one issuer with the same fee that earn about the same are one choice, not two: list one (cash back
  // over points, it's simpler) and name the other in its notes.
  const worth: CardOption[] = []
  for (const o of options.filter((o) => o.worth)) {
    const i = worth.findIndex((w) => w.issuer === o.issuer && w.fee === o.fee && Math.abs(w.net - o.net) < 1)
    if (i < 0) {
      worth.push(o)
      continue
    }
    const [keep, drop] = worth[i].type !== 'cashback' && o.type === 'cashback' ? [o, worth[i]] : [worth[i], o]
    keep.notes.push(`The ${drop.name} earns about the same, as ${drop.type === 'cashback' ? 'cashback' : 'points'}.`)
    worth[i] = keep
  }

  const skip = options.filter((o) => !o.worth)
  const close = skip.filter((o) => CLOSE_KINDS.includes(o.whyKind!)).slice(0, CLOSE_LIMIT)
  return { yours, best, worth, close, rest: skip.filter((o) => !close.includes(o)) }
}

// ---- Score goal: cards one credit tier up ----

export interface ScoreGoal {
  score: number // the next tier's lowest score
  from: number // where the user's tier starts, for a progress bar
  toGo: number
  best?: CardOption // the user's best card in the category, what the extra is measured against
  cards: CardOption[] // most extra first
}

// Cards usually made for the next credit tier that would earn more on this category than any card for the user's
// tier today, counted the same way: today's spending, nothing else changed. Null at the top tier.
export function scoreGoal(balances: Balance[], cat: CategoryId, score = CREDIT_SCORE, spend: Spend = SPEND): ScoreGoal | null {
  const now = CREDIT_TIERS[tierRank(tierFor(score))]
  const next = CREDIT_TIERS[tierRank(now.id) + 1]
  if (!next) return null
  const today = compareCards(balances, cat, now.id, spend)
  const bar = Math.max(today.best?.net ?? 0, ...today.worth.map((o) => o.net))
  const cards = compareCards(balances, cat, next.id, spend).worth.filter((o) => o.credit === next.id && o.net > bar)
  return { score: next.min, from: now.min, toGo: next.min - score, best: today.best, cards }
}

// ---- Annual-fee filter ----
// Shared by Home's hero and Card Coach so the chips mean the same thing on both.
export const feeFilters = [
  { value: 'all', label: 'All cards' },
  { value: 'none', label: 'No annual fee' },
  { value: 'paid', label: 'Annual fee' },
] as const
export type FeeFilter = typeof feeFilters[number]['value']
// Whether a card belongs under the current filter. Cards the user already holds are never filtered out: their fee
// isn't the question being asked, and dropping them would empty the column showing what they earn today.
export const passesFee = (o: CardOption, f: FeeFilter) =>
  o.yours || f === 'all' || (f === 'none' ? o.fee === 0 : o.fee > 0)

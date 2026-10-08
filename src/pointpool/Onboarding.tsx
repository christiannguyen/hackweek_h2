import { useEffect, useState } from 'react'
import {
  LuArrowLeft,
  LuCheck,
  LuCreditCard,
  LuEye,
  LuEyeOff,
  LuGift,
  LuGraduationCap,
  LuHeartHandshake,
  LuHotel,
  LuLandmark,
  LuLock,
  LuPlane,
  LuSearch,
  LuShoppingBag,
  LuShoppingCart,
  LuTicket,
  LuUtensils,
  LuWallet,
  LuZap,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { balanceUses, fmtMoney, PROGRAMS, type Balance, type ProgramId } from './data'
import { markOnboarded } from './useBalances'
import styles from './onboarding.module.css'

// SIMULATED onboarding for the prototype: no account is created and nothing leaves the browser. The email and
// password are only checked for shape and never stored.

// Cards users can pick, each tied to the rewards program its balance is kept in.
// Illustrated card faces in each card's signature colors (not issuer artwork).
interface CardFace { bg: string; ink: string }
const CATALOG: { name: string; issuer: string; programId: ProgramId; face: CardFace }[] = [
  { name: 'Discover it Secured', issuer: 'Discover', programId: 'discover', face: { bg: 'linear-gradient(135deg, #ff9a3d, #e8590c)', ink: '#fff' } },
  { name: 'Discover it', issuer: 'Discover', programId: 'discover', face: { bg: 'linear-gradient(135deg, #f4f4f2, #c9cbc7)', ink: '#e8590c' } },
  { name: 'Credit One Platinum Visa', issuer: 'Credit One', programId: 'creditone', face: { bg: 'linear-gradient(135deg, #e6e8ec, #a9afb9)', ink: '#1f3a6e' } },
  { name: 'Credit One Platinum Rewards Visa', issuer: 'Credit One', programId: 'creditone', face: { bg: 'linear-gradient(135deg, #2b4c8c, #0f1f45)', ink: '#fff' } },
  { name: 'Sapphire Preferred', issuer: 'Chase', programId: 'chase_ur', face: { bg: 'linear-gradient(135deg, #2a5ea8, #0b2350)', ink: '#fff' } },
  { name: 'Freedom Unlimited', issuer: 'Chase', programId: 'chase_ur', face: { bg: 'linear-gradient(135deg, #3d8fe0, #1257a8)', ink: '#fff' } },
  { name: 'Amex Gold', issuer: 'American Express', programId: 'amex_mr', face: { bg: 'linear-gradient(135deg, #f1d58a, #b8893a)', ink: '#3b2a0c' } },
  { name: 'Citi Premier', issuer: 'Citi', programId: 'citi_typ', face: { bg: 'linear-gradient(135deg, #3a4a63, #121a29)', ink: '#fff' } },
  { name: 'Venture', issuer: 'Capital One', programId: 'capone', face: { bg: 'linear-gradient(135deg, #4a5566, #1b2230)', ink: '#fff' } },
]
const OTHER_FACE: CardFace = { bg: 'linear-gradient(135deg, #eef0ec, #cfd4ca)', ink: '#4a4f47' }
const faceFor = (name: string) => CATALOG.find((c) => c.name === name)

function CardArt({ name }: { name: string }) {
  const c = faceFor(name)
  const face = c?.face ?? OTHER_FACE
  return (
    <span className={styles.cardArt} style={{ background: face.bg, color: face.ink }} aria-hidden="true">
      <span className={styles.cardIssuer}>{c?.issuer ?? 'Card'}</span>
      <span className={styles.cardChip} />
    </span>
  )
}

// Places rewards could go. Each maps to the use whose estimate it reads from: `points` for points cards, `cash` for
// cashback cards (cashback has no travel or gift-card rate, so most read as a statement credit).
type UseId = 'travel' | 'everyday' | 'cashback' | 'deposit' | 'checkout'
interface GoalOption { id: string; label: string; sub: string; icon: IconType; points: UseId; cash: UseId; phrase: string }
const GOAL_OPTIONS: GoalOption[] = [
  { id: 'flights', label: 'Flights', sub: 'Book with points', icon: LuPlane, points: 'travel', cash: 'cashback', phrase: 'toward flights' },
  { id: 'hotels', label: 'Hotels', sub: 'Stays and resorts', icon: LuHotel, points: 'travel', cash: 'cashback', phrase: 'toward hotels' },
  { id: 'dining', label: 'Dining out', sub: 'Restaurant gift cards', icon: LuUtensils, points: 'everyday', cash: 'cashback', phrase: 'toward dining out' },
  { id: 'groceries', label: 'Groceries', sub: 'Offset the grocery bill', icon: LuShoppingCart, points: 'cashback', cash: 'cashback', phrase: 'toward groceries' },
  { id: 'shopping', label: 'Online shopping', sub: 'Pay at checkout', icon: LuShoppingBag, points: 'everyday', cash: 'checkout', phrase: 'at checkout online' },
  { id: 'gift', label: 'Gift cards', sub: 'For you or others', icon: LuGift, points: 'everyday', cash: 'cashback', phrase: 'in gift cards' },
  { id: 'events', label: 'Experiences', sub: 'Concerts and events', icon: LuTicket, points: 'everyday', cash: 'cashback', phrase: 'toward experiences' },
  { id: 'bill', label: 'My card bill', sub: 'A statement credit', icon: LuCreditCard, points: 'cashback', cash: 'cashback', phrase: 'off your card bill' },
  { id: 'bank', label: 'Cash to my bank', sub: 'A direct deposit', icon: LuLandmark, points: 'cashback', cash: 'deposit', phrase: 'as a bank deposit' },
  { id: 'charity', label: 'Charity', sub: 'Donate your rewards', icon: LuHeartHandshake, points: 'cashback', cash: 'cashback', phrase: 'to charity' },
]

type Step = 'welcome' | 'account' | 'cards' | 'balances' | 'goal' | 'setup' | 'done'
const PROGRESS: Step[] = ['account', 'cards', 'balances', 'goal']

interface Picked {
  key: string
  name: string
  programId: ProgramId
  amount: string
}

// A typed balance as saved: never negative, whole points, cashback to the cent. Blank or invalid reads as 0.
const cleanAmount = (p: Picked) => {
  const n = Number(p.amount)
  if (!Number.isFinite(n) || n < 0) return 0
  return PROGRAMS[p.programId].type === 'cashback' ? Math.round(n * 100) / 100 : Math.round(n)
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

export function Onboarding({ onFinish }: { onFinish: (cards: Omit<Balance, 'id' | 'updatedAt'>[]) => void }) {
  const [step, setStep] = useState<Step>('welcome')
  const [picked, setPicked] = useState<Picked[]>([])
  const [goals, setGoals] = useState<string[]>([])

  const go = (s: Step) => {
    setStep(s)
    window.scrollTo(0, 0)
  }
  const back: Partial<Record<Step, Step>> = { account: 'welcome', cards: 'account', balances: 'cards', goal: 'balances' }

  // A short "setting up" beat before the summary.
  useEffect(() => {
    if (step !== 'setup') return
    const t = setTimeout(() => go('done'), 1600)
    return () => clearTimeout(t)
  }, [step])

  const finish = () => {
    markOnboarded()
    onFinish(picked.map((p) => ({ programId: p.programId, cardName: p.name, amount: cleanAmount(p) })))
  }

  const stepIndex = PROGRESS.indexOf(step)

  return (
    <div className={styles.backdrop}>
      <div className={`${styles.phone} ${step === 'welcome' ? styles.dark : ''}`}>
        {stepIndex >= 0 && (
          <header className={styles.top}>
            <button className={styles.backBtn} onClick={() => go(back[step]!)} aria-label="Back">
              <LuArrowLeft />
            </button>
            <div className={styles.progress} aria-label={`Step ${stepIndex + 1} of ${PROGRESS.length}`}>
              {PROGRESS.map((s, i) => (
                <span key={s} className={i <= stepIndex ? styles.on : ''} />
              ))}
            </div>
          </header>
        )}

        {step === 'welcome' && <Welcome onStart={() => go('account')} onLogin={() => go('cards')} />}
        {step === 'account' && <Account onNext={() => go('cards')} />}
        {step === 'cards' && <Cards picked={picked} setPicked={setPicked} onNext={() => go('balances')} />}
        {step === 'balances' && <Balances picked={picked} setPicked={setPicked} onNext={() => go('goal')} />}
        {step === 'goal' && <Goal goals={goals} setGoals={setGoals} onNext={() => go('setup')} />}
        {step === 'setup' && <Setup />}
        {step === 'done' && <Done picked={picked} goals={goals} onFinish={finish} />}
      </div>
    </div>
  )
}

function Logo({ light }: { light?: boolean }) {
  return (
    <div className={`${styles.logo} ${light ? styles.logoLight : ''}`}>
      <img src="/favicon.svg" alt="" width="38" height="38" />
      pointpool
    </div>
  )
}

function Welcome({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const perks = [
    { icon: LuWallet, title: 'One place', text: 'See every card’s rewards side by side.' },
    { icon: LuGraduationCap, title: 'Card Coach', text: 'What your spending could earn on each card.' },
    { icon: LuZap, title: 'Fast', text: 'Set up in about a minute. No bank login.' },
    { icon: LuLock, title: 'Private', text: 'Balances stay in this browser.' },
  ]
  return (
    <div className={styles.welcome}>
      {/* The logo's scene: a dark sky, the p's bowl, and a pool the cards float in. */}
      <div className={styles.bowl} aria-hidden="true" />
      <Logo light />
      <h1 className={styles.welcomeTitle}>
        Make the most of your <em>card rewards</em>
      </h1>
      <div className={styles.perks}>
        <Pool />
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className={styles.perk}>
            <Icon className={styles.perkIcon} aria-hidden="true" />
            <b>{title}</b>
            <span>{text}</span>
          </div>
        ))}
      </div>
      <div className={styles.welcomeFoot}>
        <button className={styles.primary} onClick={onStart}>Get started</button>
        <p className={styles.welcomeLogin}>
          Already have an account? <button onClick={onLogin}>Log in here</button>
        </p>
      </div>
    </div>
  )
}

// One wave period every 200 units; the SVG is two periods wide and slides one period, so the loop is seamless.
const WAVE = 'M0 20 Q50 6 100 20 T200 20 T300 20 T400 20 V40 H0 Z'
const SURFACE = 'M0 20 Q50 6 100 20 T200 20 T300 20 T400 20'

function Pool() {
  return (
    <div className={styles.pool} aria-hidden="true">
      <svg className={`${styles.wave} ${styles.waveBack}`} viewBox="0 0 400 40" preserveAspectRatio="none">
        <path d={WAVE} />
      </svg>
      <svg className={styles.wave} viewBox="0 0 400 40" preserveAspectRatio="none">
        <path d={WAVE} />
        <path className={styles.surface} d={SURFACE} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={styles.water} />
    </div>
  )
}

function Account({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })

  const emailError = !email.trim() ? 'Email is required' : !isEmail(email) ? 'Enter a valid email' : ''
  const passwordError = password.length < 8 ? 'Use at least 8 characters' : ''
  const valid = !emailError && !passwordError

  return (
    <div className={styles.body}>
      <Logo />
      <div className={styles.banner}>
        <b>💰 Rewards, made simple</b>
        <span>See what your points and cashback could cover, all in one place.</span>
      </div>
      <h1 className={styles.title}>Create your account</h1>

      <label className={`${styles.field} ${touched.email && emailError ? styles.fieldError : ''}`}>
        <span>Email <i>*</i></span>
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        />
      </label>
      {touched.email && emailError && <p className={styles.error}>{emailError}</p>}

      <label className={`${styles.field} ${touched.password && passwordError ? styles.fieldError : ''}`}>
        <span>Password <i>*</i></span>
        <input
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        />
        <button type="button" className={styles.eye} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <LuEyeOff /> : <LuEye />}
        </button>
      </label>
      {touched.password && passwordError && <p className={styles.error}>{passwordError}</p>}

      <p className={styles.fine}>
        Demo only: no account is created and nothing you type is saved or sent.
      </p>

      <div className={styles.footer}>
        <button className={styles.primary} disabled={!valid} onClick={onNext}>Sign up</button>
      </div>
    </div>
  )
}

function Cards({ picked, setPicked, onNext }: { picked: Picked[]; setPicked: (p: Picked[]) => void; onNext: () => void }) {
  const [query, setQuery] = useState('')
  const [other, setOther] = useState('')
  const q = query.trim().toLowerCase()
  const shown = CATALOG.filter((c) => !q || `${c.issuer} ${c.name}`.toLowerCase().includes(q))
  const has = (key: string) => picked.some((p) => p.key === key)

  const toggle = (c: (typeof CATALOG)[number]) =>
    setPicked(has(c.name) ? picked.filter((p) => p.key !== c.name) : [...picked, { key: c.name, name: c.name, programId: c.programId, amount: '' }])

  const addOther = () => {
    const name = other.trim()
    if (!name || has(name)) return
    setPicked([...picked, { key: name, name, programId: 'other', amount: '' }])
    setOther('')
  }

  return (
    <div className={styles.body}>
      <h1 className={styles.title}>Which cards do you have?</h1>
      <p className={styles.sub}>Pick all that apply. You can add or remove cards later.</p>

      <label className={styles.search}>
        <LuSearch aria-hidden="true" />
        <input placeholder="Search cards" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
      </label>

      <div className={styles.list}>
        {shown.map((c) => {
          const on = has(c.name)
          return (
            <button key={c.name} className={`${styles.option} ${on ? styles.selected : ''}`} onClick={() => toggle(c)} aria-pressed={on}>
              <CardArt name={c.name} />
              <span className={styles.optMain}>
                <b>{c.name}</b>
                <span>{c.issuer}</span>
              </span>
              <span className={styles.check}>{on && <LuCheck />}</span>
            </button>
          )
        })}
        {shown.length === 0 && <p className={styles.sub}>No match. Add it below.</p>}
        {picked.filter((p) => p.programId === 'other').map((p) => (
          <button key={p.key} className={`${styles.option} ${styles.selected}`} onClick={() => setPicked(picked.filter((x) => x.key !== p.key))} aria-pressed>
            <CardArt name={p.name} />
            <span className={styles.optMain}><b>{p.name}</b><span>Other card</span></span>
            <span className={styles.check}><LuCheck /></span>
          </button>
        ))}
      </div>

      <div className={styles.otherRow}>
        <input placeholder="Don’t see yours? Type the card name" value={other} onChange={(e) => setOther(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && addOther()} />
        <button onClick={addOther} disabled={!other.trim()}>Add</button>
      </div>

      <div className={styles.footer}>
        <button className={styles.primary} disabled={picked.length === 0} onClick={onNext}>
          {picked.length === 0 ? 'Pick at least one card' : `Continue with ${picked.length} card${picked.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

function Balances({ picked, setPicked, onNext }: { picked: Picked[]; setPicked: (p: Picked[]) => void; onNext: () => void }) {
  const set = (key: string, amount: string) => setPicked(picked.map((p) => (p.key === key ? { ...p, amount } : p)))
  return (
    <div className={styles.body}>
      <h1 className={styles.title}>What’s in each rewards balance?</h1>
      <p className={styles.sub}>Find it in your card’s app. Leave it blank if you’re not sure. You can update it anytime.</p>
      <div className={styles.list}>
        {picked.map((p) => {
          const cash = PROGRAMS[p.programId].type === 'cashback'
          return (
            <label key={p.key} className={styles.balanceRow}>
              <CardArt name={p.name} />
              <span className={styles.optMain}>
                <b>{p.name}</b>
                <span>{cash ? 'Cashback ($)' : PROGRAMS[p.programId].unit === 'miles' ? 'Miles' : 'Points'}</span>
              </span>
              <span className={styles.amount}>
                {cash && <em>$</em>}
                <input type="number" inputMode="decimal" min={0} step={cash ? 0.01 : 1} placeholder={cash ? '0.00' : '0'} value={p.amount} onChange={(e) => set(p.key, e.currentTarget.value)} />
              </span>
            </label>
          )
        })}
      </div>
      <p className={styles.fine}>Saved privately in this browser. No bank connection needed.</p>
      <div className={styles.footer}>
        <button className={styles.primary} onClick={onNext}>Continue</button>
      </div>
    </div>
  )
}

function Goal({ goals, setGoals, onNext }: { goals: string[]; setGoals: (g: string[]) => void; onNext: () => void }) {
  const toggle = (id: string) => setGoals(goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id])
  return (
    <div className={styles.body}>
      <h1 className={styles.title}>Where would you like your rewards to go?</h1>
      <p className={styles.sub}>Pick as many as you like. We’ll show what your balances could cover there. Every option stays one tap away.</p>
      <div className={styles.goalGrid}>
        {GOAL_OPTIONS.map(({ id, label, sub, icon: Icon }) => {
          const on = goals.includes(id)
          return (
            <button key={id} className={`${styles.goalTile} ${on ? styles.selected : ''}`} onClick={() => toggle(id)} aria-pressed={on}>
              <span className={styles.goalTop}>
                <span className={styles.optIcon}><Icon /></span>
                <span className={styles.check}>{on && <LuCheck />}</span>
              </span>
              <b>{label}</b>
              <span>{sub}</span>
            </button>
          )
        })}
      </div>
      <div className={styles.footer}>
        <button className={styles.primary} disabled={goals.length === 0} onClick={onNext}>
          {goals.length === 0 ? 'Pick at least one' : 'Continue'}
        </button>
        <button className={styles.ghost} onClick={() => { setGoals([]); onNext() }}>Not sure yet</button>
      </div>
    </div>
  )
}

function Setup() {
  return (
    <div className={`${styles.body} ${styles.center}`}>
      <div className={styles.spinner} aria-hidden="true" />
      <h1 className={styles.title}>Setting up your Pointpool…</h1>
      <p className={styles.sub}>Matching your cards with your spending.</p>
    </div>
  )
}

function Done({ picked, goals, onFinish }: { picked: Picked[]; goals: string[]; onFinish: () => void }) {
  // Up to two of the user's picks per card ("Not sure yet" shows a statement credit), side by side, no ranking.
  const chosen = GOAL_OPTIONS.filter((o) => goals.includes(o.id))
  return (
    <div className={styles.body}>
      <div className={styles.doneBadge}><LuCheck /></div>
      <h1 className={styles.title}>You’re all set</h1>
      <p className={styles.sub}>Here’s what each balance could look like. Each program’s rewards are used within that program.</p>
      <div className={styles.list}>
        {picked.map((p) => {
          const b: Balance = { id: 0, programId: p.programId, cardName: p.name, amount: cleanAmount(p), updatedAt: '' }
          const uses = balanceUses(b)
          const cash = PROGRAMS[p.programId].type === 'cashback'
          // One line per way of using the balance: two picks that read from the same use (flights and hotels are both
          // travel) would just repeat the same number. Cashback is exact, so it gets no "≈".
          const seen = new Set<string>()
          const parts = (chosen.length ? chosen : [GOAL_OPTIONS.find((o) => o.id === 'bill')!])
            .map((o) => {
              const use = uses.find((u) => u.id === (cash ? o.cash : o.points))
              if (!use || seen.has(use.id)) return null
              seen.add(use.id)
              return `${cash ? '' : '≈'}${fmtMoney(use.value)} ${o.phrase}`
            })
            .filter(Boolean)
            .slice(0, 2)
          const line = !(b.amount > 0)
            ? 'Add a balance to see where it could go'
            : parts.length
              ? `Could be ${parts.join(' or ')}`
              : 'Estimates coming soon'
          return (
            <div key={p.key} className={styles.balanceRow}>
              <CardArt name={p.name} />
              <span className={styles.optMain}><b>{p.name}</b><span>{line}</span></span>
            </div>
          )
        })}
      </div>
      <p className={styles.fine}>Estimates only, based on illustrative rates.</p>
      <div className={styles.footer}>
        <button className={styles.primary} onClick={onFinish}>Go to my Pointpool</button>
      </div>
    </div>
  )
}

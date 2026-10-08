import { useEffect, useState } from 'react'
import {
  LuArrowLeft,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuGraduationCap,
  LuLock,
  LuPlane,
  LuSearch,
  LuShoppingBag,
  LuWallet,
  LuZap,
} from 'react-icons/lu'
import { balanceUses, fmtMoney, PROGRAMS, type Balance, type GoalId, type ProgramId } from './data'
import { markOnboarded } from './useBalances'
import styles from './onboarding.module.css'

// SIMULATED onboarding for the prototype: no account is created and nothing leaves the browser. The email and
// password are only checked for shape and never stored.

// Cards users can pick, each tied to the rewards program its balance is kept in.
const CATALOG: { name: string; issuer: string; programId: ProgramId }[] = [
  { name: 'Discover it Secured', issuer: 'Discover', programId: 'discover' },
  { name: 'Discover it', issuer: 'Discover', programId: 'discover' },
  { name: 'Credit One Platinum Visa', issuer: 'Credit One', programId: 'creditone' },
  { name: 'Credit One Platinum Rewards Visa', issuer: 'Credit One', programId: 'creditone' },
  { name: 'Sapphire Preferred', issuer: 'Chase', programId: 'chase_ur' },
  { name: 'Freedom Unlimited', issuer: 'Chase', programId: 'chase_ur' },
  { name: 'Amex Gold', issuer: 'American Express', programId: 'amex_mr' },
  { name: 'Citi Premier', issuer: 'Citi', programId: 'citi_typ' },
  { name: 'Venture', issuer: 'Capital One', programId: 'capone' },
]

const GOAL_OPTIONS: { id: GoalId; label: string; sub: string; icon: typeof LuPlane }[] = [
  { id: 'travel', label: 'Travel', sub: 'Flights and hotels', icon: LuPlane },
  { id: 'everyday', label: 'Everyday buys', sub: 'Gift cards and shopping', icon: LuShoppingBag },
  { id: 'cashback', label: 'Cash', sub: 'A statement credit or deposit', icon: LuWallet },
]

type Step = 'welcome' | 'account' | 'cards' | 'balances' | 'goal' | 'setup' | 'done'
const PROGRESS: Step[] = ['account', 'cards', 'balances', 'goal']

interface Picked {
  key: string
  name: string
  programId: ProgramId
  amount: string
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

export function Onboarding({ onFinish }: { onFinish: (cards: Omit<Balance, 'id' | 'updatedAt'>[]) => void }) {
  const [step, setStep] = useState<Step>('welcome')
  const [picked, setPicked] = useState<Picked[]>([])
  const [goal, setGoal] = useState<GoalId>()

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
    onFinish(picked.map((p) => ({ programId: p.programId, cardName: p.name, amount: Number(p.amount) || 0 })))
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
        {step === 'goal' && <Goal goal={goal} setGoal={setGoal} onNext={() => go('setup')} />}
        {step === 'setup' && <Setup />}
        {step === 'done' && <Done picked={picked} goal={goal} onFinish={finish} />}
      </div>
    </div>
  )
}

function Logo({ light }: { light?: boolean }) {
  return (
    <div className={`${styles.logo} ${light ? styles.logoLight : ''}`}>
      <span className={styles.logoMark}>K</span>
      Kikoff
      <span className={styles.logoPlus}>× pointpool</span>
    </div>
  )
}

function Welcome({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const perks = [
    { icon: LuWallet, title: 'One place', text: 'See every card’s rewards side by side.' },
    { icon: LuGraduationCap, title: 'Compare cards', text: 'What your spending could earn on each card.' },
    { icon: LuZap, title: 'Fast', text: 'Set up in about a minute. No bank login.' },
    { icon: LuLock, title: 'Private', text: 'Balances stay in this browser.' },
  ]
  return (
    <div className={styles.welcome}>
      <Logo light />
      <h1 className={styles.welcomeTitle}>Make the most of your card rewards</h1>
      <div className={styles.perks}>
        <div className={styles.chevron} aria-hidden="true" />
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
              <span className={styles.optIcon}>{PROGRAMS[c.programId].short}</span>
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
            <span className={styles.optIcon}>?</span>
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
              <span className={styles.optIcon}>{PROGRAMS[p.programId].short}</span>
              <span className={styles.optMain}>
                <b>{p.name}</b>
                <span>{cash ? 'Cashback ($)' : PROGRAMS[p.programId].unit === 'miles' ? 'Miles' : 'Points'}</span>
              </span>
              <span className={styles.amount}>
                {cash && <em>$</em>}
                <input type="number" inputMode="decimal" min={0} placeholder={cash ? '0.00' : '0'} value={p.amount} onChange={(e) => set(p.key, e.currentTarget.value)} />
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

function Goal({ goal, setGoal, onNext }: { goal?: GoalId; setGoal: (g: GoalId) => void; onNext: () => void }) {
  return (
    <div className={styles.body}>
      <h1 className={styles.title}>Where would you like your rewards to go?</h1>
      <p className={styles.sub}>We’ll show what your balances could cover there first. Every option stays one tap away.</p>
      <div className={styles.list}>
        {GOAL_OPTIONS.map(({ id, label, sub, icon: Icon }) => (
          <button key={id} className={`${styles.option} ${goal === id ? styles.selected : ''}`} onClick={() => setGoal(id)} aria-pressed={goal === id}>
            <span className={styles.optIcon}><Icon /></span>
            <span className={styles.optMain}><b>{label}</b><span>{sub}</span></span>
            <span className={styles.check}>{goal === id && <LuCheck />}</span>
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <button className={styles.primary} disabled={!goal} onClick={onNext}>Continue</button>
        <button className={styles.ghost} onClick={() => { setGoal('cashback'); onNext() }}>Not sure yet</button>
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

function Done({ picked, goal, onFinish }: { picked: Picked[]; goal?: GoalId; onFinish: () => void }) {
  const labels: Record<string, string> = { travel: 'in travel', everyday: 'in gift cards', cashback: 'as a statement credit' }
  return (
    <div className={styles.body}>
      <div className={styles.doneBadge}><LuCheck /></div>
      <h1 className={styles.title}>You’re all set</h1>
      <p className={styles.sub}>Here’s what each balance could look like. Each program’s rewards are used within that program.</p>
      <div className={styles.list}>
        {picked.map((p) => {
          const b: Balance = { id: 0, programId: p.programId, cardName: p.name, amount: Number(p.amount) || 0, updatedAt: '' }
          const uses = balanceUses(b)
          // Cashback has no travel or gift-card rate of its own, so it reads as a statement credit.
          const use = uses.find((u) => u.id === goal) ?? uses.find((u) => u.id === 'cashback')
          const line = !(b.amount > 0)
            ? 'Add a balance to see where it could go'
            : use
              ? `Could be ≈${fmtMoney(use.value)} ${labels[use.id]}`
              : 'Estimates coming soon'
          return (
            <div key={p.key} className={styles.balanceRow}>
              <span className={styles.optIcon}>{PROGRAMS[p.programId].short}</span>
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

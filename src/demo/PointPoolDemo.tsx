import { useState } from 'react'
import {
  LuBatteryFull,
  LuCamera,
  LuChevronLeft,
  LuChevronRight,
  LuClock,
  LuCloudSun,
  LuFuel,
  LuImage,
  LuMail,
  LuMap,
  LuMusic,
  LuNotebookPen,
  LuPhone,
  LuSettings,
  LuShoppingCart,
  LuUtensils,
  LuWifi,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import styles from './demo.module.css'

// SCRIPTED DEMO for the hackweek presentation: a phone home screen with PointPool widgets, the app, and the
// "Is there a better card for you?" comparison. Every name and number is made up for the demo.

type CategoryId = 'dining' | 'groceries' | 'gas'

interface DemoCard {
  network: 'Visa' | 'Mastercard'
  name: string
  last4: string
  rateLabel: string // "1.5% back on everything"
  rate: number // % back in this category
  fee: number
  face: string // card face background
}

const EVERYDAY: DemoCard = { network: 'Mastercard', name: 'Everyday Flat Cash', last4: '2210', rateLabel: '1.5% back on everything', rate: 1.5, fee: 0, face: 'linear-gradient(135deg, #3b4252, #1c2029)' }

interface CategoryDemo {
  id: CategoryId
  label: string
  noun: string
  icon: IconType
  yearSpend: number
  thisMonth: number // cash back this month, for the widget and app
  yours: DemoCard[] // empty = no card yet
  suggested: DemoCard
  note?: string // extra line after the takeaway
}

const CATEGORIES: CategoryDemo[] = [
  {
    id: 'dining',
    label: 'Dining',
    noun: 'dining',
    icon: LuUtensils,
    yearSpend: 5832,
    thisMonth: 19.44,
    // "Your cards 1/3": the spec shows the first; the other two are added so tapping cycles through three.
    yours: [
      EVERYDAY,
      { network: 'Visa', name: 'Campus Starter', last4: '5590', rateLabel: '1% back on everything', rate: 1, fee: 0, face: 'linear-gradient(135deg, #6d4bd1, #3a2585)' },
      { network: 'Mastercard', name: 'Metro Rewards', last4: '3317', rateLabel: '2% back on dining', rate: 2, fee: 0, face: 'linear-gradient(135deg, #5c6470, #2a2f36)' },
    ],
    suggested: { network: 'Visa', name: 'Harbor Dining Rewards', last4: '4821', rateLabel: '4% back on dining', rate: 4, fee: 95, face: 'linear-gradient(135deg, #1f6f8b, #0b3a52)' },
  },
  {
    id: 'groceries',
    label: 'Groceries',
    noun: 'groceries',
    icon: LuShoppingCart,
    yearSpend: 4944,
    thisMonth: 16.48,
    yours: [EVERYDAY],
    suggested: { network: 'Visa', name: 'Pantry Plus Cash', last4: '7733', rateLabel: '6% back at supermarkets', rate: 6, fee: 0, face: 'linear-gradient(135deg, #3fae5a, #1d6b34)' },
    note: 'The 6% cap of $6,000 covers your full spend.',
  },
  {
    id: 'gas',
    label: 'Gas',
    noun: 'gas',
    icon: LuFuel,
    yearSpend: 2376,
    thisMonth: 6.88,
    yours: [],
    suggested: { network: 'Mastercard', name: 'Roadway Fuel Rewards', last4: '9054', rateLabel: '3% back at the pump', rate: 3, fee: 0, face: 'linear-gradient(135deg, #f08a3c, #b4461b)' },
  },
]

const THIS_MONTH = 42.8
const VS_LAST_MONTH = 12.1
const MISSED = 25.75
const RECENT = [
  { merchant: 'Harbor Grill', amount: 64.2, back: 0.96 },
  { merchant: 'Greenmart', amount: 118.44, back: 1.78 },
  { merchant: 'Route 9 Fuel', amount: 52.1, back: 0.78 },
  { merchant: 'Noodle House', amount: 31.0, back: 0.47 },
]

const usd = (n: number, cents = true) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })
const rewards = (c: DemoCard, spend: number) => Math.round((spend * c.rate) / 100)
const net = (c: DemoCard, spend: number) => rewards(c, spend) - c.fee

type Screen = { name: 'home' } | { name: 'app' } | { name: 'compare'; category: CategoryId }

export function PointPoolDemo() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  return (
    <div className={styles.stage}>
      <p className={styles.caption}>Interactive demo. Tap the PointPool icon or a widget, then a spending category. Swipe-back is the ‹ button.</p>
      <div className={styles.phone}>
        <StatusBar dark={screen.name === 'home'} />
        {screen.name === 'home' && <Home onOpen={() => setScreen({ name: 'app' })} />}
        {screen.name === 'app' && (
          <AppScreen onBack={() => setScreen({ name: 'home' })} onCategory={(category) => setScreen({ name: 'compare', category })} />
        )}
        {screen.name === 'compare' && (
          <Compare
            category={screen.category}
            onCategory={(category) => setScreen({ name: 'compare', category })}
            onBack={() => setScreen({ name: 'app' })}
          />
        )}
        <div className={styles.homeIndicator} />
      </div>
    </div>
  )
}

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={`${styles.status} ${dark ? styles.statusLight : ''}`}>
      <span>9:41</span>
      <span className={styles.statusIcons} aria-hidden="true">
        <span className={styles.signal}><i /><i /><i /></span>
        <LuWifi />
        <LuBatteryFull />
      </span>
    </div>
  )
}

// ---- Home screen ----

const APPS: { label: string; icon: IconType; bg: string }[] = [
  { label: 'Camera', icon: LuCamera, bg: 'linear-gradient(#8e8e93, #5a5a5e)' },
  { label: 'Maps', icon: LuMap, bg: 'linear-gradient(#5ac46a, #2f9e6b)' },
  { label: 'Mail', icon: LuMail, bg: 'linear-gradient(#4aa8ff, #1a6ff0)' },
  { label: 'Clock', icon: LuClock, bg: 'linear-gradient(#2c2c2e, #111)' },
  { label: 'Photos', icon: LuImage, bg: 'linear-gradient(#fff, #f0f0f0)' },
  { label: 'Settings', icon: LuSettings, bg: 'linear-gradient(#9a9aa0, #6b6b70)' },
  { label: 'Notes', icon: LuNotebookPen, bg: 'linear-gradient(#ffe066, #f5c400)' },
]
const DOCK: { label: string; icon: IconType; bg: string }[] = [
  { label: 'Dial', icon: LuPhone, bg: 'linear-gradient(#5ee36f, #27b53d)' },
  { label: 'Tunes', icon: LuMusic, bg: 'linear-gradient(#ff6b81, #f0254d)' },
]

function Home({ onOpen }: { onOpen: () => void }) {
  return (
    <div className={styles.home}>
      <div className={styles.widgetRow}>
        <div className={styles.widgetCell}>
          <button className={`${styles.widget} ${styles.widgetSmall}`} onClick={onOpen} aria-label="Open PointPool">
            <span className={styles.widgetBrand}><img src="/favicon.svg" alt="" />PointPool</span>
            <b className={styles.widgetBig}>{usd(THIS_MONTH)}</b>
            <span className={styles.widgetSub}>cash back this month</span>
            <span className={styles.widgetUp}>▲ {usd(VS_LAST_MONTH)} vs last month</span>
          </button>
          <span className={styles.label}>PointPool</span>
        </div>
        <div className={styles.widgetCell}>
          <div className={`${styles.widget} ${styles.widgetSmall} ${styles.weather}`}>
            <span className={styles.widgetSub}>San Francisco</span>
            <b className={styles.widgetBig}>68°</b>
            <LuCloudSun className={styles.weatherIcon} aria-hidden="true" />
            <span className={styles.widgetSub}>Partly cloudy · H:72° L:58°</span>
          </div>
          <span className={styles.label}>Weather</span>
        </div>
      </div>

      <div className={styles.widgetCell}>
        <button className={`${styles.widget} ${styles.widgetMedium}`} onClick={onOpen} aria-label="Open PointPool">
          <div className={styles.medLeft}>
            <span className={styles.widgetBrand}><img src="/favicon.svg" alt="" />PointPool <em>October</em></span>
            <b className={styles.widgetBig}>{usd(THIS_MONTH)}</b>
            <span className={styles.widgetSub}>cash back earned</span>
            <span className={styles.missed}><b>+{usd(MISSED)}</b> missed · switch cards</span>
          </div>
          <div className={styles.medRight}>
            {CATEGORIES.map((c) => (
              <span key={c.id} className={styles.medCat}><span>{c.label}</span><b>{usd(c.thisMonth)}</b></span>
            ))}
          </div>
        </button>
        <span className={styles.label}>PointPool</span>
      </div>

      <div className={styles.grid}>
        <button className={styles.app} onClick={onOpen}>
          <span className={styles.appIcon}><img src="/favicon.svg" alt="" /></span>
          <span className={styles.label}>PointPool</span>
        </button>
        {APPS.map(({ label, icon: Icon, bg }) => (
          <span key={label} className={styles.app} aria-hidden="true">
            <span className={styles.appIcon} style={{ background: bg }}><Icon className={label === 'Photos' ? styles.photosIcon : undefined} /></span>
            <span className={styles.label}>{label}</span>
          </span>
        ))}
      </div>

      <div className={styles.dock}>
        {DOCK.map(({ label, icon: Icon, bg }) => (
          <span key={label} className={styles.app} aria-hidden="true">
            <span className={styles.appIcon} style={{ background: bg }}><Icon /></span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ---- PointPool app ----

function AppScreen({ onBack, onCategory }: { onBack: () => void; onCategory: (c: CategoryId) => void }) {
  return (
    <div className={`${styles.screen} ${styles.zoomIn}`}>
      <div className={styles.nav}>
        <button className={styles.back} onClick={onBack} aria-label="Back"><LuChevronLeft /></button>
        <span className={styles.navTitle}><img src="/favicon.svg" alt="" />PointPool</span>
        <span className={styles.navMeta}>Oct 2026</span>
      </div>

      <div className={styles.hero}>
        <span className={styles.heroLabel}>Cash back this month</span>
        <b className={styles.heroBig}>{usd(THIS_MONTH)}</b>
        <div className={styles.heroStats}>
          <div><span>vs September</span><b className={styles.up}>▲ {usd(VS_LAST_MONTH)}</b></div>
          <button onClick={() => onCategory('dining')}><span>Missed by using the wrong card</span><b className={styles.missedBig}>+{usd(MISSED)}</b></button>
        </div>
      </div>

      <h3 className={styles.h3}>Your top 3 categories</h3>
      <div className={styles.list}>
        {CATEGORIES.map(({ id, label, icon: Icon, thisMonth }) => (
          <button key={id} className={styles.listRow} onClick={() => onCategory(id)}>
            <span className={styles.catIcon}><Icon /></span>
            <span className={styles.listMain}>{label}</span>
            <b>{usd(thisMonth)}</b>
            <LuChevronRight className={styles.chev} />
          </button>
        ))}
      </div>

      <h3 className={styles.h3}>Recent cash back</h3>
      <div className={styles.list}>
        {RECENT.map((r) => (
          <div key={r.merchant} className={styles.listRow}>
            <span className={styles.listMain}>{r.merchant}</span>
            <span className={styles.muted}>{usd(r.amount)}</span>
            <b className={styles.earn}>+{usd(r.back)}</b>
          </div>
        ))}
      </div>
      <p className={styles.fine}>Demo · sample data</p>
    </div>
  )
}

// ---- Is there a better card for you? ----

function Compare({ category, onCategory, onBack }: { category: CategoryId; onCategory: (c: CategoryId) => void; onBack: () => void }) {
  const c = CATEGORIES.find((x) => x.id === category)!
  const [index, setIndex] = useState(0)
  const mine = c.yours[index % Math.max(c.yours.length, 1)]
  const s = c.suggested
  const gain = net(s, c.yearSpend) - (mine ? net(mine, c.yearSpend) : 0)
  const feeNote = s.fee > 0 ? `, even after ${s.name.split(' ')[0]}’s $${s.fee} fee.` : '.'

  return (
    <div className={`${styles.screen} ${styles.slideIn}`} key={category}>
      <div className={styles.nav}>
        <button className={styles.back} onClick={onBack} aria-label="Back"><LuChevronLeft /></button>
      </div>
      <h1 className={styles.h1}>Is there a better card for you?</h1>
      <p className={styles.sub}>Based on your last 90 days across all linked accounts.</p>

      <h3 className={styles.h3}>Your top 3 categories</h3>
      <div className={styles.tabs}>
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`${styles.tab} ${id === category ? styles.tabOn : ''}`} onClick={() => { setIndex(0); onCategory(id) }}>
            <Icon />{label}
          </button>
        ))}
      </div>

      <div className={styles.sectionHead}>
        <h2>{c.label} · which card wins?</h2>
        <span>{usd(c.yearSpend, false)} / yr</span>
      </div>

      <div className={styles.cols}>
        <div>
          <div className={styles.colHead}>
            {c.yours.length > 1 ? <>Your cards <i>{index + 1}/{c.yours.length}</i></> : 'Your card'}
          </div>
          {mine ? (
            <button
              className={styles.tile}
              onClick={() => c.yours.length > 1 && setIndex((i) => (i + 1) % c.yours.length)}
              aria-label={c.yours.length > 1 ? `${mine.name}. Tap to compare the next card` : mine.name}
            >
              <CardTile card={mine} spend={c.yearSpend} key={mine.name} />
            </button>
          ) : (
            <div className={`${styles.tile} ${styles.emptyTile}`}>
              <b>No card for {c.noun} yet</b>
              <span>You’ve been paying with debit</span>
              <span className={styles.addCard}>+ Add a card</span>
            </div>
          )}
        </div>
        <div>
          <div className={styles.colHead}>Suggested</div>
          <div className={`${styles.tile} ${styles.winner}`}>
            <span className={styles.badge}>Best pick</span>
            <CardTile card={s} spend={c.yearSpend} />
          </div>
        </div>
      </div>

      {c.yours.length > 1 && (
        <p className={styles.hint}>Tap your card to compare the next one · <b>{index + 1} of {c.yours.length}</b></p>
      )}

      <div className={styles.takeaway}>
        {mine ? (
          <><b>Switching earns you {usd(gain, false)} more a year</b> on {c.noun}{feeNote}{c.note && ` ${c.note}`}</>
        ) : (
          <><b>You’re earning $0 on {c.noun} today.</b> {s.name} would add {usd(net(s, c.yearSpend), false)} a year{s.fee > 0 ? ` after its $${s.fee} fee` : ' with no fee'}.</>
        )}
      </div>
    </div>
  )
}

function CardTile({ card, spend }: { card: DemoCard; spend: number }) {
  const r = rewards(card, spend)
  return (
    <span className={styles.flip}>
      <span className={styles.face} style={{ background: card.face }}>
        <span className={styles.network}>{card.network}</span>
        <b>{card.name}</b>
        <span className={styles.last4}>•••• {card.last4}</span>
      </span>
      <span className={styles.rate}>{card.rateLabel}</span>
      <span className={styles.row}><span>Est. rewards / yr</span><b>+{usd(r, false)}</b></span>
      <span className={styles.row}><span>Annual fee</span><b className={card.fee ? styles.fee : undefined}>{card.fee ? `−${usd(card.fee, false)}` : '$0'}</b></span>
      <span className={`${styles.row} ${styles.netRow}`}><span>Net value</span><b>+{usd(r - card.fee, false)}</b></span>
    </span>
  )
}

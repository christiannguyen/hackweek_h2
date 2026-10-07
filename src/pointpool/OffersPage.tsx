import { useCallback, useEffect, useState } from 'react'
import {
  balanceUses,
  fmtBalance,
  fmtMoney,
  hasEstimates,
  isCash,
  PROGRAMS,
  ruleFor,
  type Balance,
  type CategoryId,
} from './data'
import { Disclaimer } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
}

// --- Nearby places data (sample) ---

interface NearbyPlace {
  name: string
  type: string
  category: CategoryId
  distance: string
}

const PLACES_BY_AREA: Record<string, NearbyPlace[]> = {
  default: [
    { name: 'Whole Foods Market', type: 'Grocery', category: 'food', distance: '0.3 mi' },
    { name: 'Chipotle', type: 'Restaurant', category: 'food', distance: '0.4 mi' },
    { name: 'Trader Joe\'s', type: 'Grocery', category: 'food', distance: '0.6 mi' },
    { name: 'Target', type: 'Retail', category: 'shopping', distance: '0.5 mi' },
    { name: 'Amazon Fresh', type: 'Online grocery', category: 'food', distance: '0.8 mi' },
    { name: 'Costco Gas', type: 'Gas station', category: 'transport', distance: '1.1 mi' },
    { name: 'Shell', type: 'Gas station', category: 'transport', distance: '0.2 mi' },
    { name: 'Sweetgreen', type: 'Restaurant', category: 'food', distance: '0.7 mi' },
    { name: 'Best Buy', type: 'Electronics', category: 'shopping', distance: '1.3 mi' },
    { name: 'Uber / Lyft', type: 'Rideshare', category: 'transport', distance: 'Nearby' },
    { name: 'Starbucks', type: 'Coffee', category: 'food', distance: '0.1 mi' },
    { name: 'CVS Pharmacy', type: 'Drugstore', category: 'shopping', distance: '0.3 mi' },
  ],
}

function getPlaces(_coords: { lat: number; lng: number } | null): NearbyPlace[] {
  return PLACES_BY_AREA.default
}

// --- Card bonus matching ---

interface PlaceOffer {
  place: NearbyPlace
  card: Balance
  rate: string
  tag?: string
}

function matchPlacesToCards(places: NearbyPlace[], balances: Balance[]): PlaceOffer[] {
  const offers: PlaceOffer[] = []
  for (const place of places) {
    let bestRate = 0
    let bestCard: Balance | null = null
    let bestLabel = ''

    for (const b of balances) {
      const rule = ruleFor(b.cardName)
      if (!rule) continue
      const catRate = rule.rates[place.category]
      const rate = catRate?.rate ?? rule.base ?? 1
      if (rate > bestRate) {
        bestRate = rate
        bestCard = b
        const p = PROGRAMS[b.programId]
        bestLabel = p.type === 'cashback' ? `${rate}%` : `${rate}×`
      }
    }

    if (bestCard && bestRate > 1) {
      offers.push({
        place,
        card: bestCard,
        rate: bestLabel,
        tag: bestRate >= 4 ? 'Top earn' : undefined,
      })
    }
  }
  return offers.sort((a, b) => {
    if (a.tag && !b.tag) return -1
    if (!a.tag && b.tag) return 1
    return 0
  })
}

// --- Location hook ---

type LocState =
  | { status: 'idle' }
  | { status: 'detecting' }
  | { status: 'resolved'; label: string; coords: { lat: number; lng: number } | null }
  | { status: 'error'; message: string }

function useLocation() {
  const [loc, setLoc] = useState<LocState>({ status: 'idle' })

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setLoc({ status: 'error', message: 'Geolocation not supported' })
      return
    }
    setLoc({ status: 'detecting' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({
          status: 'resolved',
          label: 'Current location',
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        })
      },
      () => {
        setLoc({ status: 'error', message: 'Location access denied' })
      },
      { timeout: 10000 },
    )
  }, [])

  const setManual = useCallback((zip: string) => {
    if (zip.length === 5 && /^\d{5}$/.test(zip)) {
      setLoc({ status: 'resolved', label: `Near ${zip}`, coords: null })
    }
  }, [])

  return { loc, detect, setManual }
}

// --- Redemption offers (existing logic, kept below nearby) ---

interface RedemptionOffer {
  id: string
  emoji: string
  title: string
  desc: string
  tag?: string
}

function redemptionOffers(b: Balance): RedemptionOffer[] {
  const p = PROGRAMS[b.programId]
  if (!hasEstimates(p)) return []
  const uses = balanceUses(b)
  const travel = uses.find((u) => u.id === 'travel')
  const credit = uses.find((u) => u.id === 'cashback')
  const offers: RedemptionOffer[] = []

  if (isCash(b)) {
    if (b.amount >= 25) {
      offers.push({ id: `${b.id}-statement`, emoji: '💵', title: 'Statement credit', desc: `Apply ${fmtMoney(b.amount)} to your next statement.`, tag: 'Best value' })
    }
    if (b.amount >= 10) {
      offers.push({ id: `${b.id}-deposit`, emoji: '🏦', title: 'Bank deposit', desc: `Deposit ${fmtMoney(b.amount)} to your bank account.` })
    }
    offers.push({ id: `${b.id}-checkout`, emoji: '🛍️', title: 'Pay at checkout', desc: 'Use cashback at Amazon or PayPal checkout.' })
  } else {
    if (travel && b.amount > 0) {
      offers.push({ id: `${b.id}-travel`, emoji: '✈️', title: 'Book travel', desc: `${fmtBalance(b)} could cover ≈${fmtMoney(travel.value)} of flights or hotels.`, tag: 'Best value' })
    }
    if (b.amount > 0) {
      offers.push({ id: `${b.id}-giftcard`, emoji: '🎁', title: 'Gift cards', desc: 'Redeem for gift cards at popular retailers.' })
    }
    if (credit && b.amount > 0) {
      offers.push({ id: `${b.id}-credit`, emoji: '💵', title: 'Statement credit', desc: `Get ≈${fmtMoney(credit.value)} back on your bill.` })
    }
    if (p.brand === 'Chase' || p.brand === 'Amex') {
      offers.push({ id: `${b.id}-transfer`, emoji: '🔄', title: 'Transfer to airlines', desc: `Move ${p.brand} points to airline or hotel partners.`, tag: 'High value' })
    }
  }
  return offers
}

// --- Component ---

export function OffersPage({ balances, onEdit }: Props) {
  const { loc, detect, setManual } = useLocation()
  const [zip, setZip] = useState('')

  const resolved = loc.status === 'resolved'
  const places = resolved ? getPlaces(loc.coords) : []
  const nearbyOffers = resolved ? matchPlacesToCards(places, balances) : []

  const cardsWithRedemptions = balances
    .map((b) => ({ balance: b, offers: redemptionOffers(b) }))
    .filter((c) => c.offers.length > 0)

  return (
    <>
      <div className={styles.pageTitle}>Offers</div>

      {/* Location section */}
      <div className={styles.card}>
        <h2>Nearby offers</h2>
        <div className={styles.cardSub}>Find places near you where your cards earn bonus rewards.</div>

        {loc.status === 'idle' && (
          <div className={styles.locActions}>
            <button className={styles.locBtn} onClick={detect}>
              📍 Use my location
            </button>
            <div className={styles.locOr}>or</div>
            <div className={styles.locZip}>
              <input
                className={styles.locInput}
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter ZIP code"
                value={zip}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 5)
                  setZip(v)
                  if (v.length === 5) setManual(v)
                }}
              />
            </div>
          </div>
        )}

        {loc.status === 'detecting' && (
          <div className={styles.locStatus}>Detecting your location...</div>
        )}

        {loc.status === 'error' && (
          <div className={styles.locActions}>
            <div className={styles.locStatus} style={{ color: 'var(--orange)' }}>{loc.message}</div>
            <div className={styles.locZip}>
              <input
                className={styles.locInput}
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter ZIP code instead"
                value={zip}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 5)
                  setZip(v)
                  if (v.length === 5) setManual(v)
                }}
              />
            </div>
          </div>
        )}

        {resolved && (
          <>
            <div className={styles.locResolved}>
              <span className={styles.locLabel}>📍 {loc.label}</span>
              <button
                className={styles.btnText}
                onClick={() => { setZip(''); detect() }}
              >
                Change
              </button>
            </div>

            {balances.length === 0 && (
              <div className={styles.empty}>
                Add a card to see nearby offers.
                <div>
                  <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
                    + Add a card
                  </button>
                </div>
              </div>
            )}

            {nearbyOffers.length === 0 && balances.length > 0 && (
              <div className={styles.locStatus}>No bonus-earning places found nearby for your cards.</div>
            )}

            {nearbyOffers.map((o) => (
              <div key={`${o.place.name}-${o.card.id}`} className={styles.row}>
                <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>
                  {o.place.category === 'food' ? '🍽️' : o.place.category === 'transport' ? '⛽' : '🛍️'}
                </div>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitleLine}>
                    <span className={styles.rowTitle}>{o.place.name}</span>
                    {o.tag && <span className={`${styles.tag} ${styles.sm}`}>{o.tag}</span>}
                  </div>
                  <div className={styles.rowSub}>
                    {o.place.type} · {o.place.distance}
                  </div>
                  <div className={styles.rowSub}>
                    Use <b>{o.card.cardName}</b> for <b>{o.rate}</b> back
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Redemption offers per card */}
      {cardsWithRedemptions.length > 0 && (
        <>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Redeem your rewards</span>
          </div>
          {cardsWithRedemptions.map(({ balance: b, offers }) => (
            <div key={b.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.ellipsis}>{b.cardName}</h2>
                <span className={`${styles.tag} ${styles.sm}`}>{fmtBalance(b)}</span>
              </div>
              <div className={styles.mt}>
                {offers.map((o) => (
                  <div key={o.id} className={styles.row}>
                    <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>{o.emoji}</div>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitleLine}>
                        <span className={styles.rowTitle}>{o.title}</span>
                        {o.tag && <span className={`${styles.tag} ${styles.sm}`}>{o.tag}</span>}
                      </div>
                      <div className={styles.rowSub}>{o.desc}</div>
                    </div>
                    <span className={styles.chev}>›</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <Disclaimer />
    </>
  )
}

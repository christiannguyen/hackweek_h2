import { useCallback, useState } from 'react'
import {
  cardEarnings,
  fmtRate,
  type Balance,
  type CategoryId,
  type Spend,
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
  kind: PlaceKind
  distance: string
}

// What kind of store a place is, since most bonus rates cover only part of a category (grocery stores, not
// restaurants; gas stations, not rideshare or warehouse-club gas).
type PlaceKind = 'grocery' | 'restaurant' | 'online-grocery' | 'gas' | 'club-gas' | 'rideshare' | 'store'

const PLACES_BY_AREA: Record<string, NearbyPlace[]> = {
  default: [
    { name: 'Whole Foods Market', type: 'Grocery', category: 'food', kind: 'grocery', distance: '0.3 mi' },
    { name: 'Chipotle', type: 'Restaurant', category: 'food', kind: 'restaurant', distance: '0.4 mi' },
    { name: 'Trader Joe’s', type: 'Grocery', category: 'food', kind: 'grocery', distance: '0.6 mi' },
    { name: 'Target', type: 'Retail', category: 'shopping', kind: 'store', distance: '0.5 mi' },
    { name: 'Amazon Fresh', type: 'Online grocery', category: 'food', kind: 'online-grocery', distance: '0.8 mi' },
    { name: 'Costco Gas', type: 'Gas station', category: 'transport', kind: 'club-gas', distance: '1.1 mi' },
    { name: 'Shell', type: 'Gas station', category: 'transport', kind: 'gas', distance: '0.2 mi' },
    { name: 'Sweetgreen', type: 'Restaurant', category: 'food', kind: 'restaurant', distance: '0.7 mi' },
    { name: 'Best Buy', type: 'Electronics', category: 'shopping', kind: 'store', distance: '1.3 mi' },
    { name: 'Uber / Lyft', type: 'Rideshare', category: 'transport', kind: 'rideshare', distance: 'Nearby' },
    { name: 'Starbucks', type: 'Coffee', category: 'food', kind: 'restaurant', distance: '0.1 mi' },
    { name: 'CVS Pharmacy', type: 'Drugstore', category: 'shopping', kind: 'store', distance: '0.3 mi' },
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
}

// Whether a card's bonus in this category reaches this kind of place, read from the card's terms note. Without a
// note the bonus is taken to cover the whole category.
function bonusApplies(note: string | undefined, kind: PlaceKind) {
  const n = (note ?? '').toLowerCase()
  if (kind === 'club-gas') return false // warehouse-club gas is usually excluded from gas bonuses
  if (kind === 'rideshare') return /rideshare|transit/.test(n)
  if (kind === 'restaurant') return !/restaurants earn/.test(n) && (/restaurant/.test(n) || !/grocery|supermarket/.test(n))
  if (kind === 'online-grocery') return !/supermarket/.test(n)
  return true
}

// Each place's highest-earning card in the wallet, using the same rates as Card Coach (caps, rotating quarters and
// extra steps included). Points and cashback are compared by cash value.
function matchPlacesToCards(places: NearbyPlace[], balances: Balance[]): PlaceOffer[] {
  const offers: PlaceOffer[] = []
  const spend = { food: 100, shopping: 100, transport: 100 } as Spend // any amount works: only the rate is used
  for (const place of places) {
    let best: { card: Balance; label: string; value: number } | null = null
    for (const e of cardEarnings(balances, place.category, spend)) {
      // Only bonus rates that reach this kind of place; a card's everyday rate isn't an offer.
      if (!e.terms || e.avgRate <= e.base || !bonusApplies(e.terms.note, place.kind)) continue
      const rate = e.avgRate
      const value = e.program.type === 'cashback' ? rate : rate * (e.program.cpp?.cashback ?? 0)
      if (!best || value > best.value) {
        best = { card: e.balance, value, label: e.program.type === 'cashback' ? `${fmtRate('cashback', rate)} cashback` : `${fmtRate('points', rate)} points` }
      }
    }
    if (best) offers.push({ place, card: best.card, rate: best.label })
  }
  return offers
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
      setLoc({ status: 'error', message: 'Couldn’t get your location. Enter a ZIP code instead.' })
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
        setLoc({ status: 'error', message: 'Couldn’t get your location. Enter a ZIP code instead.' })
      },
      { timeout: 10000 },
    )
  }, [])

  const reset = useCallback(() => setLoc({ status: 'idle' }), [])

  const setManual = useCallback((zip: string) => {
    if (zip.length === 5 && /^\d{5}$/.test(zip)) {
      setLoc({ status: 'resolved', label: `Near ${zip}`, coords: null })
    }
  }, [])

  return { loc, detect, reset, setManual }
}

// --- Component ---

export function OffersPage({ balances, onEdit }: Props) {
  const { loc, detect, reset, setManual } = useLocation()
  const [zip, setZip] = useState('')

  const resolved = loc.status === 'resolved'
  const places = resolved ? getPlaces(loc.coords) : []
  const nearbyOffers = resolved ? matchPlacesToCards(places, balances) : []

  return (
    <>
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Offers</div>
      </div>

      {/* Location section */}
      <div className={`${styles.card} ${styles.darkCard}`}>
        <h2>Nearby offers</h2>
        <div className={styles.cardSub}>Places where your cards could earn bonus rewards. Sample places for this demo.</div>

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
          <div className={styles.locStatus}>Finding your location…</div>
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
                onClick={() => { setZip(''); reset() }}
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
                  </div>
                  <div className={styles.rowSub}>
                    {o.place.type} · {o.place.distance}
                  </div>
                  <div className={styles.rowSub}>
                    <b>{o.card.cardName}</b> could earn <b>{o.rate}</b>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* "Ways to use your rewards" lives on the Use rewards tab; Offers is about where to earn. */}

      <Disclaimer />
    </>
  )
}

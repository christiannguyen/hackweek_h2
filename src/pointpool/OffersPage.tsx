import { useCallback, useState } from 'react'
import { LuFuel, LuMapPin, LuShoppingBag, LuUtensils } from 'react-icons/lu'
import {
  cardEarnings,
  fmtRate,
  type Balance,
  type CategoryId,
  type Spend,
} from './data'
import { OffersMap, type MapPin } from './OffersMap'
import { Disclaimer } from './shared'
import styles from './pointpool.module.css'
import o from './offers.module.css'

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
  /** Where the place sits on the map's 1040×820 world. */
  x: number
  y: number
}

// What kind of store a place is, since most bonus rates cover only part of a category (grocery stores, not
// restaurants; gas stations, not rideshare or warehouse-club gas).
type PlaceKind = 'grocery' | 'restaurant' | 'online-grocery' | 'gas' | 'club-gas' | 'rideshare' | 'store'

const PLACES_BY_AREA: Record<string, NearbyPlace[]> = {
  default: [
    { name: 'Whole Foods Market', type: 'Grocery', category: 'food', kind: 'grocery', distance: '0.3 mi', x: 150, y: 190 },
    { name: 'Chipotle', type: 'Restaurant', category: 'food', kind: 'restaurant', distance: '0.4 mi', x: 340, y: 110 },
    { name: 'Trader Joe’s', type: 'Grocery', category: 'food', kind: 'grocery', distance: '0.6 mi', x: 520, y: 200 },
    { name: 'Target', type: 'Retail', category: 'shopping', kind: 'store', distance: '0.5 mi', x: 800, y: 160 },
    { name: 'Amazon Fresh', type: 'Online grocery', category: 'food', kind: 'online-grocery', distance: '0.8 mi', x: 250, y: 390 },
    { name: 'Costco Gas', type: 'Gas station', category: 'transport', kind: 'club-gas', distance: '1.1 mi', x: 930, y: 420 },
    { name: 'Shell', type: 'Gas station', category: 'transport', kind: 'gas', distance: '0.2 mi', x: 470, y: 470 },
    { name: 'Sweetgreen', type: 'Restaurant', category: 'food', kind: 'restaurant', distance: '0.7 mi', x: 700, y: 560 },
    { name: 'Best Buy', type: 'Electronics', category: 'shopping', kind: 'store', distance: '1.3 mi', x: 110, y: 590 },
    { name: 'Uber / Lyft', type: 'Rideshare', category: 'transport', kind: 'rideshare', distance: 'Nearby', x: 330, y: 690 },
    { name: 'Starbucks', type: 'Coffee', category: 'food', kind: 'restaurant', distance: '0.1 mi', x: 700, y: 70 },
    { name: 'CVS Pharmacy', type: 'Drugstore', category: 'shopping', kind: 'store', distance: '0.3 mi', x: 880, y: 700 },
  ],
}

function getPlaces(_coords: { lat: number; lng: number } | null): NearbyPlace[] {
  return PLACES_BY_AREA.default
}

const CATEGORY_ICON = { food: LuUtensils, shopping: LuShoppingBag, transport: LuFuel }

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
  const [picked, setPicked] = useState<string | null>(null)

  const resolved = loc.status === 'resolved'
  const places = resolved ? getPlaces(loc.coords) : getPlaces(null)
  const nearbyOffers = resolved ? matchPlacesToCards(places, balances) : []

  // Pins show every place; the ones your cards earn a bonus at carry the rate and light up.
  const byPlace = new Map(nearbyOffers.map((offer) => [offer.place.name, offer]))
  const pins: MapPin[] = places.map((p) => {
    const offer = byPlace.get(p.name)
    return {
      id: p.name,
      x: p.x,
      y: p.y,
      name: p.name,
      type: p.type,
      distance: p.distance,
      category: p.category,
      cardName: offer?.card.cardName,
      rate: offer?.rate,
    }
  })

  const onZip = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 5)
    setZip(digits)
    if (digits.length === 5) setManual(digits)
  }

  return (
    <div className={o.page}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Offers</h1>
      </div>

      <OffersMap pins={pins} selectedId={picked} onSelect={setPicked} locked={!resolved}>
        {resolved ? (
          <div className={o.where}>
            <LuMapPin aria-hidden="true" /> {loc.label}
            <button className={o.whereBtn} onClick={() => { setZip(''); setPicked(null); reset() }}>
              Change
            </button>
          </div>
        ) : (
          <div className={o.gate}>
            <div className={o.gateTitle}>Nearby offers</div>
            <div className={o.gateSub}>
              See the places around you where your cards earn bonus rewards. Sample places for this demo.
            </div>
            {loc.status === 'detecting' ? (
              <div className={o.gateSub}>Finding your location…</div>
            ) : (
              <>
                {loc.status === 'error' && <div className={o.gateErr}>{loc.message}</div>}
                <button className={o.gateBtn} onClick={detect}>
                  <LuMapPin aria-hidden="true" /> Use my location
                </button>
                <div className={o.gateOr}>or</div>
                <input
                  className={o.gateInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Enter ZIP code"
                  value={zip}
                  onChange={(e) => onZip(e.target.value)}
                />
              </>
            )}
          </div>
        )}
      </OffersMap>

      {resolved && (
        <>
          <div className={o.listHead}>
            <span className={o.listTitle}>Bonus rewards near you</span>
            {nearbyOffers.length > 0 && <span className={o.listMeta}>{nearbyOffers.length} places</span>}
          </div>

          {balances.length === 0 && (
            <div className={o.empty}>
              Add a card to see nearby offers.
              <div>
                <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
                  + Add a card
                </button>
              </div>
            </div>
          )}

          {nearbyOffers.length === 0 && balances.length > 0 && (
            <div className={o.empty}>No bonus-earning places found nearby for your cards.</div>
          )}

          <div className={o.list}>
            {nearbyOffers.map((offer) => {
              const Icon = CATEGORY_ICON[offer.place.category]
              const on = picked === offer.place.name
              return (
                <button
                  key={`${offer.place.name}-${offer.card.id}`}
                  type="button"
                  className={`${o.place} ${on ? o.placeOn : ''}`}
                  aria-pressed={on}
                  onClick={() => setPicked(on ? null : offer.place.name)}
                >
                  <span className={o.placeIcon}><Icon aria-hidden="true" /></span>
                  <span className={o.placeMain}>
                    <span className={o.placeName}>{offer.place.name}</span>
                    <span className={o.placeMeta}>{offer.place.type} · {offer.place.distance}</span>
                    <span className={o.placeCard}>Use <strong>{offer.card.cardName}</strong></span>
                  </span>
                  <span className={o.placeRate}>{offer.rate}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <Disclaimer />
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { LuFuel, LuShoppingBag, LuUtensils } from 'react-icons/lu'
import type { CategoryId } from './data'
import m from './offers.module.css'

// The map is a stylized neighbourhood, not a real one — the places are sample data, so a real tile
// provider would promise accuracy the demo can't keep. Drawn once as SVG in world coordinates and
// panned with a transform, so dragging never re-renders the art.
// The art is authored at 1040×820 and pin coordinates are in that space; the whole thing is drawn a
// little smaller than authored so a phone-width viewport holds four or five places at once instead of
// one. Uniform, so nothing is stretched.
const ART = { w: 1040, h: 820 }
const SCALE = 0.79
const WORLD = { w: Math.round(ART.w * SCALE), h: Math.round(ART.h * SCALE) }

export interface MapPin {
  id: string
  x: number
  y: number
  name: string
  type: string
  distance: string
  category: CategoryId
  /** The best card for this place, when one of your cards earns a bonus here. */
  cardName?: string
  rate?: string
}

const PIN_ICON = { food: LuUtensils, shopping: LuShoppingBag, transport: LuFuel }

export function OffersMap({
  pins,
  selectedId,
  onSelect,
  locked,
  children,
}: {
  pins: MapPin[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Before a location is set the map is backdrop only: no hint, no panning, and it fills the page
      because there's no list of places under it yet. */
  locked?: boolean
  /** Overlays drawn inside the frame, over the map: the location gate, the "where" chip. */
  children?: ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: -300, y: -220 })

  const clamp = useCallback((p: { x: number; y: number }) => {
    const el = box.current
    const w = el?.clientWidth ?? 360
    const h = el?.clientHeight ?? 360
    return {
      x: Math.min(0, Math.max(w - WORLD.w, p.x)),
      y: Math.min(0, Math.max(h - WORLD.h, p.y)),
    }
  }, [])

  // Open centred, so the first thing you see is the middle of the neighbourhood rather than a corner.
  useEffect(() => {
    const el = box.current
    if (!el) return
    // Biased up from dead centre, which would open on the river rather than on places.
    setPan(clamp({ x: (el.clientWidth - WORLD.w) / 2, y: (el.clientHeight - WORLD.h) / 2 + 70 }))
  }, [clamp])

  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null)
  // Kept across pointerup so a drag that ends on a pin doesn't also count as a tap on it.
  const moved = useRef(false)
  const [dragging, setDragging] = useState(false)

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y }
    moved.current = false
    setDragging(true)
  }

  // Tracked on the window rather than with setPointerCapture: capturing retargets the click to the
  // viewport, which would make the pins untappable. This way a drag still works past the frame edge.
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      const dx = e.clientX - d.sx
      const dy = e.clientY - d.sy
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true
      setPan(clamp({ x: d.ox + dx, y: d.oy + dy }))
    }
    const onUp = (e: PointerEvent) => {
      if (drag.current?.id !== e.pointerId) return
      drag.current = null
      setDragging(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, clamp])

  const selected = pins.find((p) => p.id === selectedId) ?? null

  return (
    <div className={`${m.frame} ${locked ? m.frameTall : ''}`}>
      <div
        ref={box}
        className={`${m.viewport} ${locked ? m.viewportLocked : ''}`}
        onPointerDown={onDown}
      >
        <div className={m.world} style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          <MapArt />
          {pins.map((p) => {
            const Icon = PIN_ICON[p.category]
            const on = p.id === selectedId
            return (
              <button
                key={p.id}
                type="button"
                className={`${m.pin} ${p.rate ? m.pinHot : ''} ${on ? m.pinOn : ''}`}
                style={{ left: p.x * SCALE, top: p.y * SCALE }}
                aria-pressed={on}
                /* The label only renders on the selected pin, so the name lives here too. */
                aria-label={p.rate ? `${p.name} — ${p.rate}` : p.name}
                onClick={() => {
                  if (moved.current) return
                  onSelect(on ? null : p.id)
                }}
              >
                <span className={m.pinDot}><Icon aria-hidden="true" /></span>
                <span className={m.pinLabel}>
                  {p.name}
                  {p.rate && <b> · {p.rate}</b>}
                </span>
              </button>
            )
          })}
        </div>

        {!selected && !locked && <div className={m.hint}>Drag to explore · tap a pin</div>}

        {selected && (
          <div className={m.sheet}>
            <div className={m.sheetMain}>
              <div className={m.sheetName}>{selected.name}</div>
              <div className={m.sheetMeta}>{selected.type} · {selected.distance}</div>
              {selected.rate ? (
                <div className={m.sheetCard}>
                  Use <strong>{selected.cardName}</strong> for <b>{selected.rate}</b>
                </div>
              ) : (
                <div className={m.sheetFlat}>No bonus here — any card earns its everyday rate.</div>
              )}
            </div>
            <button type="button" className={m.sheetClose} onClick={() => onSelect(null)} aria-label="Close">
              ×
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

// The neighbourhood itself: blocks, two parks, a river and the roads between them. Decorative, so it's
// hidden from assistive tech — the list under the map carries the same places as text.
function MapArt() {
  return (
    <svg className={m.art} viewBox={`0 0 ${ART.w} ${ART.h}`} width={WORLD.w} height={WORLD.h} aria-hidden="true">
      <rect width="1040" height="820" fill="#1a211a" />

      {/* Parks */}
      <path d="M60 60 h260 v170 h-120 l-140 -60 z" fill="#25331f" />
      <circle cx="840" cy="620" r="150" fill="#25331f" />

      {/* River, with a soft bank behind it */}
      <path d="M-20 300 C 180 260, 300 380, 520 360 S 820 300, 1060 340" stroke="#1d2b30" strokeWidth="64" fill="none" />
      <path d="M-20 300 C 180 260, 300 380, 520 360 S 820 300, 1060 340" stroke="#24454e" strokeWidth="40" fill="none" />

      {/* Roads: a few wide arteries, then the side streets between them */}
      <g stroke="#2c372a" strokeWidth="26" strokeLinecap="square">
        <path d="M0 250 H1040" />
        <path d="M0 520 H1040" />
        <path d="M0 720 H1040" />
        <path d="M200 0 V820" />
        <path d="M620 0 V820" />
        <path d="M900 0 V820" />
        <path d="M200 520 L620 250" />
      </g>
      <g stroke="#232d22" strokeWidth="12">
        <path d="M0 130 H1040" />
        <path d="M0 400 H1040" />
        <path d="M0 630 H1040" />
        <path d="M400 0 V820" />
        <path d="M780 0 V820" />
      </g>
      {/* Centre lines on the arteries only, so the wide roads read as roads. */}
      <g stroke="#3b4a37" strokeWidth="2" strokeDasharray="14 18">
        <path d="M0 250 H1040" />
        <path d="M0 520 H1040" />
        <path d="M0 720 H1040" />
        <path d="M200 0 V820" />
        <path d="M620 0 V820" />
        <path d="M900 0 V820" />
      </g>

      {/* City blocks */}
      <g fill="#212a20">
        <rect x="230" y="30" width="140" height="80" rx="6" />
        <rect x="430" y="30" width="160" height="80" rx="6" />
        <rect x="650" y="30" width="110" height="80" rx="6" />
        <rect x="810" y="30" width="70" height="80" rx="6" />
        <rect x="230" y="150" width="150" height="80" rx="6" />
        <rect x="430" y="150" width="160" height="80" rx="6" />
        <rect x="650" y="150" width="220" height="80" rx="6" />
        <rect x="30" y="420" width="140" height="80" rx="6" />
        <rect x="430" y="420" width="160" height="80" rx="6" />
        <rect x="650" y="420" width="220" height="80" rx="6" />
        <rect x="30" y="550" width="140" height="60" rx="6" />
        <rect x="230" y="550" width="150" height="60" rx="6" />
        <rect x="430" y="550" width="160" height="60" rx="6" />
        <rect x="30" y="650" width="140" height="60" rx="6" />
        <rect x="230" y="650" width="150" height="60" rx="6" />
        <rect x="430" y="650" width="160" height="60" rx="6" />
        <rect x="30" y="740" width="340" height="60" rx="6" />
        <rect x="430" y="740" width="160" height="60" rx="6" />
        <rect x="650" y="740" width="220" height="60" rx="6" />
      </g>
    </svg>
  )
}

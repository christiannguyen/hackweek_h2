import { useEffect, useState } from 'react'

export type Route = 'home' | 'learn' | 'coach' | 'pointpool' | 'offers' | 'welcome' | 'demo'
const ROUTES: Route[] = ['home', 'learn', 'coach', 'pointpool', 'offers', 'welcome', 'demo']

// "#coach/market-Savor" is the coach route, opened at one card.
// "#wallet" is the Wallet tab. "#pointpool" (its old name) and "#redeem" (the Use rewards tab, now a
// section of the wallet) both still open it, so saved links and "#redeem/<id>" keep working.
const ALIASES: Record<string, Route> = { wallet: 'pointpool', redeem: 'pointpool' }
const parse = (): Route => {
  const raw = window.location.hash.slice(1).split('/')[0]
  const h = (ALIASES[raw] ?? raw) as Route
  return ROUTES.includes(h) ? h : 'home'
}

// The part after the route, e.g. the card a home row links to.
export const routeParam = () => decodeURIComponent(window.location.hash.split('/')[1] ?? '')

// Tiny hash router — enough for a prototype, no extra dependency.
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(parse)

  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

import { useEffect, useState } from 'react'

export type Route = 'home' | 'redeem' | 'learn' | 'compare' | 'coach' | 'pointpool' | 'offers' | 'welcome' | 'demo'
const ROUTES: Route[] = ['home', 'redeem', 'learn', 'compare', 'coach', 'pointpool', 'offers', 'welcome', 'demo']

// "#compare/market-Savor" opens Compare at one card; old #coach/card links still work.
// "#wallet" is the Wallet tab; "#pointpool", its old name, still opens it.
const parse = (): Route => {
  const [raw, card] = window.location.hash.slice(1).split('/')
  if (raw === 'coach' && card) return 'compare'
  const h = (raw === 'wallet' ? 'pointpool' : raw) as Route
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

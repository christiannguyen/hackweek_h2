import { useEffect, useState } from 'react'

export type Route = 'home' | 'redeem' | 'learn' | 'coach' | 'pointpool' | 'offers' | 'welcome'
const ROUTES: Route[] = ['home', 'redeem', 'learn', 'coach', 'pointpool', 'offers', 'welcome']

// "#coach/market-Savor" is the coach route, opened at one card.
const parse = (): Route => {
  const h = window.location.hash.slice(1).split('/')[0] as Route
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

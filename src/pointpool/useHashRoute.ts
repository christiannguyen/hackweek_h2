import { useEffect, useState } from 'react'

export type Route = 'home' | 'redeem' | 'learn' | 'coach'
const ROUTES: Route[] = ['home', 'redeem', 'learn', 'coach']

const parse = (): Route => {
  const h = window.location.hash.slice(1) as Route
  return ROUTES.includes(h) ? h : 'home'
}

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

import type { KeyboardEvent } from 'react'

// Props that make a clickable card or row work like a button: focusable, Enter/Space to open, read out by name.
export function pressable(onActivate: () => void, label: string) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onActivate()
      }
    },
  } as const
}

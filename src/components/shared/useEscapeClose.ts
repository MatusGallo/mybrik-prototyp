import { useEffect } from 'react'
import { isFloatingPanelOpen } from '@matusgallo/mysabds'

/**
 * Zavře modál klávesou Escape.
 *
 * Nad rozbaleným seznamem nebo kalendářem patří stisk jemu, ne modálu - jinak
 * jeden Escape zavře obojí a rozepsaný formulář je pryč.
 */
export default function useEscapeClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isFloatingPanelOpen()) return
      onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
}

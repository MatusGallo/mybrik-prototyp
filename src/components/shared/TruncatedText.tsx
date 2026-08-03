import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Tooltip } from '@matusgallo/mysabds'

interface Props {
  text: string
  align?: 'left' | 'right' | 'center'
}

/**
 * Text buňky tabulky se zkracuje výpustkou. Když se do sloupce nevejde,
 * zobrazí se na hover celý v tooltipu - jinak žádný tooltip nevzniká.
 * Styl kopíruje label z `TableCell` v design systému.
 */
export default function TruncatedText({ text, align = 'left' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [zkraceny, setZkraceny] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const zmer = () => setZkraceny(el.scrollWidth > el.clientWidth + 1)
    zmer()
    const ro = new ResizeObserver(zmer)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  const style: CSSProperties = {
    display: 'block',
    minWidth: 0,
    fontFamily: 'var(--fontFamilyBase)',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: '20px',
    color: 'var(--t-textPrimary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: align,
  }

  const span = <span ref={ref} style={style}>{text}</span>

  if (!zkraceny) return span

  // trigger tooltipu je z DS `inline-flex`; bez přepnutí na blok by se text
  // roztáhl na plnou délku, výpustka by zmizela a měření by se rozkmitalo
  return (
    <Tooltip content={text} placement="bottom" triggerStyle={{ display: 'block', minWidth: 0, overflow: 'hidden' }}>
      {span}
    </Tooltip>
  )
}

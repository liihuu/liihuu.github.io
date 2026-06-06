import { useLayoutEffect, useRef } from 'react'

import {
  applyBackgroundTheme,
  applyForegroundTheme,
  applyTheme,
  THEME_BG,
  THEME_FG_REVEAL_RATIO
} from './themes'

function easeOutQuart (t) {
  return 1 - (1 - t) ** 4
}

function setToggleY (toggleEl, y) {
  if (!toggleEl) return
  toggleEl.style.transform = y ? `translateY(${y}px)` : ''
}

function setSheetY (sheet, y) {
  sheet.style.transform = y ? `translate3d(0, ${y}px, 0)` : ''
}

function setPullerScale (puller, sx = 1, sy = 1) {
  if (!puller) return
  puller.style.transform = sx === 1 && sy === 1 ? '' : `scale(${sx}, ${sy})`
}

function resetToggle (toggleEl) {
  if (!toggleEl) return
  const puller = toggleEl.querySelector('.theme-toggle__icon')
  setToggleY(toggleEl)
  setPullerScale(puller)
  toggleEl.style.opacity = ''
}

function runSheetFall ({
  sheet,
  toggleEl,
  puller,
  ground,
  revealAt,
  onReveal,
  onDone
}) {
  const FALL_DURATION = 0.76
  const settleDelay = 0.12
  const fadeSpeed = 3.6

  let elapsed = 0
  let lastTime = 0
  let settleElapsed = 0
  let opacity = 1
  let phase = 'falling'
  let frameId = 0
  let revealed = false

  const reveal = () => {
    if (revealed) return
    revealed = true
    onReveal()
  }

  const tick = (now) => {
    if (!lastTime) {
      lastTime = now
      frameId = requestAnimationFrame(tick)
      return
    }

    const dt = Math.min((now - lastTime) / 1000, 1 / 30)
    lastTime = now

    if (phase === 'falling') {
      elapsed += dt
      const t = Math.min(elapsed / FALL_DURATION, 1)
      const eased = easeOutQuart(t)
      const y = ground * eased

      setSheetY(sheet, y)
      setToggleY(toggleEl, y)
      setPullerScale(puller, 1 - eased * 0.04, 1 + eased * 0.06)

      if (y >= revealAt) reveal()

      if (t >= 1) {
        setPullerScale(puller)
        phase = 'settled'
        settleElapsed = 0
      }
    } else if (phase === 'settled') {
      setSheetY(sheet, ground)
      setToggleY(toggleEl, ground)
      setPullerScale(puller)

      settleElapsed += dt
      if (settleElapsed >= settleDelay) phase = 'fading'
    } else {
      opacity = Math.max(0, opacity - fadeSpeed * dt)
      sheet.style.opacity = String(opacity)
      toggleEl.style.opacity = String(opacity)

      if (opacity <= 0) {
        reveal()
        onDone()
        return
      }
    }

    frameId = requestAnimationFrame(tick)
  }

  frameId = requestAnimationFrame(tick)

  return () => cancelAnimationFrame(frameId)
}

export default function ThemeTransition ({ from, to, onApply, onComplete, toggleRef }) {
  const sheetRef = useRef(null)

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      applyTheme(to)
      onApply?.(to)
      onComplete?.()
      return
    }

    const sheet = sheetRef.current
    const toggleEl = toggleRef?.current
    if (!sheet || !toggleEl) return

    const puller = toggleEl.querySelector('.theme-toggle__icon')
    if (!puller) return

    const ground = window.innerHeight
    const revealAt = ground * THEME_FG_REVEAL_RATIO

    applyBackgroundTheme(to)

    sheet.style.opacity = '1'
    setSheetY(sheet, 0)
    toggleEl.style.opacity = '1'
    setToggleY(toggleEl, 0)
    setPullerScale(puller)

    let fgApplied = false

    const commitForeground = () => {
      if (fgApplied) return
      fgApplied = true
      applyForegroundTheme(to)
      onApply?.(to)
    }

    const stopFall = runSheetFall({
      sheet,
      toggleEl,
      puller,
      ground,
      revealAt,
      onReveal: commitForeground,
      onDone: () => {
        commitForeground()
        onComplete?.()
      }
    })

    return () => {
      stopFall()
      resetToggle(toggleEl)
      sheet.style.opacity = ''
      setSheetY(sheet, 0)
    }
  }, [from, to, onApply, onComplete, toggleRef])

  return (
    <div className="theme-transition__sheet-wrap" aria-hidden="true">
      <div
        ref={sheetRef}
        className="theme-transition__sheet"
        style={{ background: THEME_BG[from] }}
      />
    </div>
  )
}

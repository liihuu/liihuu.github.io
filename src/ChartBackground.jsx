import { useEffect, useRef } from 'react'

const BG_RGB = '2, 2, 8'
const PARTICLE_COUNT = 72

function lerp (a, b, t) {
  return a + (b - a) * t
}

function readAccent () {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb')
    .trim()
}

function createParticle (width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    r: 1 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2
  }
}

function drawParticles (ctx, particles, t, accent) {
  for (const p of particles) {
    const pulse = 0.55 + Math.sin(t * 0.002 + p.phase) * 0.45
    const alpha = 0.12 + pulse * 0.16

    ctx.fillStyle = `rgba(${accent}, ${alpha})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawMouseGlow (ctx, width, height, mx, my, accent) {
  const cx = mx * width
  const cy = my * height
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300)
  glow.addColorStop(0, `rgba(${accent}, 0.12)`)
  glow.addColorStop(0.4, `rgba(${accent}, 0.04)`)
  glow.addColorStop(1, `rgba(${BG_RGB}, 0)`)

  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
}

export default function ChartBackground () {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches

    let animationId = 0
    let particles = []
    let accent = readAccent()
    let dpr = 1
    let width = 0
    let height = 0
    let visible = !document.hidden

    let targetMx = 0.5
    let targetMy = 0.5
    let mx = 0.5
    let my = 0.5
    let mouseActive = false

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      accent = readAccent()
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(width, height))
    }

    const onMove = (e) => {
      targetMx = e.clientX / width
      targetMy = e.clientY / height
      mouseActive = true
    }

    const onLeave = () => {
      mouseActive = false
    }

    const onVisibility = () => {
      visible = !document.hidden
      if (visible && !reducedMotion) {
        cancelAnimationFrame(animationId)
        animationId = requestAnimationFrame(draw)
      }
    }

    const updateParticles = () => {
      const cx = mx * width
      const cy = my * height

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx
          p.y += p.vy

          if (p.x < -20) p.x = width + 20
          else if (p.x > width + 20) p.x = -20
          if (p.y < -20) p.y = height + 20
          else if (p.y > height + 20) p.y = -20
        }

        if (mouseActive && finePointer) {
          const dx = cx - p.x
          const dy = cy - p.y
          const dist = Math.hypot(dx, dy)
          if (dist < 160 && dist > 0) {
            const force = (1 - dist / 160) * 0.018
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        p.vx *= 0.992
        p.vy *= 0.992

        let speed = Math.hypot(p.vx, p.vy)
        if (speed < 0.06) {
          p.vx += (Math.random() - 0.5) * 0.04
          p.vy += (Math.random() - 0.5) * 0.04
          speed = Math.hypot(p.vx, p.vy)
        }

        if (speed > 0.55) {
          p.vx = (p.vx / speed) * 0.55
          p.vy = (p.vy / speed) * 0.55
        }
      }
    }

    const draw = (time) => {
      if (!visible) return

      if (finePointer) {
        mx = reducedMotion ? targetMx : lerp(mx, targetMx, 0.1)
        my = reducedMotion ? targetMy : lerp(my, targetMy, 0.1)
      }

      ctx.clearRect(0, 0, width, height)

      updateParticles()
      drawParticles(ctx, particles, time, accent)

      if (mouseActive && finePointer) {
        drawMouseGlow(ctx, width, height, mx, my, accent)
      }

      if (!reducedMotion) {
        animationId = requestAnimationFrame(draw)
      }
    }

    resize()
    draw(0)
    if (!reducedMotion) {
      animationId = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)
    if (finePointer) {
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerleave', onLeave)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas className="bg-canvas" ref={canvasRef} aria-hidden="true" />
}

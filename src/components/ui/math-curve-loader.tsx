'use client'

import { useRef, useEffect, useMemo } from 'react'
import { curveConfigs, type CurveConfig } from './curve-configs'

// Maximum particle count across all curves (Heart Wave = 104)
const MAX_PARTICLES = 110

interface MathCurveLoaderProps {
  /** Curve name. Defaults to 'Original Thinking'. See CURVE_NAMES for all options. */
  curve?: string
  /** Size in pixels. Defaults to 120. */
  size?: number
  /** CSS color value. Defaults to 'white'. */
  color?: string
  className?: string
}

// --- Animation engine (ported 1:1 from math-curve-loaders/main.js) ---

function normalizeProgress(progress: number): number {
  return ((progress % 1) + 1) % 1
}

function getDetailScale(time: number, config: CurveConfig, phaseOffset: number): number {
  const pulseProgress =
    ((time + phaseOffset * config.pulseDurationMs) % config.pulseDurationMs) / config.pulseDurationMs
  const pulseAngle = pulseProgress * Math.PI * 2
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48
}

function getRotation(time: number, config: CurveConfig, phaseOffset: number): number {
  if (!config.rotate) return 0
  return -(
    ((time + phaseOffset * config.rotationDurationMs) % config.rotationDurationMs) /
    config.rotationDurationMs
  ) * 360
}

function getParticle(
  config: CurveConfig,
  index: number,
  progress: number,
  detailScale: number,
) {
  const tailOffset = index / (config.particleCount - 1)
  const point = config.point(
    normalizeProgress(progress - tailOffset * config.trailSpan),
    detailScale,
    config,
  )
  const fade = Math.pow(1 - tailOffset, 0.56)
  return {
    x: point.x,
    y: point.y,
    radius: 0.9 + fade * 2.7,
    opacity: 0.04 + fade * 0.96,
  }
}

function buildPath(config: CurveConfig, detailScale: number, steps = 480): string {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const point = config.point(index / steps, detailScale, config)
    return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  }).join(' ')
}

// --- Component ---

export default function MathCurveLoader({
  curve = 'Original Thinking',
  size = 120,
  color = 'white',
  className,
}: MathCurveLoaderProps) {
  const groupRef = useRef<SVGGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  // Holds refs to each circle; we always render MAX_PARTICLES but only animate up to particleCount
  const particleRefs = useRef<(SVGCircleElement | null)[]>(Array(MAX_PARTICLES).fill(null))
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const phaseOffsetRef = useRef<number>(Math.random())

  const config = useMemo(
    () => curveConfigs.find(c => c.name === curve) ?? curveConfigs[0],
    [curve],
  )

  useEffect(() => {
    startTimeRef.current = performance.now()

    function tick(now: number) {
      const time = now - startTimeRef.current
      const group = groupRef.current
      const path = pathRef.current
      if (!group || !path) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }

      const phaseOffset = phaseOffsetRef.current
      const progress =
        ((time + phaseOffset * config.durationMs) % config.durationMs) / config.durationMs
      const detailScale = getDetailScale(time, config, phaseOffset)
      const rotation = getRotation(time, config, phaseOffset)

      group.setAttribute('transform', `rotate(${rotation} 50 50)`)
      path.setAttribute('d', buildPath(config, detailScale))

      particleRefs.current.forEach((node, index) => {
        if (!node) return
        if (index >= config.particleCount) {
          // Hide unused particles from previous larger curve
          node.setAttribute('opacity', '0')
          return
        }
        const particle = getParticle(config, index, progress, detailScale)
        node.setAttribute('cx', particle.x.toFixed(2))
        node.setAttribute('cy', particle.y.toFixed(2))
        node.setAttribute('r', particle.radius.toFixed(2))
        node.setAttribute('opacity', particle.opacity.toFixed(3))
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [config])

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      style={{ color }}
      className={className}
      aria-hidden="true"
    >
      <g ref={groupRef}>
        <path
          ref={pathRef}
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.1}
        />
        {Array.from({ length: MAX_PARTICLES }, (_, i) => (
          <circle
            key={i}
            ref={el => {
              particleRefs.current[i] = el
            }}
            fill="currentColor"
          />
        ))}
      </g>
    </svg>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

interface ColorPickerProps {
  label: string
  description: string
  value: string // HSL string like "233 100% 59%"
  onChange: (hsl: string) => void
}

function parseHslString(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.match(/(\d+(?:\.\d+)?)/g)
  if (!parts || parts.length < 3) return { h: 0, s: 50, l: 50 }
  return {
    h: Math.round(Number(parts[0])),
    s: Math.round(Number(parts[1])),
    l: Math.round(Number(parts[2])),
  }
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const toHex = (val: number): string => {
    const hex = Math.round((val + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function ColorPicker({ label, description, value, onChange }: ColorPickerProps): JSX.Element {
  const parsed = parseHslString(value)
  const [h, setH] = useState(parsed.h)
  const [s, setS] = useState(parsed.s)
  const [l, setL] = useState(parsed.l)
  const [hexInput, setHexInput] = useState(hslToHex(parsed.h, parsed.s, parsed.l))

  useEffect(() => {
    const p = parseHslString(value)
    setH(p.h)
    setS(p.s)
    setL(p.l)
    setHexInput(hslToHex(p.h, p.s, p.l))
  }, [value])

  const emitChange = useCallback((newH: number, newS: number, newL: number) => {
    onChange(`${newH} ${newS}% ${newL}%`)
  }, [onChange])

  const handleHue = (newH: number): void => {
    setH(newH)
    setHexInput(hslToHex(newH, s, l))
    emitChange(newH, s, l)
  }

  const handleSaturation = (newS: number): void => {
    setS(newS)
    setHexInput(hslToHex(h, newS, l))
    emitChange(h, newS, l)
  }

  const handleLightness = (newL: number): void => {
    setL(newL)
    setHexInput(hslToHex(h, s, newL))
    emitChange(h, s, newL)
  }

  const handleHexChange = (hex: string): void => {
    setHexInput(hex)
    if (hex.length === 7 && hex.startsWith('#')) {
      const result = hexToHsl(hex)
      if (result) {
        setH(result.h)
        setS(result.s)
        setL(result.l)
        emitChange(result.h, result.s, result.l)
      }
    }
  }

  return (
    <div className="space-y-2 rounded-lg border-2 border-retro-dark/10 p-3">
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded border-2 border-retro-dark/20"
          style={{ backgroundColor: `hsl(${h} ${s}% ${l}%)` }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-retro-dark">
            {label}
          </p>
          <p className="text-[10px] text-retro-dark/50 truncate">{description}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Hue slider */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-retro-dark/50 w-5">H</span>
          <input
            type="range"
            min={0}
            max={360}
            value={h}
            onChange={(e) => handleHue(Number(e.target.value))}
            className="color-slider flex-1 h-3 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
            }}
          />
          <span className="font-mono text-[10px] text-retro-dark/60 w-7 text-right">{h}</span>
        </div>

        {/* Saturation slider */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-retro-dark/50 w-5">S</span>
          <input
            type="range"
            min={0}
            max={100}
            value={s}
            onChange={(e) => handleSaturation(Number(e.target.value))}
            className="color-slider flex-1 h-3 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`,
            }}
          />
          <span className="font-mono text-[10px] text-retro-dark/60 w-7 text-right">{s}%</span>
        </div>

        {/* Lightness slider */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-retro-dark/50 w-5">L</span>
          <input
            type="range"
            min={0}
            max={100}
            value={l}
            onChange={(e) => handleLightness(Number(e.target.value))}
            className="color-slider flex-1 h-3 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`,
            }}
          />
          <span className="font-mono text-[10px] text-retro-dark/60 w-7 text-right">{l}%</span>
        </div>

        {/* Hex input */}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-mono text-[10px] text-retro-dark/50 w-5">Hex</span>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            className="flex-1 rounded border-2 border-retro-dark/15 bg-white px-2 py-0.5 font-mono text-xs text-retro-dark focus:border-retro-blue focus:outline-none"
            maxLength={7}
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  )
}

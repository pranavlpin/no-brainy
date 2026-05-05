'use client'

export function ThemePreview(): JSX.Element {
  return (
    <div className="space-y-4 rounded-lg border-2 border-retro-dark/15 bg-retro-cream p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">
        Live Preview
      </p>

      {/* Sample card with border */}
      <div className="rounded-lg border-2 border-retro-dark bg-white p-4">
        <h4 className="font-display text-sm font-bold text-retro-dark">
          Sample Card
        </h4>
        <p className="mt-1 text-xs text-retro-dark/70">
          This card uses the dark color for borders and text.
        </p>

        {/* Button */}
        <div className="mt-3 flex items-center gap-2">
          <button className="rounded border-2 border-retro-dark bg-retro-blue px-3 py-1 text-xs font-bold text-white shadow-[2px_2px_0px_0px] shadow-retro-dark">
            Primary Button
          </button>
          {/* Badge */}
          <span className="inline-flex items-center rounded-full bg-retro-pink px-2.5 py-0.5 text-[10px] font-bold text-white">
            Badge
          </span>
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-2 w-full rounded-full bg-retro-yellow" />

      {/* Progress bar */}
      <div className="space-y-1">
        <p className="font-mono text-[10px] text-retro-dark/50">Progress</p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-retro-dark/10">
          <div className="h-full w-2/3 rounded-full bg-retro-mint transition-all" />
        </div>
      </div>

      {/* Alert text */}
      <div className="rounded border-2 border-retro-orange/30 bg-retro-orange/10 px-3 py-2">
        <p className="text-xs font-semibold text-retro-orange">
          Warning: This is an alert using the orange color.
        </p>
      </div>

      {/* Color swatches row */}
      <div className="flex gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-blue" />
          <span className="text-[9px] text-retro-dark/50">Blue</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-pink" />
          <span className="text-[9px] text-retro-dark/50">Pink</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-yellow" />
          <span className="text-[9px] text-retro-dark/50">Yellow</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-mint" />
          <span className="text-[9px] text-retro-dark/50">Mint</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-orange" />
          <span className="text-[9px] text-retro-dark/50">Orange</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-dark" />
          <span className="text-[9px] text-retro-dark/50">Dark</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border border-retro-dark/20 bg-retro-cream" />
          <span className="text-[9px] text-retro-dark/50">Cream</span>
        </div>
      </div>
    </div>
  )
}

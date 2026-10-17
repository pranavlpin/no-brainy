/**
 * Fixed, decorative background: three slow aurora blobs tinted from the
 * active theme plus the dot grid. Purely presentational; still under
 * reduced motion via CSS.
 */
export function AppBackground() {
  return (
    <div aria-hidden className="aurora" data-testid="app-background">
      <div className="aurora__blob aurora__blob--a" />
      <div className="aurora__blob aurora__blob--b" />
      <div className="aurora__blob aurora__blob--c" />
      <div className="aurora__grid" />
    </div>
  )
}

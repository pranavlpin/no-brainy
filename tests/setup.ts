import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom does not implement matchMedia; motion and theme code query it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// jsdom lacks ResizeObserver, which Radix and framer-motion use.
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub })
}

// jsdom does not implement scrolling; Radix focus management calls it.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
}

// Node 26 exposes an experimental global `localStorage` that is undefined
// without --localstorage-file and shadows jsdom's. Provide an in-memory one.
{
  const g = globalThis as unknown as { localStorage?: Storage; window?: Window & typeof globalThis }
  const broken = !g.localStorage || typeof g.localStorage.getItem !== 'function'
  if (broken) {
    const store = new Map<string, string>()
    const memoryStorage: Storage = {
      get length() {
        return store.size
      },
      clear: () => store.clear(),
      getItem: (k) => (store.has(k) ? store.get(k)! : null),
      key: (i) => Array.from(store.keys())[i] ?? null,
      removeItem: (k) => {
        store.delete(k)
      },
      setItem: (k, v) => {
        store.set(k, String(v))
      },
    }
    Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true })
    if (g.window)
      Object.defineProperty(g.window, 'localStorage', { value: memoryStorage, configurable: true })
  }
}

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
let search = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => search,
}))
const signIn = vi.fn()
vi.mock('next-auth/react', () => ({ signIn: (...args: unknown[]) => signIn(...args) }))
vi.mock('@/components/auth/google-button', () => ({ GoogleButton: () => null }))

import { LoginForm } from '@/components/auth/login-form'

async function submit() {
  await userEvent.type(screen.getByLabelText(/email/i), 'owner@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
}

describe('LoginForm', () => {
  beforeEach(() => {
    push.mockReset()
    signIn.mockReset()
    signIn.mockResolvedValue({ error: null })
    search = new URLSearchParams()
  })

  it('declares a POST form so a pre-hydration submit never puts credentials in the URL', () => {
    const { container } = render(<LoginForm />)
    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
  })

  it('returns to a same-origin callbackUrl after signing in', async () => {
    search = new URLSearchParams({
      callbackUrl: `${window.location.origin}/planner?week=2026-10-12`,
    })
    render(<LoginForm />)
    await submit()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/planner?week=2026-10-12'))
  })

  it('ignores a callbackUrl on another origin and goes home', async () => {
    search = new URLSearchParams({ callbackUrl: 'https://evil.example/steal' })
    render(<LoginForm />)
    await submit()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
  })
})

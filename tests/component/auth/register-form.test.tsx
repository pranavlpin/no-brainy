import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('@/components/auth/google-button', () => ({ GoogleButton: () => null }))

import { RegisterForm } from '@/components/auth/register-form'

describe('RegisterForm', () => {
  it('declares a POST form so a pre-hydration submit never puts the password in the URL', () => {
    const { container } = render(<RegisterForm />)
    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
  })
})

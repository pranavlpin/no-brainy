import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign In - NoBrainy',
}

export default function LoginPage() {
  // LoginForm reads `callbackUrl` with useSearchParams, which needs a boundary.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

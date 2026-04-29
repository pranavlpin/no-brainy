'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Input } from '@/components/ui/input'
import { GoogleButton } from '@/components/auth/google-button'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [serverError, setServerError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const result = loginSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginInput
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (res?.error) {
        setServerError('Invalid email or password')
        return
      }

      router.push('/notes')
    } catch {
      setServerError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-retro-dark">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {serverError && (
          <div className="border-2 border-red-300 bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="rounded-none border-2 border-retro-dark/30 pl-9 focus:border-retro-blue"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="rounded-none border-2 border-retro-dark/30 pl-9 focus:border-retro-blue"
              disabled={isLoading}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center border-2 border-retro-dark bg-retro-blue py-2.5 font-mono font-bold text-sm text-white shadow-hard hover-shadow-grow disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>

      {/* OAuth section — hidden for now, will add back later
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t-2 border-retro-dark/15" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 font-mono text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <GoogleButton />
      */}

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-mono font-medium text-retro-blue hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

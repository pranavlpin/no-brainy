import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth/password'
import type { NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}

const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await comparePassword(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        })

        if (existingUser) {
          // Update existing user with Google info if they signed up with email
          if (existingUser.provider === 'email') {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                provider: 'google',
                avatarUrl: existingUser.avatarUrl || (profile.picture as string) || null,
                name: existingUser.name || profile.name || null,
                lastActiveAt: new Date(),
              },
            })
          } else {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastActiveAt: new Date() },
            })
          }
          // Set the user id so JWT callback can use it
          user.id = existingUser.id
        } else {
          // Create new user for Google sign-in
          const newUser = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || null,
              avatarUrl: (profile.picture as string) || null,
              provider: 'google',
            },
          })
          user.id = newUser.id
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

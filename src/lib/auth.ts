/**
 * 🎓 LEARNING: NextAuth Configuration
 * ===================================
 * This file configures authentication for the entire application.
 *
 * Key Concepts:
 * - NextAuth handles session management, cookies, and JWT tokens
 * - PrismaAdapter syncs auth data to database (Account, Session, User tables)
 * - CredentialsProvider allows custom login logic (email-only for Stage 1)
 * - Callbacks modify JWT tokens and session objects to include custom data
 *
 * Flow:
 * 1. User submits credentials → authorize() validates
 * 2. User object returned → jwt() callback adds custom fields to token
 * 3. Token stored in HTTP-only cookie (secure)
 * 4. On each request → session() callback creates session from token
 * 5. Components use useSession() or getServerSession() to access session
 */

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import type { UserRole } from '@prisma/client'

/**
 * 🎓 NextAuth Options
 * Configuration object for authentication
 */
export const authOptions: NextAuthOptions = {
  // Prisma adapter syncs auth data to database
  adapter: PrismaAdapter(prisma),

  // Authentication providers
  providers: [
    /**
     * 🎓 Credentials Provider
     * Stage 1: Email-only authentication (MVP simplification)
     * TODO: Stage 2 - Add password validation with bcrypt
     */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        // TODO: Stage 2 - Uncomment and implement password validation
        // password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // TODO: Add email validation here
        // const validation = signInSchema.safeParse(credentials)
        // if (!validation.success) return null

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        })

        if (!user) {
          return null
        }

        // TODO: Stage 2 - Verify password
        // const validPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        // if (!validPassword) return null

        // Return user object (will be added to JWT token)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],

  // Use JWT strategy for sessions (stateless, no database queries per request)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * 🎓 Callbacks
   * These functions run at specific points in the auth flow
   */
  callbacks: {
    /**
     * JWT callback - runs when token is created or updated
     * Use this to add custom fields to the JWT token
     */
    async jwt({ token, user, trigger }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }

      // TODO: Handle token refresh
      // if (trigger === 'update') {
      //   // Fetch fresh user data from database
      // }

      return token
    },

    /**
     * Session callback - runs whenever session is accessed
     * Use this to add token data to the session object
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as UserRole
      }
      return session
    },
  },

  /**
   * 🎓 Custom Pages
   * Redirect to our custom sign-in page
   */
  pages: {
    signIn: '/auth/signin',
    // TODO: Add more custom pages
    // signOut: '/auth/signout',
    // error: '/auth/error',
    // verifyRequest: '/auth/verify',
  },

  /**
   * 🎓 Security Options
   */
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug logs in development
  debug: process.env.NODE_ENV === 'development',
}

/**
 * 🎓 Type Declarations
 * Extend NextAuth types to include our custom fields
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}
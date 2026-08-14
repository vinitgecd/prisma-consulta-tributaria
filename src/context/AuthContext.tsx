import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { getActiveAssinatura, type Assinatura } from '@/services/assinaturas'

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  assinatura: Assinatura | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshAssinatura: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toAuthUser(record: unknown): AuthUser {
  const r = record as { id: string; email: string; name?: string }
  return {
    id: r.id,
    email: r.email,
    name: r.name || r.email.split('@')[0],
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAssinatura = useCallback(async () => {
    if (!pb.authStore.isValid) {
      setAssinatura(null)
      return
    }
    const ass = await getActiveAssinatura()
    setAssinatura(ass)
  }, [])

  // Bootstrap from stored token on mount
  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      if (pb.authStore.isValid && pb.authStore.record) {
        const u = toAuthUser(pb.authStore.record)
        if (!cancelled) setUser(u)
        await refreshAssinatura()
      } else {
        if (!cancelled) setUser(null)
      }
      if (!cancelled) setLoading(false)
    }
    bootstrap()
    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid && pb.authStore.record) {
        setUser(toAuthUser(pb.authStore.record))
      } else {
        setUser(null)
        setAssinatura(null)
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [refreshAssinatura])

  const login = useCallback(
    async (email: string, password: string) => {
      const authRecord = await pb.collection('users').authWithPassword(email, password)
      setUser(toAuthUser(authRecord.record))
      await refreshAssinatura()
    },
    [refreshAssinatura],
  )

  const signup = useCallback(async (name: string, email: string, password: string) => {
    // Create the user
    await pb.collection('users').create({
      name,
      email,
      password,
      passwordConfirm: password,
    })
    // Authenticate immediately
    const authRecord = await pb.collection('users').authWithPassword(email, password)
    setUser(toAuthUser(authRecord.record))
    // No active subscription yet for a brand-new user
    setAssinatura(null)
  }, [])

  const logout = useCallback(() => {
    pb.authStore.clear()
    setUser(null)
    setAssinatura(null)
  }, [])

  const value: AuthContextValue = {
    user,
    assinatura,
    loading,
    login,
    signup,
    logout,
    refreshAssinatura,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

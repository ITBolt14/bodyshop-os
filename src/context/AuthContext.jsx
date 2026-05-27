// =============================================
// BODYSHOP OS — Auth Context
// Fixed: stable loading state, no double-fetch
// =============================================

import { createContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  // SECTION: State
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Ref to prevent concurrent profile fetches
  const fetchingRef = useRef(false)

  // SECTION: Fetch Profile
  const fetchProfile = async (userId) => {
    if (fetchingRef.current) return null
    fetchingRef.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, branches(*)')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error.message)
        return null
      }
      return data
    } finally {
      fetchingRef.current = false
    }
  }

  // SECTION: Session Init + Auth Listener
  useEffect(() => {
    let mounted = true

    // Get initial session once
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.id)
        if (mounted) setProfile(prof)
      }

      if (mounted) setLoading(false)
    })

    // Listen for auth changes — only act on SIGNED_IN, SIGNED_OUT
    // Ignore TOKEN_REFRESHED and other noise events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.id)
          if (mounted) {
            setProfile(prof)

            // Update last login timestamp
            supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id)
              .then(() => {})
          }
          return
        }

        if (event === 'PASSWORD_RECOVERY' && session?.user) {
          setUser(session.user)
          return
        }

        // TOKEN_REFRESHED — update user token silently, no profile refetch
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          return
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // SECTION: Auth Methods
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { error }
    return { data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    return { error }
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  // SECTION: Role Helpers
  const hasRole    = (role)  => profile?.role === role
  const hasAnyRole = (roles) => roles.includes(profile?.role)
  const isActive   = ()      => profile?.active === true

  const isSuperAdmin  = () => hasRole('super_admin')
  const isBranchAdmin = () => hasAnyRole(['super_admin', 'branch_admin'])
  const isStaff       = () => hasAnyRole([
    'super_admin', 'branch_admin', 'manager',
    'estimator', 'technician', 'receptionist',
  ])
  const isAssessor = () => hasRole('assessor')
  const isCustomer = () => hasRole('customer')

  // SECTION: Context Value
  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
    hasAnyRole,
    isActive,
    isSuperAdmin,
    isBranchAdmin,
    isStaff,
    isAssessor,
    isCustomer,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
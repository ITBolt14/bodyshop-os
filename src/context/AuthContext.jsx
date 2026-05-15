// ===============================================
// BODYSHOP OS - Auth Context
// ===============================================

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  
  // SECTION: State
  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState(null)

  // SECTION: Fetch Profile
  const fetchProfile = async (userId) => {
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
  }

  // SECTION: Session Listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.id)
        setProfile(prof)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.id)
          setProfile(prof)

          // Update last_login on sign in
          if (event === 'SIGNED IN') {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // SECTION: Auth Methods
  const signIn = async (email, password) => {
    setAuthError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setAuthError(error.message)
      return { error }
    }
    return { data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } =await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    return { error }
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error }
  }

  // SECTION: Role Helpers
  const hasRole     = (role)    => profile?.role === role
  const hasAnyRole  = (roles)   => roles.includes(profile?.role)
  const isActive    = ()        => profile?.active === true

  const isSuperAdmin    = () => hasRole('super_admin')
  const isBranchAdmin   = () => hasAnyRole(['super_admin', 'branch_admin'])
  const isStaff         = () => hasAnyRole([
    'super_admin', 'branch_admin', 'manager',
    'estimator', 'technician', 'receptionist'
  ])
  const isAssessor      = () => hasRole('assessor')
  const isCustomer      = () => hasRole('customer')

  // SECTION: Context Value
  const value = {
    user,
    profile,
    loading,
    authError,
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

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }
  return context
}
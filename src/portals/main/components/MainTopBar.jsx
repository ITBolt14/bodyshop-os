// ===============================================
// BODYSHOP OS - Main System Top Bar
// ===============================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useBranch } from '../../../hooks/useBranch'
import { toast } from 'react-hot-toast'

// SECTION: Role Display Label
const ROLE_LABELS = {
  super_admin:  'Super Admin',
  branch_admin: 'Branch Admin',
  manager:      'Manager',
  estimator:    'Estimator',
  receptionist: 'Receptionist',
  technician:   'Technician',
  assessor:     'Assessor',
  customer:     'Customer',
}

export function MainTopBar({ onMenuToggle }) {
  
  // SECTION: State
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef                     = useRef(null)

  const { profile, signOut }            = useAuth()
  const { branchName }                  = useBranch()
  const navigate                        = useNavigate()

  // SECTION: Close Dropdown On Outside Click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // SECTION: Sign Out
  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully.')
    navigate('/login', { replace: true })
  }

  // SECTION: Render
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center
                       justify-between px-4 shrink-0 z-10">
    
      {/* Left - Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100
                     hover:text-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Page breadcrumb placeholder - populated per page in Phase 2B */}
        <div className="hidden sm:block">
          <p className="text-sm text-gray-400">{branchName ?? ''}</p>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">

        {/* Notifications Bell */}
        <button
          className="relative p-1.5 rounded-lg text-gray-500
                     hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Unread badge - wired up in Phase 2B */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500
                           rounded-full" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg
                       hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center
                            justify-center text-white text-xs font-bold shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>

            {/* Name + Role */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {profile?.full_name ?? 'Loading...'}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">
                {ROLE_LABELS[profile?.role] ?? ''}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200
                          ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white
                            rounded-xl shadow-lg border border-gray-100
                            py-1 z-50">
            
              {/* Profile */}
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/main/admin/profile')
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5
                           text-sm text-gray-700 hover:bg-gray-50
                           transition-colors"
              >
                <User size={15} className="text-gray-400" />
                My Profile
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/main/admin')
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5
                           text-sm text-gray-700 hover:bg-gray-50
                           transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                  Settings
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5
                           text-sm text-red-600 hover:bg-red-50
                           transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  )
}
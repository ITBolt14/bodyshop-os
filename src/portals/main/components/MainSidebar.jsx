// ===============================================
// BODYSHOP OS - Main System Sidebar
// ===============================================

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useBranch } from '../../../hooks/useBranch'
import {
  LayoutDashboard, Briefcase, FileText, Shield,
  Package, DollarSign, Users, Heart, BarChart2,
  FolderOpen, Wrench, Settings, ChevronDown,
  ChevronRight, Building2
} from 'lucide-react'

// SECTION: Nav Item Definitions
const NAV_ITEMS = [
  {
    key:        'dashboard',
    label:      'Dashboard',
    icon:       LayoutDashboard,
    path:       '/main/dashboard',
    roles:      ['super_admin','branch_admin','manager','estimator','receptionist','technician'],
    built:      true,
  },
  {
    key:        'jobs',
    label:      'Jobs',
    icon:       Briefcase,
    roles:      ['super_admin','branch_admin','manager','estimator','receptionist'],
    built:      false,
    children:   [
     { label:   'Job List',         path: '/main/jobs',             built: false },
     { label:   'New Check-In',     path: '/main/jobs/checkin',     built: false },
     { label:   'Floor Monitor',    path: '/main/jobs/monitor',     built: false },
    ],
  },
  {
    key:        'estimating',
    label:      'Estimating',
    icon:       FileText,
    roles:      ['super_admin','branch_admin','manager','estimator'],
    built:      false,
    children:   [
      { label:  'Quotes',           path: '/main/estimating/quotes',    built: false },
      { label:  'New Quote',        path: '/main/estimating/new',       build: false },
      { label:  'Audatex Import',   path: '/main/estimating/audatex',   build: false },
    ],
  },
  {
    key:        'insurance',
    label:      'Insurance',
    icon:       Shield,
    roles:      ['super_admin','branch_admin','manager','estimator','receptionist'],
    built:      false,
    children:   [
      { label:  'Claims',           path: '/main/insurance/claims',     built: false },
      { label:  'Authorisations',   path: '/main/insurance/auth',       built: false },
      { label:  'Insurers',         path: '/main/insurance/insurers',   built: false },
    ],
  },
  {
    key:        'parts',
    label:      'Parts',
    icon:       Package,
    roles:      ['super_admin','branch_admin','manager','estimator'],
    built:      false,
    children:   [
      { label:  'Parts Orders',     path: '/main/parts/orders',     built: false },
      { label:  'Inventory',        path: '/main/parts/inventory',  built: false },
      { label:  'Suppliers',        path: '/main/parts/suppliers',  built: false },
    ],
  },
  {
    key:        'financials',
    label:      'Financials',
    icon:       DollarSign,
    roles:      ['super_admin','branch_admin','manager'],
    built:      false,
    children:   [
      { label:  'Debtors',      path: '/main/financials/debtors',       built: false },
      { label:  'Creditors',    path: '/main/financials/creditors',     built: false },
      { label:  'Job Costing',  path: '/main/financials/costing',       built: false },
      { label:  'Statements',   path: '/main/financials/statements',    built: false },
    ],
  },
  {
    key:        'hr',
    label:      'HR & Payroll',
    icon:       Users,
    roles:      ['super_admin','branch_admin','manager'],
    built:      false,
    children:   [
      { label:  'Staff',        path: '/main/hr/staff',         built: false },
      { label:  'Timesheets',   path: '/main/hr/timesheets',    built: false },
      { label:  'Payroll',      path: '/main/hr/payroll',       built: false },
    ],
  },
  {
    key:        'crm',
    label:      'CRM',
    icon:       Heart,
    roles:      ['super_admin','branch_admin','manager','receptionist'],
    built:      false,
    children:   [
      { label:  'Customers',        path: '/main/crm/customers',    built: false },
      { label:  'Vehicles',         path: '/main/crm/vehicles',     built: false },
      { label:  'Communications',   path: '/main/crm/comms',        built: false },
    ],
  },
  {
    key:        'reports',
    label:      'Reports',
    icon:       BarChart2,
    roles:      ['super_admin','branch_admin','manager'],
    built:      false,
    children:   [
      { label:  'WIP Report',       path: '/main/reports/wip',              built: false },
      { label:  'Productivity',     path: '/main/reports/productivity',     built: false },
      { label:  'Financial',        path: '/main/reports/financial',        built: false },
    ],
  },
  {
    key:        'documents',
    label:      'Documents',
    icon:       FolderOpen,
    roles:      ['super_admin','branch_admin','manager','estimator','receptionist'],
    built:      false,
    children:   [
      { label:  'All Documents',    path: '/main/documents',            built: false },
      { label:  'Templates',        path: '/main/documents/templates',  built: false },
    ],
  },
  {
    key:        'workshop',
    label:      'Workshop',
    icon:       Wrench,
    roles:      ['super_admin','branch_admin','manager','technician'],
    built:      false,
    children:   [
      { label:  'Clocking',         path: '/main/workshop/clocking',    built: false },
      { label:  'Stage Overview',   path: '/main/workshop/stages',      built: false },
    ],
  },
  {
    key:        'admin',
    label:      'Admin',
    icon:       Settings,
    roles:      ['super_admin','branch_admin'],
    built:      false,
    children:   [
      { label:  'Branches',     path: '/main/admin/branches',       built: false },
      { label:  'Users',        path: '/main/admin/users',          built: false },
      { label:  'Roles',        path: '/main/admin/roles',          built: false },
      { label:  'Integrations', path: '/main/admin/integrations',   built: false },
      { label:  'Audit Log',    path: '/main/admin/audit',          built: false },
    ],
  },
]

// SECTION: Coming Soon Badge
function ComingSoonBadge() {
  return (
    <span className="ml-auto text-[9px] font-bold uppercase tracking-wide
                     bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full
                     whitespace-nowrap">
      Soon
    </span>
  )
}

// SECTION: Nav Item Component
function NavItem({ item, collapsed }) {
  const location        = useLocation()
  const [open, setOpen] = useState(
    // Auto-expand if current path is inside this section
    item.children?.some(c => location.pathname.startsWith(c.path)) ?? false
  )

  const hasChildren     = item.children && item.children.length > 0
  const Icon            = item.icon
  const isActive        = !hasChildren && location.pathname === item.path
  const isSectionActive = hasChildren &&
    item.children.some(c => location.pathname.startsWith(c.path))

  // SECTION: Single Item (no children)
  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-all duration-150 group
                    ${isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {!item.built && <ComingSoonBadge />}
          </>
        )}
      </NavLink>
    )
  }

  // SECTION: Expandable Item (has children)
  return (
    <div>
      <button
        onClick={() => !collapsed && setOpen(prev => !prev)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-all duration-150
                    ${isSectionActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {!item.built && <ComingSoonBadge />}
            {open
              ? <ChevronDown size={14} className="shrink-0 text-gray-400" />
              : <ChevronRight size={14} className="shrink-0 text-gray-400" />
            }
          </>
        )}
      </button>

      {/* Sub-menu Items */}
      {!collapsed && open && (
        <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
          {item.children.map(child => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-2 py-2 rounded-md
                 text-xs font-medium transition-all duration-150
                 ${isActive
                  ? 'text-brand-700 bg-brand-50 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                 }`
              }
            >
              <span>{child.label}</span>
              {!child.built && <ComingSoonBadge />}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// SECTION: Main Sidebar Component
export function MainSideBar({ open, onToggle }) {
  const { profile }     = useAuth()
  const { branchName }  = useBranch()
  const collapsed       = !open

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(profile?.role)
  )

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200
                  transition-all duration-300 ease-in-out shrink-0
                  ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* SECTION: Logo & Branch */}
      <div className={`flex flex-col items-center justify-center
                       border-b border-gray-200 px-4
                       ${collapsed ? 'px-2' : 'px-4'}`}>

        {/* Logo Placeholder */}
        <div className={`bg-brand-600 rounded-xl flex items-center
                         justify-center shrink-0
                         ${collapsed ? 'w-9 h-9' : 'w-12 h-12 mb-2'}`}>
          <Building2
            size={collapsed ? 18 : 24}
            className="text-white"
          />
        </div>

        {/* Branch Name */}
        {!collapsed && (
          <div className="text-center mt-1">
            <p className="text-xs font-bold text-brand-700 uppercase
                          tracking-wider leading-right">
              BodyShop OS
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
              {branchName ?? 'Loading...'}
            </p>
          </div>
        )}
      </div>

      {/* SECTION: Navigation*/}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => (
          <NavItem
            key={item.key}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* SECTION: Collapse Toggler */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2
                     px-3 py-2 rounded-lg text-xs text-gray-500
                     hover:bg-gray-100 hover:text-gray-700
                     transition-colors duration-150"
        >
          {collapsed
            ? <ChevronRight size={16} />
            : (
              <>
              <ChevronDown
                size={16}
                className="rotate-90"
              />
              <span>Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </aside>
  )
}
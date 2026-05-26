// ===============================================
// BODYSHOP OS - Audit Action Labels
// Central map of every audit action string
// to a human-readable label and category
// Add every new action here as modules are built
// ===============================================

// SECTION: Action Defintions
// key:      the action string stored in audit_log.action
// label:    friendly display name shown in UI
// category: used for filtering and colour coding
// icon:     lucide icon name (applied in UI components)

export const AUDIT_ACTIONS = {
  
  // SECTION: Job Actions
  'job.created':            { label: 'Job Created',         category: 'job',        color: 'green'  },
  'job.updated':            { label: 'Job Updated',         category: 'job',        color: 'blue'   },
  'job.deleted':            { label: 'Job Deleted',         category: 'job',        color: 'red'    },
  'job.status.changed':     { label: 'Status Changed',      category: 'job',        color: 'brand'  },
  'job.priority.changed':   { label: 'Priority Changed',    category: 'job',        color: 'yellow' },
  'job.assigned':           { label: 'Job Assigned',        category: 'job',        color: 'blue'   },
  'job.completed':          { label: 'Job Completed',       category: 'job',        color: 'green'  },
  'job.cancelled':          { label: 'Job Cancelled',       category: 'job',        color: 'red'    },
  'job.reopened':           { label: 'Job Reopened',        category: 'job',        color: 'yellow' },

  // SECTION: Vehicle Actions
  'vehicle.created':        { label: 'Vehicle Added',       category: 'vehicle',    color: 'green'  },
  'vehicle.updated':        { lable: 'Vehicle Updated',     category: 'vehicle',    color: 'blue'   },
  'vehicle.checked_in':     { label: 'Vehicle Checked In',  category: 'vehicle',    color: 'brand'  },
  'vehicle.checked_out':    { label: 'Vehicle Checked Out', category: 'vehicle',    color: 'green'  },

  // SECTION: Claim Actions
  'job_claim.created':          { label: 'Claim Created',           category: 'claim',      color: 'green'  },
  'job_claim.updated':          { label: 'Claim Updated',           category: 'claim',      color: 'blue'   },
  'job_claim.status.changed':   { label: 'Claim Status Changed',    category: 'claim',      color: 'brand'  },
  'job_claim.authorized':       { label: 'Claim Authorised',        category: 'claim',      color: 'green'  },
  'job_claim.rejected':         { label: 'Claim Rejected',          category: 'claim',      color: 'red'    },
  'job_claim.queried':          { label: 'Claim Queried',           category: 'claim',      color: 'yellow' },
  'job_claim.excess.collected': { label: 'Excess Collected',        category: 'claim',      color: 'green'  },
  'job_claim.supplementary':    { label: 'Supplementary Submitted', category: 'claim',      color: 'yellow' },

  // SECTION: Assessor Actions
  'assessor.appointed':     { label: 'Assessor Appointed',      category: 'assessor',   color: 'purple' },
  'assessor.revoked':       { label: 'Assessor Access Revoked', category: 'assessor',   color: 'red'    },
  'assessor.completed':     { label: 'Assessment Completed',    category: 'assessor',   color: 'green'  },

  // SECTION: Workshop / Stage Actions
  'stage.created':          { label: 'Stage Created',           category: 'workshop',   color: 'green'  },
  'stage.started':          { label: 'Stage Started',           category: 'workshop',   color: 'blue'   },
  'stage.activated':        { label: 'Stage Activated',         category: 'workshop',   color: 'blue'   },
  'stage.completed':        { label: 'Stage Completed',         category: 'workshop',   color: 'green'  },
  'stage.skipped':          { label: 'Stage Skipped',           category: 'workshop',   color: 'gray'   },
  'stage.paused':           { label: 'Stage Paused',            category: 'workshop',   color: 'yellow' },
  'stage.reassigned':       { label: 'Stage Reassigned',        category: 'workshop',   color: 'blue'   },
  'clocking.in':            { label: 'Clocked In',              category:' workshop',   color: 'green'  },
  'clocking_on':            { label: 'Clocked On',              category: 'Workshop',   color: 'green'  },
  'clocking.out':           { label: 'Clocked Out',             category: 'workshop',   color: 'gray'   },
  'clocking.off.manual':    { label: 'Auto Clocked Off',        category: 'workshop',   color: 'gray'   },
  'clocking.off.eod':       { label: 'End of Day Clock-Off',    category: 'workshop',   color: 'gray'   },
  'clocking.off.admin':     { label: 'Admin Clock-Off',         category: 'workshop',   color: 'yellow' },

  // SECTION: Document Actions
  'document.uploaded':      { label: 'Document Uploaded',       category: 'document',   color: 'blue'   },
  'document.deleted':       { label: 'Document Deleted',        category: 'document',   color: 'red'    },
  'document.signed':        { label: 'Document Signed',         category: 'document',   color: 'green'  },
  'document.sent':          { label: 'Document Sent',           category: 'document',   color: 'blue'   },
  'photo.uploaded':         { label: 'Photo Uploaded',          category: 'document',   color: 'blue'   },

  // SECTION: Parts Actions
  'parts.ordered':          { label: 'Parts Ordered',           category: 'parts',      color: 'blue'   },
  'parts.received':         { label: 'Parts Received',          category: 'parts',      color: 'green'  },
  'parts.returned':         { label: 'Parts Returned',          category: 'parts',      color: 'yellow' },
  'parts.cancelled':        { label: 'Parts Order Cancelled',   category: 'parts',      color: 'red'    },

  // SECTION: Financial Actions
  'invoice.created':        { label: 'Invoice Created',         category: 'financial',  color: 'green'  },
  'invoice.sent':           { label: 'Invoice Sent',            category: 'financial',  color: 'blue'   },
  'invoice.paid':           { label: 'Invoice Paid',            category: 'financial',  color: 'green'  },
  'payment.received':       { label: 'Payment Received',        category: 'financial',  color: 'green'  },
  'credit.note.issued':     { label: 'Credit Note Issued',      category: 'financial',  color: 'yellow' },

  // SECTION: Notification Actions
  'notification.sent.whatsapp': { label: 'WhatsApp Sent',       category: 'comms',  color: 'green'  },
  'notification.sent.sms':      { label: 'SMS Sent',            category: 'comms',  color: 'blue'   },
  'notification.sent.email':    { label: 'Email Sent',          category: 'comms',  color: 'blue'   },
  'notification.failed':        { label: 'Notification Failed', category: 'comms',  color: 'red'    },

  // SECTION: CRM Actions
  'customer.created':   { label: 'Customer Created',    category: 'crm',    color: 'green'  },
  'customer.updated':   { label: 'Customer Updated',    category: 'crm',    color: 'blue'   },
  'note.added':         { label: 'Note Added',          category: 'crm',    color: 'yellow' },
  'note.edited':        { label: 'Note Edited',         category: 'crm',    color: 'blue'   },

  // SECTION: User & Auth Actions
  'user.login':          { label: 'User Logged In',     category: 'auth',   color: 'gray'   },
  'user.logout':         { label: 'User Logged Out',    category: 'auth',   color: 'gray'   },
  'user.created':        { label: 'User Created',       category: 'auth',   color: 'green'  },
  'user.updated':        { label: 'User Updated',       category: 'auth',   color: 'blue'   },
  'user.deactivated':    { label: 'User Deactivated',   category: 'auth',   color: 'red'    },
  'user.password.reset': { label: 'Password Reset',     category: 'auth',   color: 'yellow' },
  'user.role.changed':   { label: 'Role Changed',       category: 'auth',   color: 'red'    },

  // SECTION: System & Admin Actions
  'branch.created':     { label: 'Branch Created',      category: 'admin',  color: 'green'  },
  'branch.updated':     { label: 'Branch Updated',      category: 'admin',  color: 'blue'   },
  'insurer.created':    { label: 'Insurer Added',       category: 'admin',  color: 'green'  },
  'insurer.updated':    { label: 'Insurer Updated',     category: 'admin',  color: 'blue'   },
  'settings.updated':   { label: 'Settings Updated',    category: 'admin',  color: 'blue'   },

  // SECTION: Estimating Actions
  'estimate.created':               { label: 'Estimate Created',    category: 'estimate',   color: 'green'  },
  'estimate.updated':               { label: 'Estimate Updated',    category: 'estimate',   color: 'blue'   },
  'estimate.submitted':             { label: 'Estimate Submitted',  category: 'estimate',   color: 'brand'  },
  'estimate.approved':              { label: 'Estimate Approved',   category: 'estimate',   color: 'green'  },
  'estimate.partially_approved':    { label: 'Partially Approved',  category: 'estimate',   color: 'yellow' },
  'estimate.rejected':              { label: 'Estimate Rejected',   category: 'estimate',   color: 'red'    },
  'estimate.revised':               { label: 'Estimate Revised',    category: 'estimate',   color: 'blue'   },
  'estimate.line.added':            { label: 'Line Item Added',     category: 'estimate',   color: 'green'  },
  'estimate.line.removed':          { label: 'Line Item Removed',   category: 'estimate',   color: 'red'    },
  'rate_card.created':              { label: 'Rate Card Created',   category: 'admin',      color: 'green'  },
  'rate_card.updated':              { label: 'Rate Card Updated',   category: 'admin',      color: 'blue'   },
  
}

// SECTION: Category Display Config
// Used for filter dropdowns and colour coding in the UI
export const AUDIT_CATEGORIES = {
  job:          { label: 'Jobs',            color: 'blue'   },
  vehicle:      { label: 'Vehicles',        color: 'gray'   },
  claim:        { label: 'Claims',          color: 'purple' },
  assessor:     { label: 'Assessors',       color: 'purple' },
  workshop:     { label: 'Workshop',        color: 'orange' },
  document:     { label: 'Documents',       color: 'blue'   },
  parts:        { label: 'Parts',           color: 'yellow' },
  financial:    { label: 'Financials',      color: 'green'  },
  comms:        { label: 'Comms',           color: 'green'  },
  crm:          { label: 'CRM',             color: 'pink'   },
  auth:         { label: 'Users & Auth',    color: 'gray'   },
  admin:        { label: 'Admin',           color: 'red'    },
  estimate:     { label: 'Estimating',      color: 'blue'   },
}

// SECTION: Color Map
// Maps color names to Tailwind classes for badges
export const AUDIT_COLOR_MAP = {
  green:    { bg: 'bg-green-100',   text: 'text-green-700'  },
  blue:     { bg: 'bg-blue-100',    text: 'text-blue-700'   },
  red:      { bg: 'bg-red-100',     text: 'text-red-700'    },
  yellow:   { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  purple:   { bg: 'bg-purple-100',  text: 'text-purple-700' },
  orange:   { bg: 'bg-orange-100',  text: 'text-orange-700' },
  pink:     { bg: 'bg-pink-100',    text: 'text-pink-700'   },
  gray:     { bg: 'bg-gray-100',    text: 'text-gray-600'   },
  brand:    { bg: 'bg-brand-100',   text: 'text-brand-700'  },
}

// SECTION: Helper Functions

// Get friendly label for an action string
// Falls back to formatting the raw action string if not in the map
export function getActionLabel(action) {
  if (!action) return '-'
  return AUDIT_ACTIONS[action]?.label
    ?? action
      .split('.')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
}

// Get color classes for an action badge
export function getActionColors(action) {
  const color = AUDIT_ACTIONS[action]?.color ?? 'gray'
  return AUDIT_COLOR_MAP[color] ?? AUDIT_COLOR_MAP.gray
}

// Get category for an action
export function getActionCategory(action) {
  const category = AUDIT_ACTIONS[action]?.category ?? 'admin'
  return AUDIT_CATEGORIES[category] ?? AUDIT_CATEGORIES.admin
}
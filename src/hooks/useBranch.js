// ===============================================
// BODYSHOP OS - useBranch Hook
// ===============================================

import { useAuth } from './useAuth'

export function useBranch() {
  const { profile } = useAuth()

  return {
    branchId:   profile?.branch_id      ?? null,
    branchName: profile?.branches?.name ?? null,
    branch:     profile?.branches       ?? null,
  }
}
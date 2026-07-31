'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { WorkspaceRoleOrOwner } from '@/lib/workspace';

interface WorkspaceRoleContextValue {
  role: WorkspaceRoleOrOwner;
  isOwner: boolean;
  workspaceId: string;
  ownerId: string;
}

const WorkspaceRoleContext = createContext<WorkspaceRoleContextValue | null>(
  null,
);

export function WorkspaceRoleProvider({
  role,
  isOwner,
  workspaceId,
  ownerId,
  children,
}: WorkspaceRoleContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ role, isOwner, workspaceId, ownerId }),
    [role, isOwner, workspaceId, ownerId],
  );
  return (
    <WorkspaceRoleContext.Provider value={value}>
      {children}
    </WorkspaceRoleContext.Provider>
  );
}

export function useWorkspaceRole(): WorkspaceRoleContextValue {
  const ctx = useContext(WorkspaceRoleContext);
  if (!ctx) {
    return {
      role: 'OWNER',
      isOwner: true,
      workspaceId: '',
      ownerId: '',
    };
  }
  return ctx;
}

export function useIsWorkspaceOwner(): boolean {
  return useWorkspaceRole().isOwner;
}

export function useHasWorkspaceRole(
  ...roles: WorkspaceRoleOrOwner[]
): boolean {
  const { role } = useWorkspaceRole();
  return roles.includes(role);
}

export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: WorkspaceRoleOrOwner[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useWorkspaceRole();
  return <>{allow.includes(role) ? children : fallback}</>;
}

export function OwnerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isOwner } = useWorkspaceRole();
  return <>{isOwner ? children : fallback}</>;
}

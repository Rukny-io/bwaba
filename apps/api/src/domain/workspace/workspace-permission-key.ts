import { SetMetadata } from '@nestjs/common';
import { WorkspacePermission } from './workspace-permissions.config';

export const WORKSPACE_PERMISSIONS_KEY = 'workspace:permissions';

/**
 * يعلن الصلاحيات المطلوبة على الـ endpoint. أي صلاحية من القائمة كافية.
 *
 * @example
 * @UseGuards(JwtAuthGuard, WorkspaceGuard)
 * @RequiresWorkspacePermission('developer:apps:write')
 * create() { ... }
 */
export const RequiresWorkspacePermission = (
  ...permissions: WorkspacePermission[]
) => SetMetadata(WORKSPACE_PERMISSIONS_KEY, permissions);

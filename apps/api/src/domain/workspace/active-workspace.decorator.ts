import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { WorkspaceContext } from './workspace-context.middleware';

/**
 * يجلب `WorkspaceContext` الحالي المُلحق بواسطة `WorkspaceContextMiddleware`.
 * يرمي 500 إذا استُخدم على مسار عام أو قبل تنفيذ الـ middleware.
 */
export const ActiveWorkspace = createParamDecorator(
  (
    data: keyof WorkspaceContext | undefined,
    ctx: ExecutionContext,
  ): WorkspaceContext | WorkspaceContext[keyof WorkspaceContext] => {
    const req = ctx.switchToHttp().getRequest<{ workspace?: WorkspaceContext }>();
    const workspace = req.workspace;
    if (!workspace) {
      throw new InternalServerErrorException(
        'Workspace context is not initialised on this route',
      );
    }
    return data ? workspace[data] : workspace;
  },
);

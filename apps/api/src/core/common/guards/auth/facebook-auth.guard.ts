import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const redirectOrigin = req.query?.redirect_origin;
    const linkToken = req.query?.link_token;
    const next = req.query?.next;

    if (redirectOrigin || linkToken || next) {
      const stateObj: Record<string, string | undefined> = {
        o: redirectOrigin,
        l: linkToken,
        n: next,
      };
      const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      return { state };
    }
    return {};
  }
}

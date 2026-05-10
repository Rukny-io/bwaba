import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const redirectOrigin = req.query?.redirect_origin;
    const linkToken = req.query?.link_token;
    
    if (redirectOrigin || linkToken) {
      const stateObj = { o: redirectOrigin, l: linkToken };
      const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      return { state };
    }
    return {};
  }
}

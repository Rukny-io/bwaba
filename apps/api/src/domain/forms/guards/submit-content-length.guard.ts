import { Injectable, CanActivate, ExecutionContext, PayloadTooLargeException } from '@nestjs/common';
import { FORMS_MAX_SUBMIT_BODY_BYTES } from '../forms.constants';

@Injectable()
export class SubmitContentLengthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const contentLength = request.headers['content-length'];
    
    if (contentLength && parseInt(contentLength, 10) > FORMS_MAX_SUBMIT_BODY_BYTES) {
      throw new PayloadTooLargeException(`Payload too large. Maximum allowed size is ${FORMS_MAX_SUBMIT_BODY_BYTES} bytes.`);
    }
    
    return true;
  }
}

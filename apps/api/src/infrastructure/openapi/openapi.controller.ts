import {
  Controller,
  Head,
  Get,
  Header,
  NotFoundException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function resolvePublicOpenApiPath(): string {
  const candidates = [
    join(process.cwd(), 'openapi', 'public-v1.yaml'),
    join(__dirname, '..', '..', '..', 'openapi', 'public-v1.yaml'),
  ];
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    throw new NotFoundException('OpenAPI specification not found');
  }
  return found;
}

@Public()
// Keep both URLs during the API v1 transition. The canonical URL is
// /api/openapi, while existing clients use /api/v1/openapi.
@Controller({ path: ['openapi', 'v1/openapi'], version: VERSION_NEUTRAL })
export class OpenApiController {
  @Get('public-v1.yaml')
  @Head('public-v1.yaml')
  @Header('Content-Type', 'application/yaml; charset=utf-8')
  getPublicYaml(): string {
    return readFileSync(resolvePublicOpenApiPath(), 'utf8');
  }
}

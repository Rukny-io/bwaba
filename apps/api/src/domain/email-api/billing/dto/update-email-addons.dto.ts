import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEmailAddonsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  domainsExtraPacks?: number;

  @IsOptional()
  @IsBoolean()
  dedicatedIpEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  ssoEnabled?: boolean;
}

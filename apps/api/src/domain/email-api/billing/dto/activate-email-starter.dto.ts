import { IsDateString, IsOptional } from 'class-validator';

/** @deprecated Use ActivateEmailPlanDto with plan PRO_10K */
export class ActivateEmailStarterDto {
  @IsOptional()
  @IsDateString()
  periodEndsAt?: string;
}

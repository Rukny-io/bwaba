import { IsDateString, IsOptional } from 'class-validator';

export class ActivateEmailStarterDto {
  @IsOptional()
  @IsDateString()
  periodEndsAt?: string;
}

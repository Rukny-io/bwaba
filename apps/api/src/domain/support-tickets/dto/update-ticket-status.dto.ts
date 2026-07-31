import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client';

export class UpdateTicketStatusDto {
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}

export class AssignTicketDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  assignedTo?: string | null;
}

import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SupportTicketCategory } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsEnum(SupportTicketCategory)
  category: SupportTicketCategory;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

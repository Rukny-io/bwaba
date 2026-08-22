import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertMailCatchAllDto {
  @ApiProperty({ description: 'Deliver unmatched *@domain mail to a mailbox' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Destination mailbox UUID' })
  @IsOptional()
  @IsUUID()
  mailboxId?: string;
}

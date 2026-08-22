import { IsIn } from 'class-validator';

export class AdminUpdateMailboxStatusDto {
  @IsIn(['ACTIVE', 'DISABLED'])
  status: 'ACTIVE' | 'DISABLED';
}

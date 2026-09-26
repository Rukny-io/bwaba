import { IsInt, Min } from 'class-validator';

export class PurchaseEmailOverageDto {
  @IsInt()
  @Min(1)
  packs!: number;
}

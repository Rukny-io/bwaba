import { IsOptional, IsString, MinLength } from 'class-validator';

export class ApproveMetaPortfolioDto {
  @IsOptional()
  @IsString()
  metaBusinessId?: string;
}

export class RejectMetaPortfolioDto {
  @IsString()
  @MinLength(5)
  reason: string;
}

export class FulfillMetaPortfolioDto {
  @IsString()
  @MinLength(1)
  metaBusinessId: string;
}

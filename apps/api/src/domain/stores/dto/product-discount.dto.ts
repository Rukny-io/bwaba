import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ArrayMaxSize,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDiscountDto {
  @ApiProperty({
    description: 'نسبة الخصم (من 1 إلى 100)',
    example: 25,
  })
  @IsNumber()
  @Min(1, { message: 'نسبة الخصم يجب أن تكون 1% على الأقل' })
  @Max(100, { message: 'نسبة الخصم لا يمكن أن تتجاوز 100%' })
  @Type(() => Number)
  percentage: number;

  @ApiProperty({
    description: 'معرفات المنتجات المشمولة بالخصم',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(200)
  productIds: string[];

  @ApiPropertyOptional({ description: 'هل الخصم نشط؟', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'تاريخ بداية الخصم' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ انتهاء الخصم' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateProductDiscountDto extends PartialType(CreateProductDiscountDto) {}

export class ProductDiscountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  productsCount: number;

  @ApiProperty({ type: [String] })
  productIds: string[];

  @ApiProperty()
  startDate: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

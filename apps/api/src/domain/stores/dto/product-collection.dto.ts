import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MaxLength,
  MinLength,
  Matches,
  Min,
  ValidateIf,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCollectionDto {
  @ApiPropertyOptional({ description: 'اسم المجموعة بالإنجليزية', example: 'Summer' })
  @ValidateIf((o) => !o.nameAr || o.name)
  @IsString()
  @MinLength(2, { message: 'اسم المجموعة يجب أن يكون حرفين على الأقل' })
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'اسم المجموعة بالعربية', example: 'مجموعة الصيف' })
  @ValidateIf((o) => !o.name || o.nameAr)
  @IsString()
  @MinLength(2, { message: 'اسم المجموعة بالعربية يجب أن يكون حرفين على الأقل' })
  @MaxLength(100)
  nameAr?: string;

  @ApiPropertyOptional({ description: 'الرابط المختصر', example: 'summer-collection' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'الرابط يجب أن يحتوي على حروف صغيرة وأرقام وشرطات فقط',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'وصف المجموعة' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'صورة الشعار / الأيقونة' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagePath?: string;

  @ApiPropertyOptional({ description: 'صورة البانر' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bannerPath?: string;

  @ApiPropertyOptional({ description: 'ترتيب العرض', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  order?: number;

  @ApiPropertyOptional({ description: 'هل المجموعة نشطة؟', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'معرفات المنتجات المضافة للمجموعة',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(200)
  productIds?: string[];
}

export class UpdateProductCollectionDto extends PartialType(
  CreateProductCollectionDto,
) {}

export class ReorderCollectionsDto {
  @ApiProperty({
    description: 'مصفوفة معرفات المجموعات بالترتيب الجديد',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  collectionIds: string[];
}

export class ProductCollectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  nameAr?: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  imagePath?: string;

  @ApiPropertyOptional()
  bannerPath?: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  productsCount: number;

  @ApiProperty({ type: [String] })
  productIds: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

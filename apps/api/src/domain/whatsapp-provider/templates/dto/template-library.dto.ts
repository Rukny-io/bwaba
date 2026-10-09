import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateLibraryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  usecase?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  after?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CreateTemplateFromLibraryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(16)
  language: string;

  @IsString()
  @IsIn(['AUTHENTICATION', 'UTILITY'])
  category: string;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  libraryTemplateName: string;

  @IsOptional()
  @IsArray()
  libraryTemplateButtonInputs?: unknown[];

  @IsOptional()
  @IsObject()
  libraryTemplateBodyInputs?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  accountId?: string;
}

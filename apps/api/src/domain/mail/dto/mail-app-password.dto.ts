import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMailAppPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;
}

export class RevokeMailAppPasswordDto {
  @IsString()
  @IsNotEmpty()
  passwordId!: string;
}

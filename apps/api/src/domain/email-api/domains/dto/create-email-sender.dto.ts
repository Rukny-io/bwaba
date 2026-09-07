import { IsEmail, MaxLength } from 'class-validator';

export class CreateEmailSenderDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateEmailDomainDto {
  @IsString()
  @MaxLength(253)
  @Matches(
    /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/,
  )
  domain!: string;
}

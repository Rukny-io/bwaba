import { IsIn, IsOptional, IsString } from 'class-validator';

export class OAuthTokenDto {
  @IsString()
  @IsIn(['authorization_code', 'refresh_token'])
  grant_type: string;

  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  redirect_uri?: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;
}

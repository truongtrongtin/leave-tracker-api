import { plainToClass } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsNotEmpty()
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNotEmpty()
  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  JWT_ACCESS_TOKEN_SECRET: string;

  @IsNumber()
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: number;

  @IsString()
  JWT_REFRESH_TOKEN_SECRET: string;

  @IsNumber()
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: number;

  @IsEmail()
  GMAIL: string;

  @IsString()
  GMAIL_PASSWORD: string;

  @IsString()
  BUCKET_NAME: string;

  @IsString()
  GOOGLE_CALENDAR_KEY_PATH: string;

  @IsString()
  GOOGLE_STORAGE_KEY_PATH: string;

  @IsString()
  GOOGLE_OAUTH2_CLIENT_ID: string;

  @IsString()
  GOOGLE_OAUTH2_CLIENT_SECRET: string;

  @IsString()
  GITHUB_OAUTH2_CLIENT_ID: string;

  @IsString()
  GITHUB_OAUTH2_CLIENT_SECRET: string;

  @IsString()
  FACEBOOK_OAUTH2_APP_ID: string;

  @IsString()
  FACEBOOK_OAUTH2_APP_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

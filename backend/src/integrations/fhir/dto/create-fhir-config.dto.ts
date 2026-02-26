import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateFHIRConfigDto {
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @IsString()
  @IsIn(['oauth2', 'basic', 'apikey'])
  authType: 'oauth2' | 'basic' | 'apikey';

  @IsNotEmpty()
  authConfig: {
    // OAuth 2.0
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
    scope?: string;
    // Basic Auth
    username?: string;
    password?: string;
    // API Key
    apiKey?: string;
    apiKeyHeader?: string;
  };

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsIn(['pull', 'push', 'bidirectional'])
  @IsOptional()
  syncDirection?: 'pull' | 'push' | 'bidirectional';

  @IsString()
  @IsIn(['realtime', 'hourly', 'daily'])
  @IsOptional()
  syncFrequency?: 'realtime' | 'hourly' | 'daily';

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetries?: number;

  @IsNumber()
  @Min(100)
  @IsOptional()
  initialDelay?: number;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  maxDelay?: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  backoffMultiplier?: number;
}

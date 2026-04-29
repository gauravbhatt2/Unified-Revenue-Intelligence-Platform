import {
  IsString,
  IsArray,
  IsEmail,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class ParticipantDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsIn(['sender', 'recipient', 'attendee'])
  role?: string;
}

export class IngestInteractionDto {
  @IsIn(['email', 'call', 'meeting'])
  type: string;

  @IsDateString()
  timestamp: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsIn(['inbound', 'outbound'])
  direction?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

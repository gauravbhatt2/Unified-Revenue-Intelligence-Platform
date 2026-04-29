import { IsOptional, IsString, MaxLength } from 'class-validator';

export class OptOutContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

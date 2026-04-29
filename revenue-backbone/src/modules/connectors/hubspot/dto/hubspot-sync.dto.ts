import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class HubspotSyncDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

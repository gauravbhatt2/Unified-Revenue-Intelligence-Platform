import { IsArray, IsOptional } from 'class-validator';

export class HubspotWebhookDto {
  @IsOptional()
  @IsArray()
  events?: Record<string, any>[];
}

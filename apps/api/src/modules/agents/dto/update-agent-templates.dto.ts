import { IsObject } from 'class-validator';

export class UpdateAgentTemplatesDto {
  @IsObject()
  custom_templates: Record<string, string[]>;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class PushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  auth_key: string;

  @IsString()
  @IsNotEmpty()
  p256dh_key: string;
}

import { ISODateString, UUID } from '../common/types';

export enum RewardStatus {
  Active = 'active',
  Inactive = 'inactive',
  SoldOut = 'sold_out',
  Expired = 'expired',
}

export enum RedemptionStatus {
  Pending = 'pending',
  Fulfilled = 'fulfilled',
  Cancelled = 'cancelled',
}

export interface RewardEntity {
  id: UUID;
  title: string;
  description: string | null;
  points_cost: number;
  stock: number;
  status: RewardStatus;
  expires_at: ISODateString | null;
  image_url: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface RewardRedemptionEntity {
  id: UUID;
  reward_id: UUID;
  user_id: UUID;
  points_cost: number;
  status: RedemptionStatus;
  redeemed_at: ISODateString;
  fulfilled_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

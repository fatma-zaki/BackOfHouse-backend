import { ISODateString, UUID } from '../common/types';

export enum PointsTransactionType {
  Earned = 'earned',
  Spent = 'spent',
  AdminAdjustment = 'admin_adjustment',
}

/** What a ledger entry points back to. Kept as an enum so it stays queryable. */
export enum PointsReferenceType {
  CourseCompletion = 'course_completion',
  RewardRedemption = 'reward_redemption',
  RewardRefund = 'reward_refund',
  AdminAdjustment = 'admin_adjustment',
}

export interface PointsTransactionEntity {
  id: UUID;
  user_id: UUID;
  amount: number;
  type: PointsTransactionType;
  reference_type: PointsReferenceType | null;
  reference_id: UUID | null;
  description: string | null;
  created_at: ISODateString;
}

export interface PointBalance {
  user_id: UUID;
  balance: number;
  updated_at: ISODateString | null;
}

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  userId: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  balance: number; // Available Credits
  referralCode: string;
  referredBy?: number;
  totalEarned: number; // Total Credits earned
  totalSpent: number; // Total Credits spent
  trafficReceived: number; // Visits received on user's campaigns
  trafficProvided: number; // Visits completed by user
  referralCount: number;
  referralEarnings: number;
  lastDailyBonus?: string; // ISO date of last claim
  status: UserStatus;
  createdAt: string;
  lastActiveAt: string;
  firstActionCompleted?: boolean; // Required for referral qualification
}

export type CampaignStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Campaign {
  campaignId: string;
  ownerUserId: number; // Telegram ID of creator
  ownerName: string;
  websiteUrl: string;
  requiredVisits: number;
  completedVisits: number;
  remainingVisits: number;
  cost: number; // Credits spent
  minimumVisitSeconds: number; // Time user must stay (e.g. 20s)
  rewardPerVisit: number; // Credits rewarded per visit (default: 1)
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export type VisitStatus = 'started' | 'verified' | 'failed' | 'expired';

export interface CampaignVisit {
  visitId: string;
  campaignId: string;
  userId: number; // Telegram ID of visitor
  startTime: number; // Unix timestamp ms
  durationSeconds: number; // Required duration
  verifiedTime?: number;
  status: VisitStatus;
  rewardCredited: boolean;
  rewardAmount: number;
  createdAt: string;
}

export type TransactionType =
  | 'signup_bonus'
  | 'daily_bonus'
  | 'traffic_reward'
  | 'monetag_ad_reward'
  | 'referral_reward'
  | 'campaign_create'
  | 'package_purchase'
  | 'manual_adjustment';

export interface CreditTransaction {
  transactionId: string;
  userId: number;
  amount: number; // Positive for earnings, negative for spends
  type: TransactionType;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface Referral {
  referralId: string;
  referrerId: number;
  referredId: number;
  referredUsername?: string;
  referredName: string;
  rewardAmount: number;
  status: 'pending' | 'qualified';
  rewardPaid: boolean;
  createdAt: string;
  qualifiedAt?: string;
}

export interface CreditPackage {
  packageId: string;
  name: string;
  credits: number;
  price: number; // in ৳ (BDT)
  currency: string;
  badge: string;
  description: string;
}

export type PaymentMethod = 'bKash' | 'Nagad' | 'Other';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface Payment {
  paymentId: string;
  userId: number;
  userName: string;
  packageId: string;
  packageName: string;
  credits: number;
  amount: number;
  method: PaymentMethod;
  reference: string;
  trxId: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBonusClaim {
  claimId: string;
  userId: number;
  amount: number;
  claimedAt: string;
}

export type SupportTicketStatus = 'open' | 'resolved' | 'closed';

export interface SupportRequest {
  ticketId: string;
  userId: number;
  userName: string;
  message: string;
  status: SupportTicketStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  notificationId: string;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserSessionState {
  step:
    | 'idle'
    | 'promote_enter_url'
    | 'promote_select_duration'
    | 'promote_select_visits'
    | 'promote_confirm'
    | 'payment_select_method'
    | 'payment_enter_trxid'
    | 'support_enter_message';
  promoteUrl?: string;
  promoteDurationSeconds?: number;
  promoteCostPerVisit?: number;
  promoteVisits?: number;
  selectedPackage?: CreditPackage;
  paymentMethod?: PaymentMethod;
  activeVisitId?: string;
  activeCampaignId?: string;
  historyPage?: number;
  faqPage?: number;
}

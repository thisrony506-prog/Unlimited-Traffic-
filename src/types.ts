export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  referralCode: string;
  referredBy?: number;
  balance: number; // Available Balance in ৳
  totalEarned: number; // Total Earned in ৳
  totalWithdrawn: number; // Total Withdrawn in ৳
  pendingWithdrawal: number; // Pending Withdrawal in ৳
  completedTasks: number;
  totalReferrals: number;
  successfulReferrals: number;
  referralEarnings: number;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'draft' | 'published' | 'paused' | 'expired' | 'completed';
export type ProofType = 'text' | 'photo' | 'document' | 'none';

export interface Task {
  taskId: string;
  title: string;
  description: string;
  instructions: string;
  reward: number; // in ৳
  estimatedTime: string; // e.g. "2 minutes"
  requirements: ProofType;
  status: TaskStatus;
  currentSubmissions: number;
  maximumSubmissions: number;
  createdAt: string;
  expiresAt: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TaskSubmission {
  submissionId: string;
  taskId: string;
  taskTitle?: string;
  userId: number;
  proofType: ProofType;
  proofText?: string;
  proofFileId?: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  rewarded: boolean;
  rewardAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'task_reward'
  | 'referral_reward'
  | 'withdrawal'
  | 'withdrawal_refund'
  | 'admin_adjustment';

export interface Transaction {
  transactionId: string;
  userId: number;
  amount: number;
  type: TransactionType;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export type WithdrawalMethod = 'bKash' | 'Nagad';
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';

export interface Withdrawal {
  withdrawalId: string;
  userId: number;
  amount: number;
  method: WithdrawalMethod;
  account: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  referralId: string;
  referrerId: number;
  referredId: number;
  referredUsername?: string;
  referredName: string;
  rewardAmount: number;
  rewardPaid: boolean;
  createdAt: string;
}

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

export interface SupportTicket {
  ticketId: string;
  userId: number;
  message: string;
  status: TicketStatus;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  announcementId: string;
  title: string;
  message: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}

export interface SystemSettings {
  minWithdrawal: number;
  referralReward: number;
  supportChatId: string;
  rulesText: string;
}

export interface UserSessionState {
  step:
    | 'idle'
    | 'submitting_task_proof'
    | 'withdraw_select_method'
    | 'withdraw_enter_amount'
    | 'withdraw_enter_account'
    | 'withdraw_confirm'
    | 'entering_support_message';
  activeTaskId?: string;
  withdrawMethod?: WithdrawalMethod;
  withdrawAmount?: number;
  withdrawAccount?: string;
  page?: number;
}

import fs from 'fs';
import path from 'path';
import {
  User,
  Task,
  TaskSubmission,
  Transaction,
  Withdrawal,
  Referral,
  SupportTicket,
  Announcement,
  SystemSettings,
  WithdrawalMethod,
} from '../types';
import { config } from '../config/env';

interface DatabaseSchema {
  users: Record<string, User>; // key: telegramId string
  tasks: Record<string, Task>; // key: taskId
  task_submissions: Record<string, TaskSubmission>; // key: submissionId
  transactions: Record<string, Transaction>; // key: transactionId
  withdrawals: Record<string, Withdrawal>; // key: withdrawalId
  referrals: Record<string, Referral>; // key: referralId
  support_tickets: Record<string, SupportTicket>; // key: ticketId
  announcements: Record<string, Announcement>; // key: announcementId
  settings: SystemSettings;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initial seed data
const initialSettings: SystemSettings = {
  minWithdrawal: config.MIN_WITHDRAWAL_AMOUNT,
  referralReward: config.REFERRAL_REWARD_AMOUNT,
  supportChatId: config.SUPPORT_CHAT_ID,
  rulesText: `📜 InfiniteHits Community & Earning Rules

1. Task Completion:
• Only genuine, complete proof will be approved.
• Fraudulent or fake screenshots/links will result in instant account suspension.
• Multiple submissions for the same task are not allowed.

2. Referral Rules:
• Self-referral using fake/alt Telegram accounts is strictly prohibited.
• Referral rewards are automatically credited when valid new users join.

3. Withdrawal Policy:
• Minimum withdrawal amount is ৳${config.MIN_WITHDRAWAL_AMOUNT}.
• Payouts supported via bKash and Nagad.
• Requests are verified and processed within 24-48 hours.

4. Anti-Abuse & Security:
• Automated scripts, bots, or spamming commands will trigger security locks.
• InfiniteHits is a transparent task-based rewards platform. No guaranteed returns or investments.`,
};

const initialTasks: Record<string, Task> = {
  task_1: {
    taskId: 'task_1',
    title: '🌐 Visit Official Website',
    description: 'Visit the InfiniteHits official portal and stay for at least 60 seconds.',
    instructions: '1. Click the link below to open the website.\n2. Browse for 60 seconds.\n3. Submit your Telegram username or email used as proof.',
    reward: 2.0,
    estimatedTime: '2 minutes',
    requirements: 'text',
    status: 'published',
    currentSubmissions: 0,
    maximumSubmissions: 500,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  task_2: {
    taskId: 'task_2',
    title: '📢 Join Telegram News Channel',
    description: 'Join our official Telegram Updates Channel to stay informed.',
    instructions: '1. Join @infinitehits_updates channel.\n2. Take a screenshot or send your username as proof.',
    reward: 5.0,
    estimatedTime: '1 minute',
    requirements: 'text',
    status: 'published',
    currentSubmissions: 0,
    maximumSubmissions: 1000,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  task_3: {
    taskId: 'task_3',
    title: '⭐ App Feedback & Review',
    description: 'Leave honest feedback on our partner Android application.',
    instructions: '1. Test the app and share a 2-line helpful feedback.\n2. Upload or type your feedback text below.',
    reward: 10.0,
    estimatedTime: '3 minutes',
    requirements: 'text',
    status: 'published',
    currentSubmissions: 0,
    maximumSubmissions: 200,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
};

const initialAnnouncements: Record<string, Announcement> = {
  ann_1: {
    announcementId: 'ann_1',
    title: '🚀 Welcome to InfiniteHits!',
    message: 'We are live! Complete tasks, invite your friends, and withdraw earnings directly to bKash or Nagad. Happy Earning!',
    status: 'published',
    createdAt: new Date().toISOString(),
  },
};

class DatabaseService {
  private memoryDb: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.memoryDb = {
      users: {},
      tasks: { ...initialTasks },
      task_submissions: {},
      transactions: {},
      withdrawals: {},
      referrals: {},
      support_tickets: {},
      announcements: { ...initialAnnouncements },
      settings: { ...initialSettings },
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryDb = {
          users: parsed.users || {},
          tasks: { ...initialTasks, ...(parsed.tasks || {}) },
          task_submissions: parsed.task_submissions || {},
          transactions: parsed.transactions || {},
          withdrawals: parsed.withdrawals || {},
          referrals: parsed.referrals || {},
          support_tickets: parsed.support_tickets || {},
          announcements: { ...initialAnnouncements, ...(parsed.announcements || {}) },
          settings: { ...initialSettings, ...(parsed.settings || {}) },
        };
      } else {
        this.saveSync();
      }
    } catch (err) {
      console.error('Error loading database file, initializing in-memory state:', err);
    }
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 100);
  }

  // --- Helpers ---
  private generateReferralCode(telegramId: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `EF${telegramId.toString().slice(-3)}${suffix}`;
  }

  // --- USER ENGINE ---
  public getUser(telegramId: number): User | null {
    return this.memoryDb.users[telegramId.toString()] || null;
  }

  public getUserByReferralCode(code: string): User | null {
    const cleanCode = code.trim().toUpperCase();
    return (
      Object.values(this.memoryDb.users).find(
        (u) => u.referralCode.toUpperCase() === cleanCode
      ) || null
    );
  }

  public getOrCreateUser(
    telegramId: number,
    firstName: string,
    lastName?: string,
    username?: string,
    referralParam?: string
  ): { user: User; isNew: boolean } {
    const key = telegramId.toString();
    const existing = this.memoryDb.users[key];
    if (existing) {
      // Update basic fields if changed
      let updated = false;
      if (firstName && existing.firstName !== firstName) {
        existing.firstName = firstName;
        updated = true;
      }
      if (lastName !== undefined && existing.lastName !== lastName) {
        existing.lastName = lastName;
        updated = true;
      }
      if (username !== undefined && existing.username !== username) {
        existing.username = username;
        updated = true;
      }
      if (updated) {
        existing.updatedAt = new Date().toISOString();
        this.persist();
      }
      return { user: existing, isNew: false };
    }

    // Process new user creation
    const now = new Date().toISOString();
    let referredBy: number | undefined = undefined;

    // Check referral parameter
    if (referralParam && referralParam.trim()) {
      const referrer = this.getUserByReferralCode(referralParam.trim());
      if (referrer && referrer.telegramId !== telegramId) {
        referredBy = referrer.telegramId;
      }
    }

    const newUser: User = {
      telegramId,
      username,
      firstName,
      lastName,
      referralCode: this.generateReferralCode(telegramId),
      referredBy,
      balance: 0.0,
      totalEarned: 0.0,
      totalWithdrawn: 0.0,
      pendingWithdrawal: 0.0,
      completedTasks: 0,
      totalReferrals: 0,
      successfulReferrals: 0,
      referralEarnings: 0.0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDb.users[key] = newUser;

    // Credit referrer if applicable
    if (referredBy) {
      const referrerKey = referredBy.toString();
      const referrerUser = this.memoryDb.users[referrerKey];
      if (referrerUser && referrerUser.telegramId !== telegramId) {
        const rewardAmount = this.memoryDb.settings.referralReward;

        referrerUser.balance += rewardAmount;
        referrerUser.totalEarned += rewardAmount;
        referrerUser.totalReferrals += 1;
        referrerUser.successfulReferrals += 1;
        referrerUser.referralEarnings += rewardAmount;
        referrerUser.updatedAt = now;

        const referralId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const refRecord: Referral = {
          referralId,
          referrerId: referredBy,
          referredId: telegramId,
          referredUsername: username,
          referredName: `${firstName}${lastName ? ' ' + lastName : ''}`,
          rewardAmount,
          rewardPaid: true,
          createdAt: now,
        };
        this.memoryDb.referrals[referralId] = refRecord;

        const txId = `tx_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const txRecord: Transaction = {
          transactionId: txId,
          userId: referredBy,
          amount: rewardAmount,
          type: 'referral_reward',
          description: `Referral bonus for user ${firstName} (@${username || telegramId})`,
          status: 'completed',
          createdAt: now,
        };
        this.memoryDb.transactions[txId] = txRecord;
      }
    }

    this.persist();
    return { user: newUser, isNew: true };
  }

  // --- TASKS ENGINE ---
  public getAvailableTasks(): Task[] {
    return Object.values(this.memoryDb.tasks).filter(
      (t) => t.status === 'published' && t.currentSubmissions < t.maximumSubmissions
    );
  }

  public getTask(taskId: string): Task | null {
    return this.memoryDb.tasks[taskId] || null;
  }

  public hasUserSubmittedTask(userId: number, taskId: string): boolean {
    return Object.values(this.memoryDb.task_submissions).some(
      (s) => s.userId === userId && s.taskId === taskId
    );
  }

  public getUserSubmissionForTask(userId: number, taskId: string): TaskSubmission | null {
    return (
      Object.values(this.memoryDb.task_submissions).find(
        (s) => s.userId === userId && s.taskId === taskId
      ) || null
    );
  }

  public createTaskSubmission(
    userId: number,
    taskId: string,
    proofType: 'text' | 'photo' | 'document' | 'none',
    proofText?: string,
    proofFileId?: string
  ): { success: boolean; submission?: TaskSubmission; error?: string } {
    const task = this.getTask(taskId);
    if (!task) return { success: false, error: 'Task not found.' };
    if (task.status !== 'published') return { success: false, error: 'Task is no longer active.' };
    if (this.hasUserSubmittedTask(userId, taskId)) {
      return { success: false, error: 'You have already submitted proof for this task.' };
    }

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const submission: TaskSubmission = {
      submissionId,
      taskId,
      taskTitle: task.title,
      userId,
      proofType,
      proofText,
      proofFileId,
      status: 'pending',
      rewarded: false,
      rewardAmount: task.reward,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDb.task_submissions[submissionId] = submission;
    this.persist();
    return { success: true, submission };
  }

  public getUserSubmissions(userId: number): TaskSubmission[] {
    return Object.values(this.memoryDb.task_submissions)
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSubmission(submissionId: string): TaskSubmission | null {
    return this.memoryDb.task_submissions[submissionId] || null;
  }

  public approveTaskSubmission(submissionId: string): {
    success: boolean;
    user?: User;
    submission?: TaskSubmission;
    error?: string;
  } {
    const sub = this.memoryDb.task_submissions[submissionId];
    if (!sub) return { success: false, error: 'Submission not found.' };
    if (sub.status === 'approved' || sub.rewarded) {
      return { success: false, error: 'Submission has already been approved and rewarded.' };
    }

    const task = this.getTask(sub.taskId);
    const user = this.getUser(sub.userId);
    if (!user) return { success: false, error: 'User not found.' };

    const now = new Date().toISOString();
    sub.status = 'approved';
    sub.rewarded = true;
    sub.updatedAt = now;

    // Atomic balance update
    user.balance += sub.rewardAmount;
    user.totalEarned += sub.rewardAmount;
    user.completedTasks += 1;
    user.updatedAt = now;

    if (task) {
      task.currentSubmissions += 1;
    }

    // Ledger record
    const txId = `tx_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tx: Transaction = {
      transactionId: txId,
      userId: user.telegramId,
      amount: sub.rewardAmount,
      type: 'task_reward',
      description: `Task Reward: ${sub.taskTitle || task?.title || 'Completed Task'}`,
      status: 'completed',
      createdAt: now,
    };
    this.memoryDb.transactions[txId] = tx;

    this.persist();
    return { success: true, user, submission: sub };
  }

  public rejectTaskSubmission(submissionId: string, reason?: string): {
    success: boolean;
    submission?: TaskSubmission;
    error?: string;
  } {
    const sub = this.memoryDb.task_submissions[submissionId];
    if (!sub) return { success: false, error: 'Submission not found.' };
    if (sub.status !== 'pending') {
      return { success: false, error: `Submission is already ${sub.status}.` };
    }

    sub.status = 'rejected';
    sub.rejectionReason = reason || 'Proof verification failed.';
    sub.updatedAt = new Date().toISOString();

    this.persist();
    return { success: true, submission: sub };
  }

  // --- WITHDRAWAL ENGINE ---
  public createWithdrawalRequest(
    userId: number,
    method: WithdrawalMethod,
    amount: number,
    account: string
  ): { success: boolean; withdrawal?: Withdrawal; error?: string } {
    const user = this.getUser(userId);
    if (!user) return { success: false, error: 'User account not found.' };

    const minAmount = this.memoryDb.settings.minWithdrawal;
    if (amount < minAmount) {
      return { success: false, error: `Minimum withdrawal amount is ৳${minAmount.toFixed(2)}.` };
    }

    if (user.balance < amount) {
      return { success: false, error: `Insufficient available balance (৳${user.balance.toFixed(2)}).` };
    }

    // Check if user already has a pending withdrawal
    const existingPending = Object.values(this.memoryDb.withdrawals).find(
      (w) => w.userId === userId && w.status === 'pending'
    );
    if (existingPending) {
      return { success: false, error: 'You already have a pending withdrawal request in process.' };
    }

    const now = new Date().toISOString();
    const withdrawalId = `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Atomic state lock
    user.balance -= amount;
    user.pendingWithdrawal += amount;
    user.updatedAt = now;

    const withdrawal: Withdrawal = {
      withdrawalId,
      userId,
      amount,
      method,
      account,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDb.withdrawals[withdrawalId] = withdrawal;

    // Transaction ledger record
    const txId = `tx_wdr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tx: Transaction = {
      transactionId: txId,
      userId,
      amount: -amount,
      type: 'withdrawal',
      description: `Withdrawal via ${method} (${account})`,
      status: 'pending',
      createdAt: now,
    };
    this.memoryDb.transactions[txId] = tx;

    this.persist();
    return { success: true, withdrawal };
  }

  public processWithdrawal(
    withdrawalId: string,
    newStatus: 'approved' | 'paid' | 'rejected' | 'cancelled',
    rejectionReason?: string
  ): { success: boolean; user?: User; withdrawal?: Withdrawal; error?: string } {
    const wdr = this.memoryDb.withdrawals[withdrawalId];
    if (!wdr) return { success: false, error: 'Withdrawal request not found.' };
    if (wdr.status !== 'pending' && wdr.status !== 'approved') {
      return { success: false, error: `Withdrawal request is already ${wdr.status}.` };
    }

    const user = this.getUser(wdr.userId);
    if (!user) return { success: false, error: 'User not found.' };

    const now = new Date().toISOString();

    if (newStatus === 'paid' || newStatus === 'approved') {
      user.pendingWithdrawal = Math.max(0, user.pendingWithdrawal - wdr.amount);
      user.totalWithdrawn += wdr.amount;
      user.updatedAt = now;

      wdr.status = newStatus;
      wdr.updatedAt = now;

      // Update associated ledger transaction status
      const tx = Object.values(this.memoryDb.transactions).find(
        (t) => t.userId === user.telegramId && t.amount === -wdr.amount && t.status === 'pending'
      );
      if (tx) {
        tx.status = 'completed';
      }
    } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
      // Refund user balance
      user.pendingWithdrawal = Math.max(0, user.pendingWithdrawal - wdr.amount);
      user.balance += wdr.amount;
      user.updatedAt = now;

      wdr.status = newStatus;
      wdr.rejectionReason = rejectionReason || 'Request rejected by system.';
      wdr.updatedAt = now;

      // Refund transaction ledger
      const refundTxId = `tx_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const refundTx: Transaction = {
        transactionId: refundTxId,
        userId: user.telegramId,
        amount: wdr.amount,
        type: 'withdrawal_refund',
        description: `Withdrawal Refund: ${rejectionReason || 'Request rejected'}`,
        status: 'completed',
        createdAt: now,
      };
      this.memoryDb.transactions[refundTxId] = refundTx;
    }

    this.persist();
    return { success: true, user, withdrawal: wdr };
  }

  // --- TRANSACTIONS & HISTORY ---
  public getUserTransactions(userId: number, page: number = 1, limit: number = 5): {
    items: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const all = Object.values(this.memoryDb.transactions)
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * limit;
    const items = all.slice(offset, offset + limit);

    return { items, total, page: safePage, totalPages };
  }

  // --- REFERRALS ---
  public getUserReferralStats(userId: number): {
    user: User;
    referrals: Referral[];
  } {
    const user = this.getUser(userId) || this.getOrCreateUser(userId, 'User').user;
    const referrals = Object.values(this.memoryDb.referrals).filter((r) => r.referrerId === userId);
    return { user, referrals };
  }

  // --- SUPPORT TICKETS ---
  public createSupportTicket(userId: number, message: string): SupportTicket {
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      ticketId,
      userId,
      message,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.memoryDb.support_tickets[ticketId] = ticket;
    this.persist();
    return ticket;
  }

  public getPendingSupportTickets(): SupportTicket[] {
    return Object.values(this.memoryDb.support_tickets).filter(
      (t) => t.status === 'open' || t.status === 'pending'
    );
  }

  // --- ANNOUNCEMENTS ---
  public getLatestAnnouncement(): Announcement | null {
    const published = Object.values(this.memoryDb.announcements)
      .filter((a) => a.status === 'published')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return published[0] || null;
  }

  public addAnnouncement(title: string, message: string): Announcement {
    const announcementId = `ann_${Date.now()}`;
    const ann: Announcement = {
      announcementId,
      title,
      message,
      status: 'published',
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.announcements[announcementId] = ann;
    this.persist();
    return ann;
  }

  // --- SETTINGS & ADMIN SEED ---
  public getSettings(): SystemSettings {
    return this.memoryDb.settings;
  }

  public addTask(title: string, description: string, instructions: string, reward: number, time: string): Task {
    const taskId = `task_${Date.now()}`;
    const task: Task = {
      taskId,
      title,
      description,
      instructions,
      reward,
      estimatedTime: time,
      requirements: 'text',
      status: 'published',
      currentSubmissions: 0,
      maximumSubmissions: 500,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    this.memoryDb.tasks[taskId] = task;
    this.persist();
    return task;
  }

  public getAllSubmissions(): TaskSubmission[] {
    return Object.values(this.memoryDb.task_submissions).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllWithdrawals(): Withdrawal[] {
    return Object.values(this.memoryDb.withdrawals).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllUsers(): User[] {
    return Object.values(this.memoryDb.users);
  }
}

export const dbService = new DatabaseService();

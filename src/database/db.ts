import fs from 'fs';
import path from 'path';
import {
  User,
  Campaign,
  CampaignVisit,
  CreditTransaction,
  Referral,
  CreditPackage,
  Payment,
  DailyBonusClaim,
  SupportRequest,
  Notification,
  TransactionType,
  PaymentMethod,
  CampaignStatus,
} from '../types';
import { config } from '../config/env';

interface DatabaseSchema {
  users: Record<string, User>; // key: telegramId string
  campaigns: Record<string, Campaign>; // key: campaignId
  campaign_visits: Record<string, CampaignVisit>; // key: visitId
  credit_transactions: Record<string, CreditTransaction>; // key: transactionId
  referrals: Record<string, Referral>; // key: referralId
  packages: Record<string, CreditPackage>; // key: packageId
  payments: Record<string, Payment>; // key: paymentId
  daily_bonus: Record<string, DailyBonusClaim>; // key: claimId
  support_requests: Record<string, SupportRequest>; // key: ticketId
  notifications: Record<string, Notification>; // key: notificationId
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Default credit packages
const initialPackages: Record<string, CreditPackage> = {
  pkg_starter: {
    packageId: 'pkg_starter',
    name: 'Starter',
    credits: 500,
    price: 50,
    currency: '৳',
    badge: '🟢',
    description: 'Perfect for testing campaigns',
  },
  pkg_popular: {
    packageId: 'pkg_popular',
    name: 'Popular',
    credits: 1500,
    price: 120,
    currency: '৳',
    badge: '🔵',
    description: 'Most popular for growing websites',
  },
  pkg_pro: {
    packageId: 'pkg_pro',
    name: 'Pro',
    credits: 5000,
    price: 350,
    currency: '৳',
    badge: '🟣',
    description: 'High volume traffic boost',
  },
  pkg_business: {
    packageId: 'pkg_business',
    name: 'Business',
    credits: 10000,
    price: 600,
    currency: '৳',
    badge: '🔥',
    description: 'Maximum exposure for pro sites',
  },
};

// Seed active community campaigns for instant testing
const initialCampaigns: Record<string, Campaign> = {
  camp_seed_1: {
    campaignId: 'camp_seed_1',
    ownerUserId: 10000001,
    ownerName: 'TechBlog Media',
    websiteUrl: 'https://techradar.com',
    requiredVisits: 500,
    completedVisits: 142,
    remainingVisits: 358,
    cost: 500,
    minimumVisitSeconds: 20,
    rewardPerVisit: 1,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  camp_seed_2: {
    campaignId: 'camp_seed_2',
    ownerUserId: 10000002,
    ownerName: 'DevHub Insights',
    websiteUrl: 'https://dev.to',
    requiredVisits: 1000,
    completedVisits: 480,
    remainingVisits: 520,
    cost: 1000,
    minimumVisitSeconds: 20,
    rewardPerVisit: 1,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  camp_seed_3: {
    campaignId: 'camp_seed_3',
    ownerUserId: 10000003,
    ownerName: 'CryptoPulse Online',
    websiteUrl: 'https://coinmarketcap.com',
    requiredVisits: 250,
    completedVisits: 88,
    remainingVisits: 162,
    cost: 250,
    minimumVisitSeconds: 20,
    rewardPerVisit: 1,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

class DatabaseService {
  private memoryDb: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.memoryDb = {
      users: {},
      campaigns: { ...initialCampaigns },
      campaign_visits: {},
      credit_transactions: {},
      referrals: {},
      packages: { ...initialPackages },
      payments: {},
      daily_bonus: {},
      support_requests: {},
      notifications: {},
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

        // Sanitize users to ensure all expected properties are properly typed and never undefined/null
        const rawUsers = parsed.users || {};
        const sanitizedUsers: Record<string, User> = {};
        for (const [key, u] of Object.entries(rawUsers)) {
          const user = u as any;
          sanitizedUsers[key] = {
            userId: user.userId || `usr_${user.telegramId || key}`,
            telegramId: Number(user.telegramId || key),
            firstName: user.firstName || 'User',
            lastName: user.lastName,
            username: user.username,
            balance: Number(user.balance ?? 0),
            referralCode: user.referralCode || ('IH' + Math.random().toString(36).substring(2, 7).toUpperCase()),
            referredBy: user.referredBy,
            totalEarned: Number(user.totalEarned ?? user.balance ?? 0),
            totalSpent: Number(user.totalSpent ?? 0),
            trafficReceived: Number(user.trafficReceived ?? 0),
            trafficProvided: Number(user.trafficProvided ?? user.completedTasks ?? 0),
            referralCount: Number(user.referralCount ?? user.totalReferrals ?? 0),
            referralEarnings: Number(user.referralEarnings ?? 0),
            lastDailyBonus: user.lastDailyBonus,
            status: user.status || 'active',
            createdAt: user.createdAt || new Date().toISOString(),
            lastActiveAt: user.lastActiveAt || user.updatedAt || new Date().toISOString(),
            firstActionCompleted: Boolean(user.firstActionCompleted),
          };
        }

        this.memoryDb = {
          users: sanitizedUsers,
          campaigns: { ...initialCampaigns, ...(parsed.campaigns || {}) },
          campaign_visits: parsed.campaign_visits || {},
          credit_transactions: parsed.credit_transactions || {},
          referrals: parsed.referrals || {},
          packages: { ...initialPackages, ...(parsed.packages || {}) },
          payments: parsed.payments || {},
          daily_bonus: parsed.daily_bonus || {},
          support_requests: parsed.support_requests || {},
          notifications: parsed.notifications || {},
        };
      } else {
        this.saveSync();
      }
    } catch (err) {
      console.error('Error initializing database file:', err);
    }
  }

  private persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 150);
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  // --- USERS ---
  public getUser(telegramId: number): User | null {
    const user = this.memoryDb.users[telegramId.toString()];
    if (!user) return null;
    // Normalize properties defensively
    user.balance = Number(user.balance ?? 0);
    user.totalEarned = Number(user.totalEarned ?? 0);
    user.totalSpent = Number(user.totalSpent ?? 0);
    user.trafficReceived = Number(user.trafficReceived ?? 0);
    user.trafficProvided = Number(user.trafficProvided ?? 0);
    user.referralCount = Number(user.referralCount ?? 0);
    user.referralEarnings = Number(user.referralEarnings ?? 0);
    return user;
  }

  public getUserByRefCode(code: string): User | null {
    const clean = code.trim().toUpperCase();
    return Object.values(this.memoryDb.users).find((u) => u.referralCode === clean) || null;
  }

  public getOrCreateUser(
    telegramId: number,
    firstName: string,
    lastName?: string,
    username?: string,
    startPayload?: string
  ): { user: User; isNew: boolean; welcomeBonusGiven: boolean } {
    const key = telegramId.toString();
    const existing = this.memoryDb.users[key];

    if (existing) {
      existing.firstName = firstName || existing.firstName;
      existing.lastName = lastName || existing.lastName;
      existing.username = username || existing.username;
      existing.balance = Number(existing.balance ?? 0);
      existing.totalEarned = Number(existing.totalEarned ?? 0);
      existing.totalSpent = Number(existing.totalSpent ?? 0);
      existing.trafficReceived = Number(existing.trafficReceived ?? 0);
      existing.trafficProvided = Number(existing.trafficProvided ?? 0);
      existing.referralCount = Number(existing.referralCount ?? 0);
      existing.referralEarnings = Number(existing.referralEarnings ?? 0);
      existing.lastActiveAt = new Date().toISOString();
      this.persist();
      return { user: existing, isNew: false, welcomeBonusGiven: false };
    }

    // Generate unique referral code
    const referralCode = 'IH' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const now = new Date().toISOString();

    // Check referral logic
    let referredBy: number | undefined = undefined;
    if (startPayload) {
      const trimmed = startPayload.trim().toUpperCase();
      const referrer = this.getUserByRefCode(trimmed);
      if (referrer && referrer.telegramId !== telegramId) {
        referredBy = referrer.telegramId;
      }
    }

    const newUser: User = {
      userId: `usr_${telegramId}`,
      telegramId,
      firstName,
      lastName,
      username,
      balance: config.NEW_USER_BONUS,
      referralCode,
      referredBy,
      totalEarned: config.NEW_USER_BONUS,
      totalSpent: 0,
      trafficReceived: 0,
      trafficProvided: 0,
      referralCount: 0,
      referralEarnings: 0,
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      firstActionCompleted: false,
    };

    this.memoryDb.users[key] = newUser;

    // Record welcome bonus transaction
    this.recordTransaction({
      userId: telegramId,
      amount: config.NEW_USER_BONUS,
      type: 'signup_bonus',
      description: '🎁 Welcome Bonus',
      status: 'completed',
    });

    // If referred by someone, record pending referral
    if (referredBy) {
      const refId = `ref_${Date.now()}_${telegramId}`;
      const referral: Referral = {
        referralId: refId,
        referrerId: referredBy,
        referredId: telegramId,
        referredUsername: username,
        referredName: `${firstName} ${lastName || ''}`.trim(),
        rewardAmount: config.REFERRAL_REWARD_AMOUNT,
        status: 'pending',
        rewardPaid: false,
        createdAt: now,
      };
      this.memoryDb.referrals[refId] = referral;

      // Increment referrer's referral count
      const referrerUser = this.memoryDb.users[referredBy.toString()];
      if (referrerUser) {
        referrerUser.referralCount += 1;
      }
    }

    this.persist();
    return { user: newUser, isNew: true, welcomeBonusGiven: true };
  }

  public updateUser(telegramId: number, updates: Partial<User>): User | null {
    const key = telegramId.toString();
    const user = this.memoryDb.users[key];
    if (!user) return null;

    Object.assign(user, updates, { lastActiveAt: new Date().toISOString() });
    this.persist();
    return user;
  }

  // --- TRANSACTIONS ---
  public recordTransaction(data: Omit<CreditTransaction, 'transactionId' | 'createdAt'>): CreditTransaction {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tx: CreditTransaction = {
      ...data,
      transactionId: txId,
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.credit_transactions[txId] = tx;
    this.persist();
    return tx;
  }

  public getUserTransactions(userId: number, page: number = 1, pageSize: number = 5): {
    transactions: CreditTransaction[];
    total: number;
    totalPages: number;
    currentPage: number;
  } {
    const all = Object.values(this.memoryDb.credit_transactions)
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const transactions = all.slice(start, start + pageSize);

    return {
      transactions,
      total,
      totalPages,
      currentPage: safePage,
    };
  }

  // --- CREDIT BALANCES (ATOMIC) ---
  public addCredits(
    userId: number,
    amount: number,
    type: TransactionType,
    description: string
  ): { success: boolean; newBalance: number } {
    const user = this.memoryDb.users[userId.toString()];
    if (!user) return { success: false, newBalance: 0 };

    user.balance += amount;
    user.totalEarned += amount;
    this.recordTransaction({
      userId,
      amount,
      type,
      description,
      status: 'completed',
    });

    this.checkAndQualifyReferral(userId);
    this.persist();
    return { success: true, newBalance: user.balance };
  }

  public deductCredits(
    userId: number,
    amount: number,
    type: TransactionType,
    description: string
  ): { success: boolean; newBalance: number; error?: string } {
    const user = this.memoryDb.users[userId.toString()];
    if (!user) return { success: false, newBalance: 0, error: 'User not found' };

    if (user.balance < amount) {
      return { success: false, newBalance: user.balance, error: 'Insufficient credits' };
    }

    user.balance -= amount;
    user.totalSpent += amount;
    this.recordTransaction({
      userId,
      amount: -amount,
      type,
      description,
      status: 'completed',
    });

    this.persist();
    return { success: true, newBalance: user.balance };
  }

  // --- REFERRAL QUALIFICATION ---
  private checkAndQualifyReferral(referredUserId: number) {
    const user = this.memoryDb.users[referredUserId.toString()];
    if (!user || user.firstActionCompleted) return;

    user.firstActionCompleted = true;

    // Check if there is a pending referral
    const referral = Object.values(this.memoryDb.referrals).find(
      (r) => r.referredId === referredUserId && !r.rewardPaid
    );

    if (referral) {
      referral.status = 'qualified';
      referral.rewardPaid = true;
      referral.qualifiedAt = new Date().toISOString();

      // Credit referrer
      const referrer = this.memoryDb.users[referral.referrerId.toString()];
      if (referrer) {
        referrer.balance += referral.rewardAmount;
        referrer.totalEarned += referral.rewardAmount;
        referrer.referralEarnings += referral.rewardAmount;

        this.recordTransaction({
          userId: referrer.telegramId,
          amount: referral.rewardAmount,
          type: 'referral_reward',
          description: `👥 Referral Reward (${referral.referredName})`,
          status: 'completed',
        });
      }
    }
  }

  // --- DAILY BONUS ---
  public claimDailyBonus(userId: number): {
    success: boolean;
    amount: number;
    nextAvailableInMs?: number;
    newBalance?: number;
  } {
    const user = this.memoryDb.users[userId.toString()];
    if (!user) return { success: false, amount: 0 };

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (user.lastDailyBonus) {
      const lastClaimTime = new Date(user.lastDailyBonus).getTime();
      const elapsed = now - lastClaimTime;
      if (elapsed < twentyFourHours) {
        return {
          success: false,
          amount: 0,
          nextAvailableInMs: twentyFourHours - elapsed,
        };
      }
    }

    const rewardAmount = config.DAILY_BONUS_AMOUNT;
    user.lastDailyBonus = new Date(now).toISOString();
    user.balance += rewardAmount;
    user.totalEarned += rewardAmount;

    // Record claim
    const claimId = `claim_${now}_${userId}`;
    this.memoryDb.daily_bonus[claimId] = {
      claimId,
      userId,
      amount: rewardAmount,
      claimedAt: new Date(now).toISOString(),
    };

    // Record transaction
    this.recordTransaction({
      userId,
      amount: rewardAmount,
      type: 'daily_bonus',
      description: '🎉 Daily Bonus',
      status: 'completed',
    });

    this.checkAndQualifyReferral(userId);
    this.persist();
    return {
      success: true,
      amount: rewardAmount,
      newBalance: user.balance,
    };
  }

  // --- MONETAG ADS MINI APP REWARDS ---
  public getMonetagStats(userId: number): {
    adsWatchedToday: number;
    dailyLimit: number;
    remainingToday: number;
    rewardPerAd: number;
    totalEarnedFromAds: number;
  } {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    const allTx = Object.values(this.memoryDb.credit_transactions).filter(
      (t) => t.userId === userId && t.type === 'monetag_ad_reward'
    );

    const adsWatchedToday = allTx.filter(
      (t) => new Date(t.createdAt).getTime() >= todayStartMs
    ).length;

    const totalEarnedFromAds = allTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const dailyLimit = config.MONETAG_DAILY_LIMIT || 20;
    const remainingToday = Math.max(0, dailyLimit - adsWatchedToday);
    const rewardPerAd = config.MONETAG_REWARD_CREDITS || 5;

    return {
      adsWatchedToday,
      dailyLimit,
      remainingToday,
      rewardPerAd,
      totalEarnedFromAds,
    };
  }

  public claimMonetagAdReward(
    userId: number,
    adType: string = 'rewarded_interstitial',
    rewardAmount?: number
  ): {
    success: boolean;
    amount?: number;
    newBalance?: number;
    adsWatchedToday?: number;
    remainingToday?: number;
    error?: string;
  } {
    const user = this.memoryDb.users[userId.toString()];
    if (!user) return { success: false, error: 'User not found' };

    const stats = this.getMonetagStats(userId);
    if (stats.remainingToday <= 0) {
      return {
        success: false,
        error: `Daily limit reached! You have watched ${stats.dailyLimit}/${stats.dailyLimit} ads today. Come back tomorrow!`,
        adsWatchedToday: stats.adsWatchedToday,
        remainingToday: 0,
      };
    }

    const reward = rewardAmount ?? stats.rewardPerAd;
    user.balance += reward;
    user.totalEarned += reward;

    const adTypeLabel =
      adType === 'rewarded_interstitial'
        ? '🎬 Rewarded Interstitial'
        : adType === 'in_page_push'
        ? '💎 In-Page Ad'
        : adType === 'smartlink'
        ? '⚡ SmartLink Ad'
        : '📺 Monetag Ad';

    this.recordTransaction({
      userId,
      amount: reward,
      type: 'monetag_ad_reward',
      description: `${adTypeLabel} (+${reward} Credits)`,
      status: 'completed',
    });

    this.checkAndQualifyReferral(userId);
    this.persist();

    const updatedStats = this.getMonetagStats(userId);

    return {
      success: true,
      amount: reward,
      newBalance: user.balance,
      adsWatchedToday: updatedStats.adsWatchedToday,
      remainingToday: updatedStats.remainingToday,
    };
  }

  // --- CAMPAIGNS ---
  public getActiveCampaigns(visitorUserId: number): Campaign[] {
    const now = Date.now();
    const cooldownPeriod = 3600000 * 6; // 6-hour user cooldown per campaign

    return Object.values(this.memoryDb.campaigns).filter((camp) => {
      // Must be active and have remaining visits
      if (camp.status !== 'ACTIVE' || camp.remainingVisits <= 0) return false;

      // Do not show user's own campaigns
      if (camp.ownerUserId === visitorUserId) return false;

      // Check if visitor recently completed this campaign
      const recentVisit = Object.values(this.memoryDb.campaign_visits).find(
        (v) =>
          v.campaignId === camp.campaignId &&
          v.userId === visitorUserId &&
          v.status === 'verified' &&
          now - v.startTime < cooldownPeriod
      );

      return !recentVisit;
    });
  }

  public getCampaignById(campaignId: string): Campaign | null {
    return this.memoryDb.campaigns[campaignId] || null;
  }

  public getUserCampaigns(ownerUserId: number): Campaign[] {
    return Object.values(this.memoryDb.campaigns)
      .filter((c) => c.ownerUserId === ownerUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createCampaign(
    ownerUserId: number,
    ownerName: string,
    websiteUrl: string,
    requiredVisits: number,
    minimumVisitSeconds: number = 15,
    costPerVisit: number = 1
  ): { success: boolean; campaign?: Campaign; error?: string } {
    const user = this.memoryDb.users[ownerUserId.toString()];
    if (!user) return { success: false, error: 'User not found' };

    const cost = requiredVisits * costPerVisit;
    if (user.balance < cost) {
      return { success: false, error: 'Insufficient Credits' };
    }

    // Deduct credits
    const deductRes = this.deductCredits(
      ownerUserId,
      cost,
      'campaign_create',
      `➕ Promoted ${websiteUrl} (${requiredVisits} visits @ ${minimumVisitSeconds}s)`
    );

    if (!deductRes.success) {
      return { success: false, error: deductRes.error };
    }

    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const campaign: Campaign = {
      campaignId,
      ownerUserId,
      ownerName,
      websiteUrl,
      requiredVisits,
      completedVisits: 0,
      remainingVisits: requiredVisits,
      cost,
      minimumVisitSeconds: minimumVisitSeconds || 15,
      rewardPerVisit: costPerVisit || 1,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDb.campaigns[campaignId] = campaign;
    this.persist();
    return { success: true, campaign };
  }

  public toggleCampaignStatus(campaignId: string, ownerUserId: number): { success: boolean; newStatus?: CampaignStatus } {
    const campaign = this.memoryDb.campaigns[campaignId];
    if (!campaign || campaign.ownerUserId !== ownerUserId) return { success: false };

    if (campaign.status === 'ACTIVE') {
      campaign.status = 'PAUSED';
    } else if (campaign.status === 'PAUSED') {
      campaign.status = 'ACTIVE';
    } else {
      return { success: false };
    }

    campaign.updatedAt = new Date().toISOString();
    this.persist();
    return { success: true, newStatus: campaign.status };
  }

  // --- VISIT SESSIONS & VERIFICATION ---
  public startVisitSession(userId: number, campaignId: string): { success: boolean; visit?: CampaignVisit; error?: string } {
    const campaign = this.memoryDb.campaigns[campaignId];
    if (!campaign || campaign.status !== 'ACTIVE' || campaign.remainingVisits <= 0) {
      return { success: false, error: 'This campaign is no longer available.' };
    }

    if (campaign.ownerUserId === userId) {
      return { success: false, error: 'You cannot visit your own campaign.' };
    }

    // Check recent visit
    const recentVerified = Object.values(this.memoryDb.campaign_visits).find(
      (v) =>
        v.campaignId === campaignId &&
        v.userId === userId &&
        v.status === 'verified' &&
        Date.now() - v.startTime < 3600000 * 6
    );
    if (recentVerified) {
      return { success: false, error: 'You have already completed this campaign recently.' };
    }

    const visitId = `vst_${Date.now()}_${userId}`;
    const visit: CampaignVisit = {
      visitId,
      campaignId,
      userId,
      startTime: Date.now(),
      durationSeconds: campaign.minimumVisitSeconds,
      status: 'started',
      rewardCredited: false,
      rewardAmount: campaign.rewardPerVisit,
      createdAt: new Date().toISOString(),
    };

    this.memoryDb.campaign_visits[visitId] = visit;
    this.persist();
    return { success: true, visit };
  }

  public verifyVisitSession(
    visitId: string,
    userId: number
  ): {
    success: boolean;
    rewardAmount: number;
    newBalance: number;
    remainingSeconds?: number;
    error?: string;
  } {
    const visit = this.memoryDb.campaign_visits[visitId];
    if (!visit || visit.userId !== userId) {
      return { success: false, rewardAmount: 0, newBalance: 0, error: 'Visit session not found.' };
    }

    if (visit.status === 'verified') {
      const user = this.memoryDb.users[userId.toString()];
      return { success: false, rewardAmount: 0, newBalance: user?.balance || 0, error: 'Visit already verified.' };
    }

    const campaign = this.memoryDb.campaigns[visit.campaignId];
    if (!campaign) {
      visit.status = 'failed';
      this.persist();
      return { success: false, rewardAmount: 0, newBalance: 0, error: 'Campaign not found.' };
    }

    const elapsedSeconds = Math.floor((Date.now() - visit.startTime) / 1000);
    const requiredSeconds = visit.durationSeconds || campaign.minimumVisitSeconds || 20;

    if (elapsedSeconds < requiredSeconds) {
      return {
        success: false,
        rewardAmount: 0,
        newBalance: 0,
        remainingSeconds: requiredSeconds - elapsedSeconds,
        error: `Please stay on the website for at least ${requiredSeconds} seconds.`,
      };
    }

    // Mark visit as verified
    visit.status = 'verified';
    visit.verifiedTime = Date.now();
    visit.rewardCredited = true;

    // Update campaign stats
    campaign.completedVisits += 1;
    campaign.remainingVisits = Math.max(0, campaign.requiredVisits - campaign.completedVisits);
    if (campaign.remainingVisits === 0) {
      campaign.status = 'COMPLETED';
    }
    campaign.updatedAt = new Date().toISOString();

    // Update campaign owner stats
    const owner = this.memoryDb.users[campaign.ownerUserId.toString()];
    if (owner) {
      owner.trafficReceived += 1;
    }

    // Update visitor user stats & add credits
    const visitor = this.memoryDb.users[userId.toString()];
    if (!visitor) {
      return { success: false, rewardAmount: 0, newBalance: 0, error: 'Visitor not found.' };
    }

    visitor.trafficProvided += 1;
    const addRes = this.addCredits(
      userId,
      visit.rewardAmount,
      'traffic_reward',
      `👁️ Visit Verified: ${new URL(campaign.websiteUrl).hostname || campaign.websiteUrl}`
    );

    this.persist();
    return {
      success: true,
      rewardAmount: visit.rewardAmount,
      newBalance: addRes.newBalance,
    };
  }

  // --- PACKAGES & PAYMENTS ---
  public getPackages(): CreditPackage[] {
    return Object.values(this.memoryDb.packages);
  }

  public getPackageById(packageId: string): CreditPackage | null {
    return this.memoryDb.packages[packageId] || null;
  }

  public createPayment(
    userId: number,
    userName: string,
    packageId: string,
    method: PaymentMethod,
    trxId: string
  ): { success: boolean; payment?: Payment; error?: string } {
    const pkg = this.getPackageById(packageId);
    if (!pkg) return { success: false, error: 'Invalid package selected.' };

    const paymentId = `pay_${Date.now()}_${userId}`;
    const reference = `IH-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const payment: Payment = {
      paymentId,
      userId,
      userName,
      packageId,
      packageName: pkg.name,
      credits: pkg.credits,
      amount: pkg.price,
      method,
      reference,
      trxId: trxId.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDb.payments[paymentId] = payment;
    this.persist();
    return { success: true, payment };
  }

  public getUserPayments(userId: number): Payment[] {
    return Object.values(this.memoryDb.payments)
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- REFERRALS ---
  public getUserReferrals(userId: number): Referral[] {
    return Object.values(this.memoryDb.referrals)
      .filter((r) => r.referrerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- SUPPORT REQUESTS ---
  public createSupportRequest(userId: number, userName: string, message: string): SupportRequest {
    const ticketId = `ticket_${Date.now()}_${userId}`;
    const now = new Date().toISOString();
    const ticket: SupportRequest = {
      ticketId,
      userId,
      userName,
      message,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.memoryDb.support_requests[ticketId] = ticket;
    this.persist();
    return ticket;
  }

  // --- SYSTEM STATS & METRICS ---
  public getSystemStats() {
    const totalUsers = Object.keys(this.memoryDb.users).length;
    const totalCampaigns = Object.keys(this.memoryDb.campaigns).length;
    const activeCampaigns = Object.values(this.memoryDb.campaigns).filter((c) => c.status === 'ACTIVE').length;
    const completedVisits = Object.values(this.memoryDb.campaign_visits).filter((v) => v.status === 'verified').length;
    const totalCreditsCirculating = Object.values(this.memoryDb.users).reduce((acc, u) => acc + (u.balance || 0), 0);

    return {
      totalUsers,
      totalCampaigns,
      activeCampaigns,
      completedVisits,
      totalCreditsCirculating,
    };
  }

  // Get Today's Earned and Spent for a user
  public getUserTodayStats(userId: number): { earnedToday: number; spentToday: number } {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = startOfToday.getTime();

    const txs = Object.values(this.memoryDb.credit_transactions).filter(
      (t) => t.userId === userId && new Date(t.createdAt).getTime() >= todayTimestamp
    );

    let earnedToday = 0;
    let spentToday = 0;

    for (const t of txs) {
      if (t.amount > 0) {
        earnedToday += t.amount;
      } else if (t.amount < 0) {
        spentToday += Math.abs(t.amount);
      }
    }

    return { earnedToday, spentToday };
  }
}

export const db = new DatabaseService();

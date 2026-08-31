import { User, Campaign, CreditTransaction, CreditPackage, PaymentMethod } from '../types';
import { config } from '../config/env';

export const formatWelcomeMessage = (firstName: string): string => {
  return (
    `🚀 *Welcome to InfiniteHits!*\n\n` +
    `Your account has been created successfully.\n\n` +
    `🎁 *Welcome Bonus: 50 Credits*\n\n` +
    `Use your Credits to promote your website or earn more Credits by completing other users' campaigns.`
  );
};

export const formatMenuMessage = (user: User, todayEarned: number): string => {
  return (
    `🚀 *InfiniteHits*\n\n` +
    `👤 *User:* ${user.firstName || 'User'}\n\n` +
    `💰 *Credits:* ${user.balance.toLocaleString()}\n\n` +
    `📈 *Today's Earned:* ${todayEarned.toLocaleString()}\n\n` +
    `👁️ *Traffic Received:* ${user.trafficReceived.toLocaleString()}\n\n` +
    `👥 *Referrals:* ${user.referralCount.toLocaleString()}`
  );
};

export const formatAvailableCampaign = (campaign: Campaign, remainingVisits: number): string => {
  let hostname = campaign.websiteUrl;
  try {
    hostname = new URL(campaign.websiteUrl).hostname;
  } catch {}

  return (
    `🌐 *Available Campaign*\n\n` +
    `━━━━━━━━━━━━━━\n\n` +
    `🌐 *Website:*\n\`${hostname}\`\n\n` +
    `⏱ *Required Time:*\n${campaign.minimumVisitSeconds} seconds\n\n` +
    `🎁 *Reward:*\n+${campaign.rewardPerVisit} Credit\n\n` +
    `👁️ *Remaining:*\n${remainingVisits} Visits`
  );
};

export const formatNoCampaignsAvailable = (): string => {
  return (
    `🌐 *No Active Campaigns Available*\n\n` +
    `You have reviewed all available campaigns for now or there are no new campaigns right now.\n\n` +
    `💡 *What you can do:*\n` +
    `• Check back in a few minutes\n` +
    `• Create your own campaign under *➕ Promote Website*\n` +
    `• Claim your *🎁 Daily Bonus* or invite friends via *👥 Referral*`
  );
};

export const formatVisitStarted = (websiteUrl: string, seconds: number): string => {
  let hostname = websiteUrl;
  try {
    hostname = new URL(websiteUrl).hostname;
  } catch {}

  return (
    `⏳ *Visit Started*\n\n` +
    `Please visit the website and stay for the required duration.\n\n` +
    `🌐 *Target:* \`${hostname}\`\n` +
    `⏱ *Required time:* ${seconds} seconds\n\n` +
    `After staying on the site for the full duration, click *Verify Visit* below:`
  );
};

export const formatVisitVerified = (reward: number, newBalance: number): string => {
  return (
    `✅ *Visit Verified!*\n\n` +
    `🎁 *Reward:* +${reward} Credit\n\n` +
    `💰 *New Balance:* ${newBalance.toLocaleString()} Credits`
  );
};

export const formatVisitFailed = (error?: string): string => {
  return (
    `❌ *Visit could not be verified.*\n\n` +
    `${error || 'Please make sure you stayed on the website for the required duration.'}\n\n` +
    `No Credit was added.`
  );
};

export const formatPromoteUrlPrompt = (): string => {
  return (
    `🌐 *Promote Website*\n\n` +
    `Please send your website URL (e.g. \`https://example.com\`):\n\n` +
    `_Requirements:_\n` +
    `• Must begin with \`http://\` or \`https://\`\n` +
    `• Real active website without malware or popups`
  );
};

export const formatPromoteVisitsPrompt = (url: string, currentBalance: number): string => {
  return (
    `🌐 *Website:* \`${url}\`\n\n` +
    `💰 *Your Balance:* ${currentBalance.toLocaleString()} Credits\n\n` +
    `👁️ *How many visits do you need?*\n\n` +
    `_Rate: 1 Visit = 1 Credit_`
  );
};

export const formatCampaignSummary = (url: string, visits: number, cost: number, balance: number): string => {
  return (
    `📋 *Campaign Summary*\n\n` +
    `🌐 *Website:*\n\`${url}\`\n\n` +
    `👁️ *Visits:*\n${visits.toLocaleString()}\n\n` +
    `💳 *Cost:*\n${cost.toLocaleString()} Credits\n\n` +
    `💰 *Your Balance:*\n${balance.toLocaleString()} Credits`
  );
};

export const formatInsufficientCredits = (required: number, balance: number): string => {
  return (
    `❌ *Insufficient Credits*\n\n` +
    `Required:\n${required.toLocaleString()} Credits\n\n` +
    `Your Balance:\n${balance.toLocaleString()} Credits`
  );
};

export const formatCampaignCreatedSuccess = (campaign: Campaign, newBalance: number): string => {
  return (
    `🎉 *Campaign Started Successfully!*\n\n` +
    `Campaign ID: \`${campaign.campaignId}\`\n` +
    `🌐 Website: \`${campaign.websiteUrl}\`\n` +
    `👁️ Target Visits: ${campaign.requiredVisits.toLocaleString()}\n` +
    `💳 Credits Deducted: ${campaign.cost.toLocaleString()}\n` +
    `💰 Remaining Balance: ${newBalance.toLocaleString()} Credits\n\n` +
    `Real users will now visit your site. You can track progress in *📊 My Campaigns*.`
  );
};

export const formatMyCampaignsOverview = (campaigns: Campaign[]): string => {
  if (campaigns.length === 0) {
    return (
      `📊 *My Campaigns*\n\n` +
      `You have not created any website campaigns yet.\n\n` +
      `Click *➕ Promote Website* to launch your first traffic campaign!`
    );
  }

  let text = `📊 *My Campaigns*\n\n`;
  campaigns.forEach((c, idx) => {
    let host = c.websiteUrl;
    try {
      host = new URL(c.websiteUrl).hostname;
    } catch {}

    const statusEmoji = c.status === 'ACTIVE' ? '🟢 ACTIVE' : c.status === 'PAUSED' ? '⏸ PAUSED' : '🏁 COMPLETED';

    text +=
      `🌐 *Campaign #${idx + 1}:* \`${host}\`\n` +
      `Progress: ${c.completedVisits.toLocaleString()} / ${c.requiredVisits.toLocaleString()}\n` +
      `Remaining: ${c.remainingVisits.toLocaleString()}\n` +
      `Status: ${statusEmoji}\n\n`;
  });

  return text.trim();
};

export const formatReferralScreen = (user: User): string => {
  const botUser = config.BOT_USERNAME;
  const refLink = `https://t.me/${botUser}?start=${user.referralCode}`;

  return (
    `👥 *Referral Program*\n\n` +
    `Invite friends and earn Credits.\n\n` +
    `*Your Referrals:*\n${user.referralCount.toLocaleString()}\n\n` +
    `*Referral Earnings:*\n${user.referralEarnings.toLocaleString()} Credits\n\n` +
    `*Your Link:*\n\`${refLink}\`\n\n` +
    `🎁 *Reward:* 100 Credits per qualified friend who completes their first activity!`
  );
};

export const formatEarnCreditsHub = (): string => {
  return (
    `🎁 *Ways to Earn Credits*\n\n` +
    `🌐 *Complete Traffic Tasks*\n` +
    `Visit top websites and earn instant credits per visit.\n\n` +
    `👥 *Invite Friends*\n` +
    `Earn 100 Credits for every friend who joins using your link.\n\n` +
    `🎉 *Daily Bonus*\n` +
    `Claim 10 Free Credits every 24 hours.\n\n` +
    `⭐ *Promotional Rewards*\n` +
    `Participate in special platform milestones and events.`
  );
};

export const formatDailyBonusScreen = (canClaim: boolean, nextHours?: number, nextMins?: number): string => {
  if (canClaim) {
    return (
      `🎁 *Daily Bonus*\n\n` +
      `Today's reward:\n*+${config.DAILY_BONUS_AMOUNT} Credits*\n\n` +
      `Click the button below to claim your daily reward!`
    );
  }

  return (
    `⏳ *Daily Bonus Already Claimed*\n\n` +
    `You have already claimed your daily bonus today.\n\n` +
    `Next bonus available in: *${nextHours || 0}h ${nextMins || 0}m*.\n\n` +
    `Come back tomorrow for another bonus!`
  );
};

export const formatDailyBonusClaimed = (amount: number, newBalance: number): string => {
  return (
    `✅ *Daily Bonus Claimed!*\n\n` +
    `🎁 *+${amount} Credits*\n\n` +
    `💰 *New Balance:* ${newBalance.toLocaleString()} Credits\n\n` +
    `Come back tomorrow for another bonus.`
  );
};

export const formatBuyPackagesList = (): string => {
  return (
    `💳 *Buy Credit Packages*\n\n` +
    `Get instant traffic credits to scale your website campaigns:\n\n` +
    `🟢 *Starter:* 500 Credits — ৳50\n` +
    `🔵 *Popular:* 1,500 Credits — ৳120\n` +
    `🟣 *Pro:* 5,000 Credits — ৳350\n` +
    `🔥 *Business:* 10,000 Credits — ৳600\n\n` +
    `Select a package below to proceed:`
  );
};

export const formatPackageSelected = (pkg: CreditPackage): string => {
  return (
    `📦 *Package Selected*\n\n` +
    `Package:\n*${pkg.name}*\n\n` +
    `Credits:\n*${pkg.credits.toLocaleString()}*\n\n` +
    `Price:\n*৳${pkg.price}*\n\n` +
    `Choose payment method:`
  );
};

export const formatPaymentInstructions = (pkg: CreditPackage, method: PaymentMethod, reference: string): string => {
  const number = method === 'bKash' ? config.PAYMENT_BKASH_NUMBER : config.PAYMENT_NAGAD_NUMBER;

  return (
    `💳 *Payment Instructions*\n\n` +
    `Send *৳${pkg.price}* to:\n\n` +
    `Payment Method: *${method}*\n` +
    `Payment Number:\n\`${number}\`\n\n` +
    `Reference:\n\`${reference}\`\n\n` +
    `After completing the payment, click *I Have Paid* below to enter your Transaction ID:`
  );
};

export const formatPaymentPromptTrxId = (): string => {
  return (
    `✍️ *Enter Transaction ID / Reference*\n\n` +
    `Please type and send the Transaction ID (TrxID) you received after sending the payment (e.g. \`9K8L2M3N4P\`):\n\n` +
    `_Type your Transaction ID now:_`
  );
};

export const formatPaymentSubmittedPending = (paymentId: string, pkgName: string, amount: number, trxId: string): string => {
  const supportUser = config.SUPPORT_USERNAME;
  return (
    `⏳ *Payment Submitted & Pending Verification*\n\n` +
    `Payment ID: \`${paymentId}\`\n` +
    `Package: *${pkgName}*\n` +
    `Amount: *৳${amount}*\n` +
    `TrxID: \`${trxId}\`\n` +
    `Status: 🟡 *PENDING*\n\n` +
    `Your transaction has been securely logged. Once confirmed by our gateway/support team, the credits will be added to your balance.\n\n` +
    `For any queries, please reach out to @${supportUser}.`
  );
};

export const formatBalanceScreen = (user: User, todayEarned: number, todaySpent: number): string => {
  return (
    `💰 *Your Balance*\n\n` +
    `*Available Credits:*\n${user.balance.toLocaleString()}\n\n` +
    `*Earned Today:*\n${todayEarned.toLocaleString()}\n\n` +
    `*Spent Today:*\n${todaySpent.toLocaleString()}\n\n` +
    `*Total Earned:*\n${user.totalEarned.toLocaleString()}\n\n` +
    `*Total Spent:*\n${user.totalSpent.toLocaleString()}`
  );
};

export const formatStatisticsScreen = (user: User, activeCampaignsCount: number, completedCampaignsCount: number): string => {
  return (
    `📊 *Your Statistics*\n\n` +
    `👁️ *Traffic Received:*\n${user.trafficReceived.toLocaleString()}\n\n` +
    `🌐 *Traffic Provided:*\n${user.trafficProvided.toLocaleString()}\n\n` +
    `💰 *Credits Earned:*\n${user.totalEarned.toLocaleString()}\n\n` +
    `💳 *Credits Spent:*\n${user.totalSpent.toLocaleString()}\n\n` +
    `👥 *Referrals:*\n${user.referralCount.toLocaleString()}\n\n` +
    `🎁 *Referral Earnings:*\n${user.referralEarnings.toLocaleString()}\n\n` +
    `🌐 *Active Campaigns:*\n${activeCampaignsCount.toLocaleString()}\n\n` +
    `🌐 *Completed Campaigns:*\n${completedCampaignsCount.toLocaleString()}`
  );
};

export const formatHistoryScreen = (
  transactions: CreditTransaction[],
  page: number,
  totalPages: number,
  totalCount: number
): string => {
  if (transactions.length === 0) {
    return (
      `📜 *Credit History*\n\n` +
      `No transactions recorded yet.\n\n` +
      `Start visiting campaigns or claim your daily bonus to see your credit history!`
    );
  }

  let text = `📜 *Credit History* (Page ${page}/${totalPages} • Total: ${totalCount})\n\n`;

  transactions.forEach((tx) => {
    const isGain = tx.amount >= 0;
    const signEmoji = isGain ? '🟢 +' : '🔴 ';
    const formattedAmount = isGain ? tx.amount.toLocaleString() : Math.abs(tx.amount).toLocaleString();
    const dateStr = new Date(tx.createdAt).toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    text += `${signEmoji}${formattedAmount}\n${tx.description} • ${dateStr}\n\n`;
  });

  return text.trim();
};

export const formatProfileScreen = (user: User): string => {
  const createdDate = new Date(user.createdAt).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    `👤 *Profile*\n\n` +
    `*Name:* ${user.firstName} ${user.lastName || ''}\n` +
    `*Username:* ${user.username ? '@' + user.username : 'Not set'}\n` +
    `*User ID:* \`${user.telegramId}\`\n` +
    `*Account Created:* ${createdDate}\n` +
    `*Credits:* ${user.balance.toLocaleString()}\n` +
    `*Referrals:* ${user.referralCount.toLocaleString()}\n` +
    `*Total Earned:* ${user.totalEarned.toLocaleString()}\n` +
    `*Total Spent:* ${user.totalSpent.toLocaleString()}`
  );
};

export const formatSupportScreen = (): string => {
  const supportUser = config.SUPPORT_USERNAME;
  return (
    `🎧 *Support & Help Desk*\n\n` +
    `Need help with traffic exchange, campaigns, or credit packages?\n\n` +
    `• Official Support: @${supportUser}\n` +
    `• Check out frequently asked questions under *❓ FAQ*.\n\n` +
    `Choose an option below:`
  );
};

export const FAQ_ITEMS = [
  {
    id: 'faq_1',
    title: 'What are Credits?',
    answer:
      `💰 *What are Credits?*\n\n` +
      `Credits are the internal platform currency in InfiniteHits. You use Credits to promote your website to real users. 1 Credit equals 1 unique website visit.`,
  },
  {
    id: 'faq_2',
    title: 'How do I earn Credits?',
    answer:
      `🎁 *How do I earn Credits?*\n\n` +
      `You can earn free credits by:\n` +
      `1. Visiting other users' websites under *🌐 Get Traffic* (+1 credit per visit)\n` +
      `2. Claiming your *🎁 Daily Bonus* (+10 credits every 24 hours)\n` +
      `3. Inviting friends with your *👥 Referral link* (+100 credits per active referral)\n` +
      `4. Purchasing credit packages with bKash/Nagad`,
  },
  {
    id: 'faq_3',
    title: 'How do I get traffic?',
    answer:
      `🌐 *How do I get traffic?*\n\n` +
      `Click *➕ Promote Website*, send your valid website URL, and choose how many visits you want. Your campaign goes live immediately to all active Telegram users.`,
  },
  {
    id: 'faq_4',
    title: 'How do I promote my website?',
    answer:
      `➕ *How do I promote my website?*\n\n` +
      `1. Tap *➕ Promote Website*\n` +
      `2. Send your website link (e.g. \`https://mywebsite.com\`)\n` +
      `3. Select the package amount (50 to 5,000 visits)\n` +
      `4. Confirm campaign creation`,
  },
  {
    id: 'faq_5',
    title: 'How does referral work?',
    answer:
      `👥 *How does referral work?*\n\n` +
      `Share your personal referral link with friends. When they start the bot and complete their first activity (visit a website or claim daily bonus), you automatically receive 100 Credits!`,
  },
  {
    id: 'faq_6',
    title: 'How do I buy Credits?',
    answer:
      `💳 *How do I buy Credits?*\n\n` +
      `Tap *💳 Buy Credits*, select from Starter (500), Popular (1500), Pro (5000), or Business (10000), choose bKash or Nagad, and send the payment with your reference code.`,
  },
  {
    id: 'faq_7',
    title: 'Why was my traffic reward rejected?',
    answer:
      `⚠️ *Why was my traffic reward rejected?*\n\n` +
      `Rewards require spending at least 20 seconds on the website. If you click Verify Visit before the required time or duplicate visits rapidly, verification will fail.`,
  },
  {
    id: 'faq_8',
    title: 'How long does payment verification take?',
    answer:
      `⏳ *How long does payment verification take?*\n\n` +
      `Manual payment confirmations are verified and credited within 10 to 60 minutes. You can contact @${config.SUPPORT_USERNAME} anytime if you need immediate processing.`,
  },
];

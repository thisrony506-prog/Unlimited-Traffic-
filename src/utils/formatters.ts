import { User, Campaign, CreditTransaction, CreditPackage, PaymentMethod } from '../types';
import { config } from '../config/env';

// Safe number formatter helper to protect against undefined, null, or NaN
const fmtNum = (val: any): string => {
  const n = Number(val);
  return (isNaN(n) ? 0 : n).toLocaleString();
};

export const formatWelcomeMessage = (firstName: string): string => {
  return (
    `🚀 *WELCOME TO INFINITEHITS!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Hello *${firstName || 'User'}*, your account has been successfully initialized on our global Traffic & Ad Rewards Network.\n\n` +
    `🎁 *Welcome Bonus Credited:* \`+${fmtNum(config.NEW_USER_BONUS)} Credits\`\n\n` +
    `💡 *What you can do:*\n` +
    `• 🌐 *Earn Credits:* Visit live websites, watch Monetag ads, and claim daily bonuses.\n` +
    `• ➕ *Promote Websites:* Launch real traffic campaigns to grow your websites & links.\n` +
    `• 👥 *Refer Friends:* Earn +100 Credits for every invited user.\n\n` +
    `👇 *Tap any button below to get started:*`
  );
};

export const formatMenuMessage = (user: User, todayEarned: number): string => {
  return (
    `🚀 *INFINITEHITS CONTROL PANEL*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *User:* \`${user.firstName || 'User'}\` • \`ID: ${user.telegramId}\`\n` +
    `💰 *Current Balance:* *${fmtNum(user.balance)} Credits / Tokens*\n` +
    `📈 *Today's Earnings:* *+${fmtNum(todayEarned)} Credits*\n` +
    `👁️ *Traffic Received:* *${fmtNum(user.trafficReceived)} Visitors*\n` +
    `👥 *Total Referrals:* *${fmtNum(user.referralCount ?? (user as any).totalReferrals)} Users*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ *Quick Actions:* Select an option from the menu below to earn or promote.`
  );
};

export const formatAvailableCampaign = (campaign: Campaign, remainingVisits: number): string => {
  let hostname = campaign.websiteUrl;
  try {
    hostname = new URL(campaign.websiteUrl).hostname;
  } catch {}

  return (
    `🌐 *AVAILABLE TRAFFIC CAMPAIGN*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎯 *Target Site:* \`${hostname}\`\n` +
    `⏱️ *Stay Duration:* *${fmtNum(campaign.minimumVisitSeconds || 20)} Seconds*\n` +
    `🎁 *Reward per Visit:* \`+${fmtNum(campaign.rewardPerVisit || 1)} Credits\`\n` +
    `📊 *Remaining Visits:* *${fmtNum(remainingVisits)} Visits*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *Instructions:*\n` +
    `1. Click *🚀 Visit Website* to open the link.\n` +
    `2. Stay on the site until the countdown completes.\n` +
    `3. Return and click *✅ Verify Visit* to receive instant credits!`
  );
};

export const formatNoCampaignsAvailable = (): string => {
  return (
    `🌐 *NO ACTIVE CAMPAIGNS AVAILABLE*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `You have completed all currently active traffic campaigns!\n\n` +
    `💡 *More ways to earn right now:*\n` +
    `• 📺 *Monetag Ads:* Watch quick video ads for instant *+5 Credits*.\n` +
    `• 🎁 *Daily Bonus:* Claim your free daily reward.\n` +
    `• 👥 *Invite Friends:* Earn *+100 Credits* per referral.\n` +
    `• ➕ *Promote Website:* Add your own website campaign.`
  );
};

export const formatVisitStarted = (websiteUrl: string, seconds: number): string => {
  let hostname = websiteUrl;
  try {
    hostname = new URL(websiteUrl).hostname;
  } catch {}

  return (
    `⏳ *TRAFFIC TASK IN PROGRESS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🌐 *Target Website:* \`${hostname}\`\n` +
    `⏱️ *Required View Time:* *${fmtNum(seconds)} Seconds*\n\n` +
    `⚠️ *Important:*\n` +
    `Please browse the opened site and keep it active for the full *${fmtNum(seconds)}s*. Once finished, tap *Verify Visit* below to claim your reward.`
  );
};

export const formatVisitVerified = (reward: number, newBalance: number): string => {
  return (
    `✅ *VISIT SUCCESSFULLY VERIFIED!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎁 *Reward Credited:* \`+${fmtNum(reward)} Credits\`\n` +
    `💰 *Updated Balance:* *${fmtNum(newBalance)} Credits*\n\n` +
    `🚀 Keep visiting to accumulate more credits or launch your own campaign!`
  );
};

export const formatVisitFailed = (error?: string): string => {
  return (
    `❌ *VISIT VERIFICATION FAILED*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Reason: ${error || 'The required stay duration was not met.'}\n\n` +
    `💡 *Tip:* Ensure you stay on the page until the required timer finishes before clicking verify.`
  );
};

export const formatPromoteUrlPrompt = (): string => {
  return (
    `➕ *PROMOTE YOUR WEBSITE (ওয়েবসাইট প্রোমোট)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Drive real, high-retention human visitors to your link or website.\n\n` +
    `🔗 *Step 1:* Please send your website URL (e.g. \`https://mywebsite.com\`):\n\n` +
    `_Requirements:_\n` +
    `• Must start with \`https://\` or \`http://\`\n` +
    `• Must be an active, accessible site without malicious code or auto-downloads`
  );
};

export const formatPromoteDurationPrompt = (url: string, currentBalance: number): string => {
  return (
    `➕ *CAMPAIGN CONFIGURATION (ধাপ ২ - সময় নির্বাচন)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🌐 *Target URL:* \`${url}\`\n` +
    `💰 *Your Balance:* *${fmtNum(currentBalance)} Credits*\n\n` +
    `⏱️ *Select Viewer Stay Duration (ভিজিট সময়):*\n` +
    `Choose how long each visitor must explore your website before earning tokens:\n\n` +
    `• ⏱ *15s Stay* ➔ *1 Token / Visit* (Quick Visit)\n` +
    `• ⏱ *30s Stay* ➔ *2 Tokens / Visit* (Standard Engagement)\n` +
    `• ⏱ *45s Stay* ➔ *3 Tokens / Visit* (High Retention)\n` +
    `• ⏱ *60s Stay* ➔ *4 Tokens / Visit* (Deep Read)\n` +
    `• ⏱ *90s Stay* ➔ *6 Tokens / Visit* (Ultra Engagement)\n` +
    `• ⏱ *120s Stay* ➔ *8 Tokens / Visit* (Maximum Retention)\n\n` +
    `👇 *Tap a preset button below or send custom seconds (e.g. \`30\`):*`
  );
};

export const formatPromoteVisitsPrompt = (
  url: string,
  durationSeconds: number,
  costPerVisit: number,
  currentBalance: number
): string => {
  return (
    `➕ *CAMPAIGN CONFIGURATION (ধাপ ৩ - ভিজিটর সংখ্যা)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🌐 *Target URL:* \`${url}\`\n` +
    `⏱️ *Ad Duration:* *${fmtNum(durationSeconds)}s* (${fmtNum(costPerVisit)} Tokens / Visit)\n` +
    `💰 *Available Balance:* *${fmtNum(currentBalance)} Tokens*\n\n` +
    `👁️ *How many visitors do you want? (কতগুলো ভিউ চান?)*\n\n` +
    `Select a quantity preset below or send any number (e.g. \`50\`, \`100\`, \`500\`):`
  );
};

export const formatCampaignSummary = (
  url: string,
  durationSeconds: number,
  costPerVisit: number,
  visits: number,
  cost: number,
  balance: number
): string => {
  return (
    `📋 *CAMPAIGN ORDER SUMMARY*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🌐 *Target URL:* \`${url}\`\n` +
    `⏱️ *Viewer Duration:* *${fmtNum(durationSeconds)} Seconds*\n` +
    `🎁 *Visitor Reward:* *${fmtNum(costPerVisit)} Token / Visit*\n` +
    `👁️ *Target Quantity:* *${fmtNum(visits)} Unique Visits*\n` +
    `💳 *Total Campaign Cost:* \`${fmtNum(cost)} Tokens\` (${fmtNum(visits)} × ${fmtNum(costPerVisit)})\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Current Balance:* ${fmtNum(balance)} Tokens\n` +
    `🪙 *Balance After Order:* ${fmtNum(balance - cost)} Tokens\n\n` +
    `Confirm to launch this campaign to the live network:`
  );
};

export const formatInsufficientCredits = (required: number, balance: number): string => {
  return (
    `❌ *INSUFFICIENT CREDITS / TOKENS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Required for this order: \`${fmtNum(required)} Credits\`\n` +
    `Your current balance: \`${fmtNum(balance)} Credits\`\n` +
    `Shortage: \`${fmtNum(required - balance)} Credits\`\n\n` +
    `💡 *How to get more credits:*\n` +
    `• 💳 Purchase instant credit packages with bKash / Nagad\n` +
    `• 📺 Watch Monetag Ads for +5 Credits each\n` +
    `• 🌐 Complete traffic tasks in the Earn menu`
  );
};

export const formatCampaignCreatedSuccess = (campaign: Campaign, newBalance: number): string => {
  return (
    `🎉 *CAMPAIGN LAUNCHED SUCCESSFULLY!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🆔 *Campaign ID:* \`${campaign.campaignId}\`\n` +
    `🌐 *Website:* \`${campaign.websiteUrl}\`\n` +
    `👁️ *Target Visits:* *${fmtNum(campaign.requiredVisits)} Visitors*\n` +
    `💳 *Credits Deducted:* \`-${fmtNum(campaign.cost)} Credits\`\n` +
    `💰 *New Balance:* \`${fmtNum(newBalance)} Credits\`\n\n` +
    `🟢 *Status: LIVE & ACTIVE*\n` +
    `Real users will start viewing your website immediately. You can track or pause your campaign anytime from *📊 My Campaigns*.`
  );
};

export const formatMyCampaignsOverview = (campaigns: Campaign[]): string => {
  if (campaigns.length === 0) {
    return (
      `📊 *MY PROMOTED CAMPAIGNS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `You currently have no campaigns running.\n\n` +
      `Click *➕ Promote Website* below to start sending real traffic to your websites!`
    );
  }

  let text = `📊 *MY PROMOTED CAMPAIGNS*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  campaigns.forEach((c, idx) => {
    let host = c.websiteUrl;
    try {
      host = new URL(c.websiteUrl).hostname;
    } catch {}

    const statusEmoji = c.status === 'ACTIVE' ? '🟢 LIVE' : c.status === 'PAUSED' ? '⏸ PAUSED' : '🏁 COMPLETED';
    const percent = Math.min(100, Math.round(((c.completedVisits || 0) / (c.requiredVisits || 1)) * 100));

    text +=
      `🌐 *#${idx + 1}: \`${host}\`*\n` +
      `• Progress: *${fmtNum(c.completedVisits)} / ${fmtNum(c.requiredVisits)}* (${percent}%)\n` +
      `• Remaining: *${fmtNum(c.remainingVisits)} visits*\n` +
      `• Status: *${statusEmoji}*\n\n`;
  });

  return text.trim();
};

export const formatReferralScreen = (user: User): string => {
  const botUser = config.BOT_USERNAME;
  const refLink = `https://t.me/${botUser}?start=${user.referralCode}`;

  return (
    `👥 *REFERRAL & AFFILIATE REWARDS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Invite friends to InfiniteHits and earn unlimited bonus credits!\n\n` +
    `📊 *Your Referral Stats:*\n` +
    `• Total Friends Invited: *${fmtNum(user.referralCount ?? (user as any).totalReferrals)} Users*\n` +
    `• Total Referral Income: *${fmtNum(user.referralEarnings)} Credits*\n` +
    `• Reward Rate: *+100 Credits per qualified friend*\n\n` +
    `🔗 *Your Unique Referral Link:*\n\`${refLink}\`\n\n` +
    `_Share this link with your friends or social channels to start earning passive credits!_`
  );
};

export const formatEarnCreditsHub = (): string => {
  return (
    `🎁 *EARN FREE CREDITS HUB*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Choose from any of our verified reward methods:\n\n` +
    `📺 *1. Monetag Ads (Mini App)*\n` +
    `Watch quick sponsor video ads & banners to earn *+${config.MONETAG_REWARD_CREDITS || 5} Credits* per ad.\n\n` +
    `🌐 *2. Traffic Exchange Tasks*\n` +
    `Visit partner websites and get instant token rewards per verified visit.\n\n` +
    `👥 *3. Referral Program*\n` +
    `Earn *+100 Credits* for every active friend you invite.\n\n` +
    `🎉 *4. 24h Daily Bonus*\n` +
    `Claim your free *+10 Credits* every single day!`
  );
};

export const formatMonetagAdsScreen = (
  adsWatchedToday: number,
  dailyLimit: number,
  remainingToday: number,
  rewardPerAd: number,
  userBalance: number
): string => {
  return (
    `📺 *MONETAG ADS & MINI APP REWARDS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Watch short sponsor ads to earn instant Credits directly to your balance!\n\n` +
    `🎁 *Reward per Ad:* \`+${fmtNum(rewardPerAd)} Credits\`\n` +
    `📊 *Today's Completed:* *${fmtNum(adsWatchedToday)} / ${fmtNum(dailyLimit)} Ads*\n` +
    `⏳ *Remaining Limit Today:* *${fmtNum(remainingToday)} Ads*\n` +
    `💰 *Your Current Balance:* *${fmtNum(userBalance)} Credits*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 *Option A:* Launch the interactive Telegram Mini App.\n` +
    `🎬 *Option B:* Tap *Watch Direct Monetag Ad*, view sponsor page, and tap *Claim Reward*!`
  );
};

export const formatDailyBonusScreen = (canClaim: boolean, nextHours?: number, nextMins?: number): string => {
  if (canClaim) {
    return (
      `🎁 *DAILY BONUS REWARD*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Your 24-hour daily reward is ready to claim!\n\n` +
      `💎 *Today's Gift:* \`+${config.DAILY_BONUS_AMOUNT} Free Credits\`\n\n` +
      `Tap *🎁 Claim Bonus* below to collect your reward instantly.`
    );
  }

  return (
    `⏳ *DAILY BONUS ALREADY CLAIMED*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `You have already claimed your reward for today.\n\n` +
    `⏰ *Next Bonus Unlocks In:* *${nextHours || 0} Hours ${nextMins || 0} Minutes*\n\n` +
    `💡 In the meantime, you can watch Monetag Ads or visit websites to keep earning credits!`
  );
};

export const formatDailyBonusClaimed = (amount: number, newBalance: number): string => {
  return (
    `✅ *DAILY BONUS COLLECTED!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎁 *Credited:* \`+${fmtNum(amount)} Credits\`\n` +
    `💰 *New Total Balance:* *${fmtNum(newBalance)} Credits*\n\n` +
    `Come back again tomorrow for your next reward!`
  );
};

export const formatBuyPackagesList = (): string => {
  return (
    `💳 *INSTANT CREDIT PACKAGES*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Scale your website traffic with instant credit top-ups:\n\n` +
    `🟢 *Starter Package:* \`500 Credits\` ➔ *৳50*\n` +
    `🔵 *Popular Package:* \`1,500 Credits\` ➔ *৳120* _(Save 20%)_\n` +
    `🟣 *Pro Growth:* \`5,000 Credits\` ➔ *৳350* _(Best Value)_\n` +
    `🔥 *Enterprise VIP:* \`10,000 Credits\` ➔ *৳600* _(Max Traffic)_\n\n` +
    `⚡ *Payment Methods:* bKash & Nagad Personal Send Money (Instant Processing)\n\n` +
    `👇 *Select a package to continue:*`
  );
};

export const formatPackageSelected = (pkg: CreditPackage): string => {
  return (
    `📦 *PACKAGE ORDER DETAILS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `• Package: *${pkg.name}*\n` +
    `• Total Credits: \`+${fmtNum(pkg.credits)} Credits\`\n` +
    `• Price: *৳${fmtNum(pkg.price)} BDT*\n\n` +
    `👇 *Select your preferred payment gateway:*`
  );
};

export const formatPaymentInstructions = (pkg: CreditPackage, method: PaymentMethod, reference: string): string => {
  const number = method === 'bKash' ? config.PAYMENT_BKASH_NUMBER : config.PAYMENT_NAGAD_NUMBER;

  return (
    `💳 *PAYMENT INSTRUCTIONS (${method.toUpperCase()})*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `1. Open your *${method}* App.\n` +
    `2. Select *Send Money*.\n` +
    `3. Send exactly *৳${fmtNum(pkg.price)}* to:\n\n` +
    `📱 *${method} Number:*\n\`${number}\`\n\n` +
    `📝 *Reference Code:*\n\`${reference}\`\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `4. Copy the *Transaction ID (TrxID)* from the SMS/App.\n` +
    `5. Click *✅ I Have Paid* below to submit your TrxID for instant verification.`
  );
};

export const formatPaymentPromptTrxId = (): string => {
  return (
    `✍️ *SUBMIT TRANSACTION ID (TrxID)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Please type and send the Transaction ID (TrxID) you received after sending the payment (e.g. \`9K8L2M3N4P\`):\n\n` +
    `_Send your Transaction ID now:_`
  );
};

export const formatPaymentSubmittedPending = (paymentId: string, pkgName: string, amount: number, trxId: string): string => {
  const supportUser = config.SUPPORT_USERNAME;
  return (
    `⏳ *PAYMENT SUBMITTED FOR VERIFICATION*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🆔 *Payment ID:* \`${paymentId}\`\n` +
    `📦 *Package:* *${pkgName}*\n` +
    `💵 *Amount:* *৳${fmtNum(amount)} BDT*\n` +
    `🔢 *TrxID:* \`${trxId}\`\n` +
    `🟡 *Status:* *PENDING APPROVAL*\n\n` +
    `Your transaction has been securely logged. Credits will be automatically credited to your balance upon verification.\n\n` +
    `💬 Need fast assistance? Contact @${supportUser}.`
  );
};

export const formatBalanceScreen = (user: User, todayEarned: number, todaySpent: number): string => {
  return (
    `💰 *FINANCIAL BALANCE OVERVIEW*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `💎 *Available Balance:* \`${fmtNum(user.balance)} Credits / Tokens\`\n\n` +
    `📈 *Today's Earnings:* \`+${fmtNum(todayEarned)} Credits\`\n` +
    `📉 *Today's Spent:* \`-${fmtNum(todaySpent)} Credits\`\n` +
    `🏆 *Lifetime Earned:* \`${fmtNum(user.totalEarned)} Credits\`\n` +
    `💳 *Lifetime Spent:* \`${fmtNum(user.totalSpent)} Credits\`\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Use your credits to drive visitors or purchase more packages below:`
  );
};

export const formatStatisticsScreen = (user: User, activeCampaignsCount: number, completedCampaignsCount: number): string => {
  return (
    `📊 *ACCOUNT PERFORMANCE STATS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👁️ *Traffic Received on Sites:* *${fmtNum(user.trafficReceived)} Visitors*\n` +
    `🌐 *Traffic Tasks Completed:* *${fmtNum(user.trafficProvided)} Visits*\n` +
    `💰 *Total Credits Earned:* *${fmtNum(user.totalEarned)}*\n` +
    `💳 *Total Credits Spent:* *${fmtNum(user.totalSpent)}*\n` +
    `👥 *Referrals Joined:* *${fmtNum(user.referralCount ?? (user as any).totalReferrals)} Users*\n` +
    `🎁 *Referral Commissions:* *${fmtNum(user.referralEarnings)} Credits*\n` +
    `🟢 *Active Campaigns:* *${fmtNum(activeCampaignsCount)}*\n` +
    `🏁 *Completed Campaigns:* *${fmtNum(completedCampaignsCount)}*`
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
      `📜 *CREDIT TRANSACTION HISTORY*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `No activity recorded yet.\n\n` +
      `Earn or spend credits to see your live audit log here!`
    );
  }

  let text = `📜 *CREDIT TRANSACTION HISTORY*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📄 *Page ${fmtNum(page)} of ${fmtNum(totalPages)}* (Total: ${fmtNum(totalCount)} records)\n\n`;

  transactions.forEach((tx) => {
    const isGain = (tx.amount ?? 0) >= 0;
    const signEmoji = isGain ? '🟢 +' : '🔴 -';
    const formattedAmount = isGain ? fmtNum(tx.amount) : fmtNum(Math.abs(tx.amount));
    const dateStr = new Date(tx.createdAt || Date.now()).toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    text += `${signEmoji}*${formattedAmount} Credits* • \`${tx.type || 'Transaction'}\`\n_${tx.description || 'Activity'}_ • ${dateStr}\n\n`;
  });

  return text.trim();
};

export const formatProfileScreen = (user: User): string => {
  const createdDate = new Date(user.createdAt || Date.now()).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    `👤 *USER PROFILE & DETAILS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `• *Full Name:* ${user.firstName || 'User'} ${user.lastName || ''}\n` +
    `• *Username:* ${user.username ? '@' + user.username : 'None'}\n` +
    `• *Telegram ID:* \`${user.telegramId}\`\n` +
    `• *Member Since:* ${createdDate}\n` +
    `• *Current Balance:* *${fmtNum(user.balance)} Credits*\n` +
    `• *Invited Users:* *${fmtNum(user.referralCount ?? (user as any).totalReferrals)}*\n` +
    `• *Total Earned:* *${fmtNum(user.totalEarned)} Credits*`
  );
};

export const formatSupportScreen = (): string => {
  const supportUser = config.SUPPORT_USERNAME;
  return (
    `🎧 *SUPPORT & HELPDESK*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Have questions or need manual verification assistance?\n\n` +
    `• 👨‍💼 *Official Telegram Admin:* @${supportUser}\n` +
    `• ⏱ *Support Hours:* 24/7 Rapid Response\n` +
    `• ❓ *Frequently Asked Questions:* Check the FAQ section below\n\n` +
    `👇 *Select a topic or contact support:*`
  );
};

export const FAQ_ITEMS = [
  {
    id: 'faq_1',
    title: 'What are Credits / Tokens?',
    answer:
      `💰 *What are Credits / Tokens?*\n\n` +
      `Credits are the internal platform currency in InfiniteHits. 1 Credit corresponds to 1 real, verified visit to your website campaign.`,
  },
  {
    id: 'faq_2',
    title: 'How do I earn Credits?',
    answer:
      `🎁 *How do I earn Credits?*\n\n` +
      `1. 🌐 *Traffic Tasks:* Visit websites for +1 to +8 Credits.\n` +
      `2. 📺 *Monetag Ads:* Watch sponsored video ads for +5 Credits.\n` +
      `3. 🎁 *Daily Bonus:* Collect +10 Credits every 24 hours.\n` +
      `4. 👥 *Referrals:* Earn +100 Credits for every friend who joins!`,
  },
  {
    id: 'faq_3',
    title: 'How do I promote my website?',
    answer:
      `➕ *How do I promote my website?*\n\n` +
      `1. Tap *➕ Promote Website*\n` +
      `2. Send your website link (e.g. \`https://mywebsite.com\`)\n` +
      `3. Select duration & target visitors (15s to 120s)\n` +
      `4. Confirm campaign to go live instantly!`,
  },
  {
    id: 'faq_4',
    title: 'How does the Monetag Ad reward work?',
    answer:
      `📺 *How does Monetag Ad reward work?*\n\n` +
      `Open the Mini App, tap *Watch*, view the 10-second sponsor ad, and the reward (+5 Credits) is immediately credited to your balance. You can watch up to 20 ads per day!`,
  },
  {
    id: 'faq_5',
    title: 'How do I buy Credits with bKash/Nagad?',
    answer:
      `💳 *How do I buy Credits?*\n\n` +
      `Go to *💳 Buy Credits*, pick your package, choose bKash or Nagad, send money to the provided number with your reference code, and submit your Transaction ID (TrxID).`,
  },
  {
    id: 'faq_6',
    title: 'How long does payment approval take?',
    answer:
      `⏳ *How long does payment verification take?*\n\n` +
      `Manual payment confirmations are verified within 5 to 30 minutes. Contact @${config.SUPPORT_USERNAME} anytime for instant expedited verification.`,
  },
];


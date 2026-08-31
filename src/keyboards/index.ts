import { Keyboard, InlineKeyboard } from 'grammy';
import { config } from '../config/env';
import { CreditPackage, Campaign } from '../types';

/**
 * Main Persistent Reply Keyboard
 */
export const mainReplyKeyboard = new Keyboard()
  .text('🌐 Get Traffic').text('➕ Promote Website').row()
  .text('💳 Buy Credits').text('🎁 Earn Credits').row()
  .text('👥 Referral').text('💰 My Balance').row()
  .text('📊 Statistics').text('📜 History').row()
  .text('🎧 Support')
  .resized();

/**
 * Main Menu Inline Keyboard
 */
export const mainInlineKeyboard = new InlineKeyboard()
  .text('🌐 Get Traffic', 'nav_traffic')
  .text('➕ Promote Website', 'nav_promote')
  .row()
  .text('💳 Buy Credits', 'nav_packages')
  .text('🎁 Earn Credits', 'nav_earn')
  .row()
  .text('👥 Referral', 'nav_referral')
  .text('💰 My Balance', 'nav_balance')
  .row()
  .text('📊 Statistics', 'nav_stats')
  .text('📜 History', 'nav_history')
  .row()
  .text('🎧 Support', 'nav_support');

/**
 * Back to Main Menu button
 */
export const backToMainInlineKeyboard = new InlineKeyboard().text('🏠 Main Menu', 'nav_main');

/**
 * Traffic Campaign Navigation Inline Keyboard
 */
export const campaignViewInlineKeyboard = (campaignId: string, hasNext: boolean) => {
  const kb = new InlineKeyboard().text('🚀 Visit Website', `visit_start_${campaignId}`).row();
  if (hasNext) {
    kb.text('➡️ Next Campaign', 'traffic_next').row();
  }
  kb.text('🔙 Back', 'nav_main');
  return kb;
};

/**
 * Visit Session Active Inline Keyboard
 */
export const visitSessionInlineKeyboard = (visitId: string, websiteUrl: string) => {
  return new InlineKeyboard()
    .url('🌐 Open Website', websiteUrl)
    .row()
    .text('✅ Verify Visit', `visit_verify_${visitId}`)
    .row()
    .text('❌ Cancel', 'nav_traffic');
};

/**
 * Visit Completed Navigation
 */
export const visitCompletedInlineKeyboard = new InlineKeyboard()
  .text('🌐 Next Campaign', 'nav_traffic')
  .row()
  .text('🏠 Main Menu', 'nav_main');

/**
 * Promote Website: Select Duration (Seconds)
 */
export const promoteDurationInlineKeyboard = new InlineKeyboard()
  .text('⏱ 15s (1 Token/Visit)', 'promote_duration_15')
  .text('⏱ 30s (2 Tokens/Visit)', 'promote_duration_30')
  .row()
  .text('⏱ 45s (3 Tokens/Visit)', 'promote_duration_45')
  .text('⏱ 60s (4 Tokens/Visit)', 'promote_duration_60')
  .row()
  .text('⏱ 90s (6 Tokens/Visit)', 'promote_duration_90')
  .text('⏱ 120s (8 Tokens/Visit)', 'promote_duration_120')
  .row()
  .text('🔙 Back', 'nav_main');

/**
 * Promote Website: Select Visits
 */
export const promoteVisitsInlineKeyboard = new InlineKeyboard()
  .text('10 Visits', 'promote_visits_10')
  .text('25 Visits', 'promote_visits_25')
  .row()
  .text('50 Visits', 'promote_visits_50')
  .text('100 Visits', 'promote_visits_100')
  .row()
  .text('500 Visits', 'promote_visits_500')
  .text('1,000 Visits', 'promote_visits_1000')
  .row()
  .text('🔙 Back', 'nav_main');

/**
 * Promote Website: Confirm
 */
export const promoteConfirmInlineKeyboard = new InlineKeyboard()
  .text('✅ Start Campaign', 'promote_confirm_yes')
  .text('❌ Cancel', 'promote_cancel');

/**
 * Insufficient Credits Inline Keyboard
 */
export const insufficientCreditsInlineKeyboard = new InlineKeyboard()
  .text('💳 Buy Credits', 'nav_packages')
  .text('🎁 Earn Credits', 'nav_earn')
  .row()
  .text('🔙 Back', 'nav_main');

/**
 * My Campaigns Inline Keyboard
 */
export const myCampaignsInlineKeyboard = (campaigns: Campaign[]) => {
  const kb = new InlineKeyboard();

  campaigns.slice(0, 5).forEach((c) => {
    const isPaused = c.status === 'PAUSED';
    const toggleIcon = isPaused ? '▶️ Resume' : '⏸ Pause';
    kb.text(`${toggleIcon} (${c.remainingVisits} left)`, `camp_toggle_${c.campaignId}`)
      .text('📊 Details', `camp_detail_${c.campaignId}`)
      .row();
  });

  kb.text('➕ Promote Website', 'nav_promote').row();
  kb.text('🔙 Back', 'nav_stats');
  return kb;
};

/**
 * Earn Credits Hub Inline Keyboard
 */
export const earnCreditsInlineKeyboard = () => {
  const miniappUrl = `${config.APP_URL}/miniapp`;
  const kbSyst = new InlineKeyboard();

  // Mini App webApp button + bot ad button
  if (config.APP_URL.startsWith('https://')) {
    kbSyst.webApp('📱 Watch Monetag Ads (Mini App)', miniappUrl).row();
  } else {
    kbSyst.text('📺 Watch Monetag Ads (+5 Credits)', 'nav_monetag_ads').row();
  }

  kbSyst
    .text('🌐 Traffic Tasks', 'nav_traffic')
    .text('👥 Referral', 'nav_referral')
    .row()
    .text('🎁 Daily Bonus', 'nav_daily_bonus')
    .text('📺 Monetag Ads', 'nav_monetag_ads')
    .row()
    .text('🔙 Back', 'nav_main');

  return kbSyst;
};

/**
 * Monetag Ads Hub Inline Keyboard
 */
export const monetagAdsInlineKeyboard = (miniappUrl?: string) => {
  const url = miniappUrl || `${config.APP_URL}/miniapp`;
  const kb = new InlineKeyboard();

  if (url.startsWith('https://')) {
    kb.webApp('🚀 Open Mini App (Watch & Earn)', url).row();
  } else {
    kb.url('🚀 Open Web Mini App', url).row();
  }

  if (config.MONETAG_DIRECT_LINK) {
    kb.url('🎬 Watch Direct Monetag Ad', config.MONETAG_DIRECT_LINK).row();
  }

  kb.text('✅ Claim Ad Reward (+5 Credits)', 'monetag_claim_reward')
    .row()
    .text('🔙 Back to Earn Menu', 'nav_earn');

  return kb;
};

/**
 * Daily Bonus Claim Inline Keyboard
 */
export const dailyBonusInlineKeyboard = new InlineKeyboard()
  .text('🎁 Claim Bonus', 'daily_bonus_claim')
  .row()
  .text('🔙 Back', 'nav_earn');

/**
 * Buy Credits Packages Inline Keyboard
 */
export const buyPackagesInlineKeyboard = (packages: CreditPackage[]) => {
  const kb = new InlineKeyboard();
  packages.forEach((pkg) => {
    kb.text(`${pkg.badge || '📦'} ${pkg.name} (${(pkg.credits ?? 0).toLocaleString()}) — ৳${pkg.price}`, `buy_pkg_${pkg.packageId}`).row();
  });
  kb.text('🔙 Back', 'nav_main');
  return kb;
};

/**
 * Payment Method Selection Inline Keyboard
 */
export const paymentMethodsInlineKeyboard = (packageId: string) => {
  return new InlineKeyboard()
    .text('💳 bKash', `pay_method_${packageId}_bKash`)
    .text('💳 Nagad', `pay_method_${packageId}_Nagad`)
    .row()
    .text('💳 Other', `pay_method_${packageId}_Other`)
    .row()
    .text('🔙 Back', 'nav_packages');
};

/**
 * Payment Instructions Inline Keyboard
 */
export const paymentInstructionsInlineKeyboard = new InlineKeyboard()
  .text('✅ I Have Paid', 'pay_confirm_prompt')
  .text('❌ Cancel', 'nav_packages');

/**
 * Balance View Inline Keyboard
 */
export const balanceInlineKeyboard = new InlineKeyboard()
  .text('💳 Buy Credits', 'nav_packages')
  .text('🎁 Earn Credits', 'nav_earn')
  .row()
  .text('📜 History', 'nav_history')
  .row()
  .text('🏠 Main Menu', 'nav_main');

/**
 * Statistics View Inline Keyboard
 */
export const statsInlineKeyboard = new InlineKeyboard()
  .text('📊 My Campaigns', 'nav_my_campaigns')
  .text('📜 History', 'nav_history')
  .row()
  .text('🏠 Main Menu', 'nav_main');

/**
 * History Pagination Inline Keyboard
 */
export const historyInlineKeyboard = (currentPage: number, totalPages: number) => {
  const kb = new InlineKeyboard();
  const buttons = [];

  if (currentPage > 1) {
    buttons.push({ text: '⬅️ Previous', callback_data: `hist_page_${currentPage - 1}` });
  }
  if (currentPage < totalPages) {
    buttons.push({ text: '➡️ Next', callback_data: `hist_page_${currentPage + 1}` });
  }

  if (buttons.length > 0) {
    buttons.forEach((b) => kb.text(b.text, b.callback_data));
    kb.row();
  }

  kb.text('🏠 Main Menu', 'nav_main');
  return kb;
};

/**
 * Referral View Inline Keyboard
 */
export const referralInlineKeyboard = (referralCode: string) => {
  const botUser = config.BOT_USERNAME;
  const refLink = `https://t.me/${botUser}?start=${referralCode}`;
  const shareText = encodeURIComponent(
    `🚀 Join InfiniteHits and get 50 Free Credits to promote your website or earn more credits by viewing top campaigns!\nJoin here: ${refLink}`
  );
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`;

  return new InlineKeyboard()
    .url('📤 Share Link', shareUrl)
    .row()
    .text('📊 Referral Stats', 'nav_referral_stats')
    .row()
    .text('🔙 Back', 'nav_main');
};

/**
 * Profile View Inline Keyboard
 */
export const profileInlineKeyboard = new InlineKeyboard()
  .text('💰 My Balance', 'nav_balance')
  .text('📊 Statistics', 'nav_stats')
  .row()
  .text('🏠 Main Menu', 'nav_main');

/**
 * Support View Inline Keyboard
 */
export const supportInlineKeyboard = () => {
  const kb = new InlineKeyboard();
  const supportUser = config.SUPPORT_USERNAME;

  if (supportUser) {
    kb.url('💬 Contact Support', `https://t.me/${supportUser}`).row();
  } else {
    kb.text('💬 Contact Support', 'support_contact_msg').row();
  }

  kb.text('❓ FAQ', 'support_faq_list')
    .row()
    .text('🏠 Main Menu', 'nav_main');

  return kb;
};

/**
 * FAQ List Inline Keyboard
 */
export const faqListInlineKeyboard = (questions: { id: string; title: string }[]) => {
  const kb = new InlineKeyboard();
  questions.forEach((q) => {
    kb.text(q.title, `faq_item_${q.id}`).row();
  });
  kb.text('🔙 Back', 'nav_support');
  return kb;
};

/**
 * FAQ Single Answer Inline Keyboard
 */
export const faqItemInlineKeyboard = new InlineKeyboard()
  .text('❓ All FAQs', 'support_faq_list')
  .row()
  .text('🏠 Main Menu', 'nav_main');

import { Context } from 'grammy';
import { db } from '../database/db';
import { referralInlineKeyboard, backToMainInlineKeyboard } from '../keyboards';
import { formatReferralScreen } from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleReferral = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const user = db.getUser(telegramId) || db.getOrCreateUser(telegramId, ctx.from.first_name || 'User').user;
  const text = formatReferralScreen(user);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: referralInlineKeyboard(user.referralCode),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: referralInlineKeyboard(user.referralCode),
    });
  }
};

export const handleReferralStats = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const referrals = db.getUserReferrals(telegramId);
  const user = db.getUser(telegramId);

  let text =
    `📊 *Referral Breakdown*\n\n` +
    `Total Invited: *${user?.referralCount || 0}*\n` +
    `Total Bonus Earned: *${user?.referralEarnings || 0} Credits*\n\n`;

  if (referrals.length === 0) {
    text += `No referrals yet. Share your referral link with friends to earn 100 Credits each!`;
  } else {
    text += `*Recent Referrals:*\n`;
    referrals.slice(0, 8).forEach((r) => {
      const statusIcon = r.rewardPaid ? '✅ Qualified (+100)' : '⏳ Pending first activity';
      text += `• ${r.referredName} (${statusIcon})\n`;
    });
  }

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  }
};
